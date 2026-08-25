import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
  ICognitoStorage
} from 'amazon-cognito-identity-js';

import { environment } from '../../../environments/environment';
import { ANONYMOUS, CurrentUser, Feature, FEATURES, Role, ROLES } from './auth.model';
import { findMockAccount, MockAccount } from './mock-accounts';
import {
  authorizeUrl,
  exchangeCode,
  forget,
  hostedUiConfig,
  HostedUiConfig,
  returnUrl,
  stateMatches
} from './hosted-ui';

const MOCK_SESSION_KEY = 'rdh.mock.session';
const FEDERATED_KEY = 'rdh.auth.federated';
const REMEMBER_KEY = 'rdh.auth.remember';
const REMEMBERED_EMAIL_KEY = 'rdh.auth.email';

/** Session simulée, telle qu'elle est conservée entre deux rechargements. */
interface MockSession {
  email: string;
  role: Role;
  groupId: string;
}

/** Jetons obtenus par Google, conservés entre deux rechargements. */
interface FederatedSession {
  idToken: string;
  refreshToken: string;
  /** Instant d'expiration, en millisecondes. */
  expiresAt: number;
}

/**
 * Authentification par Amazon Cognito.
 *
 * Le pool est décrit dans `environment.cognito`. Tant qu'il n'est pas renseigné —
 * le cas du poste de développement — `configured` vaut faux et l'application
 * bascule sur une **connexion simulée** : les comptes de `mock-accounts.ts`
 * choisissent le rôle et le groupe que le serveur appliquera, par les en-têtes
 * `X-Dev-*` qu'il n'écoute que dans ce même cas.
 *
 * Le jeton d'identité (`idToken`) est celui envoyé au backend en production : il
 * porte le courriel, les groupes Cognito et l'attribut `custom:groupId`. Il est
 * obtenu soit par le formulaire, soit par Google — voir `hosted-ui.ts`.
 *
 * « Se souvenir de moi » n'est pas cosmétique : il décide de l'endroit où la
 * session est écrite. Cochée, elle va dans `localStorage` et survit à la
 * fermeture du navigateur ; décochée, dans `sessionStorage` et disparaît avec
 * l'onglet. C'est `SessionStore` qui applique ce choix, y compris aux jetons que
 * la bibliothèque Cognito écrit elle-même.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly pool: CognitoUserPool | null;
  private readonly hosted: HostedUiConfig | null;
  private readonly store = new SessionStore();

  /** Utilisateur courant, rechargé depuis `/api/v1/me`. */
  readonly user = signal<CurrentUser>(ANONYMOUS);
  readonly isAuthenticated = computed(() => this.user().sub !== null);
  readonly isSuperAdmin = computed(() => this.user().roles.includes(ROLES.SUPER_ADMIN));
  readonly isGroupAdmin = computed(() => this.user().roles.includes(ROLES.GROUP_ADMIN));
  readonly canAdminister = computed(() => this.isSuperAdmin() || this.isGroupAdmin());

  /**
   * Modules ouverts à la personne connectée, tels que le serveur les a calculés
   * à partir de son groupe. Un visiteur n'en a aucun — ce qui ne l'empêche pas de
   * consulter le catalogue public, lequel ne dépend d'aucun module.
   */
  readonly features = computed<Feature[]>(() => this.user().features ?? []);
  readonly canSeeEvents = computed(() => this.features().includes(FEATURES.EVENTS));
  readonly canSeeMembers = computed(() => this.features().includes(FEATURES.MEMBERS));

  private cachedToken = '';

  /**
   * Session simulée courante. Nulle tant que personne n'est connecté : sans elle,
   * l'intercepteur n'envoie aucun en-tête `X-Dev-*` et le serveur ne voit qu'un
   * visiteur anonyme.
   */
  readonly mockSession = signal<MockSession | null>(null);

  constructor(private http: HttpClient) {
    const cognito = environment.cognito ?? { userPoolId: '', clientId: '' };
    const { userPoolId, clientId } = cognito;

    this.pool =
      userPoolId && clientId
        ? new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId, Storage: this.store })
        : null;

    this.hosted = hostedUiConfig(cognito, location.origin);

    if (!this.pool) this.mockSession.set(readMockSession(this.store));
  }

  /** Faux tant que le pool Cognito n'est pas renseigné dans l'environnement. */
  get configured(): boolean {
    return this.pool !== null;
  }

  /** Vrai quand le domaine hébergé est renseigné : la connexion Google est possible. */
  get googleAvailable(): boolean {
    return this.hosted !== null;
  }

  /** Jeton à joindre aux appels API. Vide si personne n'est connecté. */
  get idToken(): string {
    return this.cachedToken;
  }

  // --- « Se souvenir de moi » ---------------------------------------------------------

  get remember(): boolean {
    return this.store.remember;
  }

  set remember(value: boolean) {
    this.store.remember = value;
  }

  /** Courriel de la dernière connexion retenue, pour pré-remplir le formulaire. */
  get rememberedEmail(): string {
    return this.store.remember ? safeRead(localStorage, REMEMBERED_EMAIL_KEY) ?? '' : '';
  }

  private rememberEmail(email: string): void {
    // Décocher la case efface le courriel des deux stockages : le déplacement de
    // `SessionStore` a pu le faire passer de l'un à l'autre.
    if (this.store.remember) safeWrite(localStorage, REMEMBERED_EMAIL_KEY, email);
    else this.store.removeItem(REMEMBERED_EMAIL_KEY);
  }

  // --- Session -----------------------------------------------------------------------

  signIn(email: string, password: string, remember = this.remember): Promise<CurrentUser> {
    this.remember = remember;
    if (!this.pool) return this.signInMock(email, password, '', remember);

    const user = new CognitoUser({ Username: email, Pool: this.pool, Storage: this.store });
    const details = new AuthenticationDetails({ Username: email, Password: password });

    return new Promise<CurrentUser>((resolve, reject) => {
      user.authenticateUser(details, {
        onSuccess: (session) => {
          this.cachedToken = session.getIdToken().getJwtToken();
          this.rememberEmail(email.trim());
          this.loadCurrentUser().then(resolve).catch(reject);
        },
        onFailure: (error) => reject(error),
        // Premier mot de passe imposé par l'administrateur : il faut le changer.
        newPasswordRequired: () => reject(new NewPasswordRequiredError(user))
      });
    });
  }

  /**
   * Connexion simulée. `groupId` n'est utile qu'aux rôles rattachés à un groupe ;
   * il est ignoré pour le super administrateur, qui les voit tous.
   */
  async signInMock(
    email: string,
    password: string,
    groupId = '',
    remember = this.remember
  ): Promise<CurrentUser> {
    if (this.pool) return Promise.reject(new Error('La connexion simulée est désactivée : Cognito est configuré.'));

    const account = findMockAccount(email, password);
    if (!account) throw new InvalidCredentialsError();
    if (account.needsGroup && !groupId) throw new GroupRequiredError(account);

    this.remember = remember;

    const session: MockSession = {
      email: account.email,
      role: account.role,
      groupId: account.needsGroup ? groupId : ''
    };

    this.mockSession.set(session);
    this.store.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    this.rememberEmail(account.email);

    // L'identité définitive vient du serveur, qui applique lui-même le rôle.
    const user = await this.loadCurrentUser();
    if (!user.sub) {
      // Le serveur n'a pas reconnu la session : ne pas la laisser à moitié ouverte.
      this.signOut();
      throw new Error("Le serveur n'a pas accepté la session. Vérifiez que la passerelle répond.");
    }
    return user;
  }

  // --- Inscription libre ---------------------------------------------------------------

  /**
   * N'importe qui peut créer un compte — sans groupe ni rôle d'administration,
   * exactement ce qu'il faut pour organiser un événement public par soi-même
   * (l'anniversaire d'un enfant, par exemple). Le serveur lui donnera le rôle
   * `MEMBER` par défaut, faute de groupe Cognito : voir `toRoles` côté serveur.
   *
   * `phoneNumber`, au format E.164, est posé sur le compte Cognito — utile le
   * jour où le SMS sera activé — mais ne sert pas encore à retrouver le
   * compte : c'est `registerAccountPhone` qui alimente cette recherche, dans
   * notre propre base plutôt que dans Cognito.
   */
  signUp(email: string, password: string, phoneNumber?: string): Promise<{ needsConfirmation: boolean }> {
    if (!this.pool) return Promise.reject(new Error("Cognito n'est pas configuré."));
    const trimmed = email.trim();
    const attributes = [new CognitoUserAttribute({ Name: 'email', Value: trimmed })];
    if (phoneNumber) attributes.push(new CognitoUserAttribute({ Name: 'phone_number', Value: phoneNumber }));

    return new Promise((resolve, reject) => {
      this.pool!.signUp(trimmed, password, attributes, [], (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ needsConfirmation: !(result?.userConfirmed ?? false) });
      });
    });
  }

  /** Associe ce numéro au compte de la session, pour la connexion par téléphone. */
  registerAccountPhone(phoneNumber: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${environment.host}/api/v1/auth/phone`, { phone: phoneNumber }));
  }

  /** Numéro déjà enregistré pour la session, ou `null` — pour préremplir le profil. */
  getAccountPhone(): Promise<string | null> {
    return firstValueFrom(this.http.get<{ phone: string | null }>(`${environment.host}/api/v1/auth/phone`)).then(
      (response) => response.phone
    );
  }

  /** Courriel du compte associé à ce numéro. Rejette si aucun ne correspond. */
  lookupEmailByPhone(phoneNumber: string): Promise<string> {
    return firstValueFrom(
      this.http.get<{ email: string }>(`${environment.host}/api/v1/auth/phone/${encodeURIComponent(phoneNumber)}`)
    ).then((response) => response.email);
  }

  /** Code à six chiffres envoyé par courriel à l'inscription. */
  confirmSignUp(email: string, code: string): Promise<void> {
    if (!this.pool) return Promise.reject(new Error("Cognito n'est pas configuré."));
    const user = new CognitoUser({ Username: email.trim(), Pool: this.pool, Storage: this.store });
    return new Promise((resolve, reject) => {
      user.confirmRegistration(code, true, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  resendSignUpCode(email: string): Promise<void> {
    if (!this.pool) return Promise.reject(new Error("Cognito n'est pas configuré."));
    const user = new CognitoUser({ Username: email.trim(), Pool: this.pool, Storage: this.store });
    return new Promise((resolve, reject) => {
      user.resendConfirmationCode((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  /** Deuxième étape lorsque Cognito impose un nouveau mot de passe. */
  completeNewPassword(user: CognitoUser, password: string): Promise<CurrentUser> {
    return new Promise<CurrentUser>((resolve, reject) => {
      user.completeNewPasswordChallenge(
        password,
        {},
        {
          onSuccess: (session) => {
            this.cachedToken = session.getIdToken().getJwtToken();
            this.loadCurrentUser().then(resolve).catch(reject);
          },
          onFailure: (error) => reject(error)
        }
      );
    });
  }

  // --- Connexion par Google -----------------------------------------------------------

  /**
   * Quitte l'application pour l'interface hébergée de Cognito, qui enchaîne sur
   * Google. La page reviendra sur `/auth/callback`.
   */
  async signInWithGoogle(afterLogin: string, remember = this.remember): Promise<void> {
    if (!this.hosted) {
      throw new Error(
        "La connexion par Google n'est pas encore activée : le domaine Cognito reste à renseigner dans l'environnement."
      );
    }
    this.remember = remember;
    location.assign(await authorizeUrl(this.hosted, 'Google', afterLogin));
  }

  /**
   * Termine le retour de Google. `state` est vérifié avant tout : c'est ce qui
   * distingue notre propre aller-retour d'un code glissé par un tiers.
   */
  async completeFederatedSignIn(code: string, state: string | null): Promise<CurrentUser> {
    if (!this.hosted) throw new Error("La connexion par Google n'est pas configurée.");
    if (!stateMatches(state)) {
      forget();
      throw new Error('La réponse ne correspond pas à la demande de connexion. Recommencez.');
    }

    const tokens = await exchangeCode(this.hosted, code);
    this.keepFederated(tokens.idToken, tokens.refreshToken, tokens.expiresIn);

    const user = await this.loadCurrentUser();
    if (!user.sub) {
      this.signOut();
      throw new Error("Le serveur n'a pas reconnu ce compte Google. Demandez à un administrateur de le rattacher à un groupe.");
    }
    if (user.email) this.rememberEmail(user.email);
    return user;
  }

  /** Page à rouvrir après le retour de Google. */
  get pendingReturnUrl(): string {
    return returnUrl();
  }

  // --- Reprise et fermeture ------------------------------------------------------------

  /** Restaure la session enregistrée au démarrage de l'application. */
  async restore(): Promise<CurrentUser> {
    if (!this.pool) {
      // Aucune session simulée : on reste anonyme, comme un visiteur du site.
      if (!this.mockSession()) {
        this.user.set(ANONYMOUS);
        return ANONYMOUS;
      }
      return this.loadCurrentUser();
    }

    // Une session Google prime : la bibliothèque Cognito ne la connaît pas.
    const federated = await this.restoreFederated();
    if (federated) return this.loadCurrentUser();

    const user = this.pool.getCurrentUser();
    if (!user) {
      this.user.set(ANONYMOUS);
      return ANONYMOUS;
    }

    return new Promise<CurrentUser>((resolve) => {
      user.getSession((error: Error | null, session: CognitoUserSession | null) => {
        if (error || !session?.isValid()) {
          this.user.set(ANONYMOUS);
          resolve(ANONYMOUS);
          return;
        }
        this.cachedToken = session.getIdToken().getJwtToken();
        this.loadCurrentUser().then(resolve).catch(() => resolve(ANONYMOUS));
      });
    });
  }

  signOut(): void {
    this.pool?.getCurrentUser()?.signOut();
    this.cachedToken = '';
    this.mockSession.set(null);
    this.store.removeItem(MOCK_SESSION_KEY);
    this.store.removeItem(FEDERATED_KEY);
    forget();
    this.user.set(ANONYMOUS);
  }

  forgotPassword(email: string): Promise<void> {
    if (!this.pool) return Promise.reject(new Error("Cognito n'est pas configuré."));
    const user = new CognitoUser({ Username: email, Pool: this.pool, Storage: this.store });
    return new Promise((resolve, reject) => {
      user.forgotPassword({ onSuccess: () => resolve(), onFailure: (error) => reject(error) });
    });
  }

  /**
   * Attache le numéro à la session ouverte — appelé après une connexion par
   * téléphone, pour que le compte le porte la prochaine fois. Best-effort :
   * l'appelant ignore un échec plutôt que de faire capoter la connexion pour
   * un attribut secondaire.
   */
  updatePhoneNumber(phoneNumber: string): Promise<void> {
    const user = this.pool?.getCurrentUser();
    if (!user) return Promise.reject(new Error('Aucune session ouverte.'));

    return new Promise((resolve, reject) => {
      user.getSession((error: Error | null) => {
        if (error) {
          reject(error);
          return;
        }
        user.updateAttributes([new CognitoUserAttribute({ Name: 'phone_number', Value: phoneNumber })], (updateError) => {
          if (updateError) {
            reject(updateError);
            return;
          }
          resolve();
        });
      });
    });
  }

  confirmPassword(email: string, code: string, password: string): Promise<void> {
    if (!this.pool) return Promise.reject(new Error("Cognito n'est pas configuré."));
    const user = new CognitoUser({ Username: email, Pool: this.pool, Storage: this.store });
    return new Promise((resolve, reject) => {
      user.confirmPassword(code, password, { onSuccess: () => resolve(), onFailure: (error) => reject(error) });
    });
  }

  // --- Profil ------------------------------------------------------------------------

  /** Recharge l'identité depuis le backend, seule source des rôles et du groupe. */
  loadCurrentUser(): Promise<CurrentUser> {
    return firstValueFrom(this.fetchCurrentUser());
  }

  fetchCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.host}/api/v1/me`).pipe(
      tap((profile) => this.user.set({ ...ANONYMOUS, ...profile })),
      catchError(() => {
        this.user.set(ANONYMOUS);
        return of(ANONYMOUS);
      })
    );
  }

  hasRole(role: Role): boolean {
    return this.user().roles.includes(role);
  }

  // --- Jetons Google -------------------------------------------------------------------

  private keepFederated(idToken: string, refreshToken: string, expiresIn: number): void {
    this.cachedToken = idToken;
    const session: FederatedSession = {
      idToken,
      refreshToken,
      expiresAt: Date.now() + Math.max(0, expiresIn) * 1000
    };
    this.store.setItem(FEDERATED_KEY, JSON.stringify(session));
  }

  /**
   * Reprend les jetons Google. Un jeton d'identité ne vit qu'une heure : passé ce
   * délai on le renouvelle en silence, et faute de quoi on repart anonyme plutôt
   * que d'envoyer au serveur un jeton qu'il refusera.
   */
  private async restoreFederated(): Promise<boolean> {
    const session = readFederated(this.store);
    if (!session) return false;

    // Une minute de marge : le jeton ne doit pas expirer pendant l'appel qui suit.
    if (session.expiresAt - 60_000 > Date.now()) {
      this.cachedToken = session.idToken;
      return true;
    }

    if (!this.hosted || !session.refreshToken) {
      this.store.removeItem(FEDERATED_KEY);
      return false;
    }

    try {
      const refreshed = await this.refresh(session.refreshToken);
      this.keepFederated(refreshed.idToken, session.refreshToken, refreshed.expiresIn);
      return true;
    } catch {
      this.store.removeItem(FEDERATED_KEY);
      return false;
    }
  }

  private async refresh(refreshToken: string): Promise<{ idToken: string; expiresIn: number }> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.hosted!.clientId,
      refresh_token: refreshToken
    });

    const response = await fetch(`https://${this.hosted!.domain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    if (!response.ok) throw new Error('refresh refusé');

    const payload = (await response.json()) as Record<string, string | number>;
    const idToken = String(payload['id_token'] ?? '');
    if (!idToken) throw new Error('aucun jeton rendu');

    return { idToken, expiresIn: Number(payload['expires_in'] ?? 0) };
  }
}

// --- Erreurs -------------------------------------------------------------------------

/** Levée quand Cognito exige le changement du mot de passe provisoire. */
export class NewPasswordRequiredError extends Error {
  constructor(readonly cognitoUser: CognitoUser) {
    super('NEW_PASSWORD_REQUIRED');
    this.name = 'NewPasswordRequiredError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Courriel ou mot de passe incorrect.');
    this.name = 'InvalidCredentialsError';
  }
}

/** Levée quand le compte choisi doit être rattaché à un groupe. */
export class GroupRequiredError extends Error {
  constructor(readonly account: MockAccount) {
    super('Choisissez le groupe auquel rattacher ce compte.');
    this.name = 'GroupRequiredError';
  }
}

// --- Persistance -----------------------------------------------------------------------

/**
 * Stockage à deux étages, branché aussi bien sur nos propres clés que sur celles
 * que la bibliothèque Cognito écrit d'elle-même.
 *
 * Écriture : `localStorage` si l'utilisateur a demandé qu'on se souvienne de lui,
 * `sessionStorage` sinon — et jamais les deux, sous peine de laisser derrière soi
 * la session qu'on venait justement de ne pas vouloir garder.
 *
 * Lecture : les deux, en commençant par la plus courte. Basculer la case à cocher
 * déplace donc l'existant au lieu de le perdre.
 */
class SessionStore implements ICognitoStorage {
  private remembered = safeRead(localStorage, REMEMBER_KEY) === '1';

  get remember(): boolean {
    return this.remembered;
  }

  set remember(value: boolean) {
    if (value === this.remembered) return;

    const from = value ? sessionStorage : localStorage;
    const to = value ? localStorage : sessionStorage;
    move(from, to);

    this.remembered = value;
    if (value) safeWrite(localStorage, REMEMBER_KEY, '1');
    else safeRemove(localStorage, REMEMBER_KEY);
  }

  private get target(): Storage {
    return this.remembered ? localStorage : sessionStorage;
  }

  getItem(key: string): string | null {
    return safeRead(sessionStorage, key) ?? safeRead(localStorage, key);
  }

  setItem(key: string, value: string): void {
    safeWrite(this.target, key, value);
    safeRemove(this.remembered ? sessionStorage : localStorage, key);
  }

  removeItem(key: string): void {
    safeRemove(sessionStorage, key);
    safeRemove(localStorage, key);
  }

  clear(): void {
    ourKeys(sessionStorage).forEach((key) => safeRemove(sessionStorage, key));
    ourKeys(localStorage).forEach((key) => safeRemove(localStorage, key));
  }
}

/** Clés qui nous appartiennent : les nôtres, et celles de la bibliothèque Cognito. */
function ourKeys(storage: Storage): string[] {
  const keys: string[] = [];
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key && (key.startsWith('rdh.') || key.startsWith('CognitoIdentityServiceProvider'))) keys.push(key);
    }
  } catch {
    // Stockage refusé : rien à déplacer.
  }
  return keys;
}

function move(from: Storage, to: Storage): void {
  ourKeys(from).forEach((key) => {
    if (key === REMEMBER_KEY) return;
    const value = safeRead(from, key);
    if (value !== null) safeWrite(to, key, value);
    safeRemove(from, key);
  });
}

function readMockSession(store: SessionStore): MockSession | null {
  try {
    const raw = store.getItem(MOCK_SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as MockSession) : null;
    return parsed?.email && parsed?.role ? parsed : null;
  } catch {
    return null;
  }
}

function readFederated(store: SessionStore): FederatedSession | null {
  try {
    const raw = store.getItem(FEDERATED_KEY);
    const parsed = raw ? (JSON.parse(raw) as FederatedSession) : null;
    return parsed?.idToken ? parsed : null;
  } catch {
    return null;
  }
}

// Le stockage peut être refusé (navigation privée) : la session reste en mémoire.

function safeRead(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch (error) {
    console.warn('Session non enregistrée', error);
  }
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    /* rien à faire */
  }
}
