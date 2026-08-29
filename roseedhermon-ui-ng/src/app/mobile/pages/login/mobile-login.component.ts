import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CognitoUser } from 'amazon-cognito-identity-js';

import { AuthService, GroupRequiredError, NewPasswordRequiredError } from '../../../core/auth/auth.service';
import { firstAvailableMobileRoute, PlatformSettingsService } from '../../../core/platform-settings.service';
import { CurrentUser } from '../../../core/auth/auth.model';
import { MOCK_ACCOUNTS, MockAccount, MOCK_PASSWORD } from '../../../core/auth/mock-accounts';
import { GroupEntity } from '../../../shared/services/api/model/groupEntity';
import { MockDirectoryService } from '../../../core/auth/mock-directory.service';
import { toE164 } from '../../../shared/utils/phone';

/** Les écrans qui se succèdent dans la même feuille : connexion, inscription, et son code. */
export type MobileLoginView = 'signin' | 'signup' | 'confirm';

/** Connexion et inscription de l'application mobile. */
@Component({
  selector: 'app-mobile-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mobile-login.component.html',
  styleUrls: ['./mobile-login.component.scss']
})
export class MobileLoginComponent implements OnInit {
  view: MobileLoginView = 'signin';

  email = '';
  password = '';

  /** Connexion : par courriel/mot de passe, ou par le seul numéro pour une fiche déjà importée. */
  signinMethod: 'password' | 'phone' = 'password';

  /** Inscription : par téléphone (sans mot de passe) ou par courriel — même bascule que sur le site. */
  signupMethod: 'phone' | 'email' = 'email';
  phone = '';

  /**
   * Quel mécanisme Cognito l'étape « confirm » doit finaliser, une fois le code
   * saisi : `signup` pour une inscription classique, `reset` pour la connexion
   * par téléphone d'une fiche déjà importée (voir `requestPhoneLogin`) — les deux
   * envoient un code par courriel qui se ressemble en tout point à l'écran, mais
   * ne se confirment pas du tout de la même façon côté Cognito.
   */
  private phoneLoginPending: 'reset' | 'signup' | null = null;

  // Identité : demandée à l'inscription, quelle que soit la méthode choisie.
  firstName = '';
  lastName = '';

  // Mot de passe (inscription par courriel) puis sa confirmation ; réutilisés par le
  // mot de passe provisoire imposé par Cognito à la première connexion.
  newPassword = '';
  confirmation = '';

  // Code reçu par courriel, à la confirmation d'une inscription.
  code = '';

  challenge: CognitoUser | null = null;

  busy = false;
  error = '';
  notice = '';

  groups: GroupEntity[] = [];
  groupId = '';

  /** Le panneau des comptes de démonstration est replié par défaut. */
  demoOpen = false;

  readonly accounts = MOCK_ACCOUNTS;
  readonly demoPassword = MOCK_PASSWORD;

  private redirect = '';

  constructor(
    public auth: AuthService,
    private directory: MockDirectoryService,
    private route: ActivatedRoute,
    private router: Router,
    private settings: PlatformSettingsService
  ) {}

  ngOnInit(): void {
    this.redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '';

    if (this.auth.isAuthenticated()) {
      this.leave(this.auth.user());
      return;
    }

    if (!this.auth.configured) {
      this.directory.groups().subscribe({
        next: (groups) => {
          this.groups = groups;
          this.groupId = this.groupId || groups[0]?.id || '';
        },
        error: () => undefined
      });
    }
  }

  // --- État de l'écran ----------------------------------------------------------------

  get title(): string {
    if (this.challenge) return 'Nouveau mot de passe';
    if (this.view === 'signup') return 'Créer un compte';
    if (this.view === 'confirm') return 'Confirmez votre courriel';
    return 'Bienvenue';
  }

  get lead(): string {
    if (this.challenge) return 'Remplacez le mot de passe reçu par texto.';
    if (this.view === 'signup') return "Un compte suffit pour retrouver vos événements et vos billets.";
    if (this.view === 'confirm') return `Saisissez le code à six chiffres envoyé à ${this.email.trim()}.`;
    if (this.view === 'signin' && this.signinMethod === 'phone') {
      return 'Déjà dans notre annuaire ? Indiquez le numéro déjà au dossier : nous vous enverrons un code par courriel.';
    }
    return 'Connectez-vous pour retrouver votre groupe, vos événements et vos billets.';
  }

  get submitLabel(): string {
    if (this.busy) return 'Un instant…';
    if (this.challenge) return 'Enregistrer';
    if (this.view === 'signup') return 'Créer mon compte';
    if (this.view === 'confirm') return 'Confirmer';
    if (this.view === 'signin' && this.signinMethod === 'phone') return 'Recevoir mon code';
    return 'Se connecter';
  }

  get selectedAccount(): MockAccount | null {
    const needle = this.email.trim().toLowerCase();
    return this.accounts.find((account) => account.email === needle) ?? null;
  }

  get needsGroup(): boolean {
    return !!this.selectedAccount?.needsGroup;
  }

  show(view: MobileLoginView): void {
    this.view = view;
    this.error = '';
    this.notice = '';
  }

  /** Bascule entre les deux façons de se connecter ; chacune n'utilise que ses propres champs. */
  chooseSigninMethod(method: 'password' | 'phone'): void {
    this.signinMethod = method;
    this.error = '';
    if (method === 'phone') {
      this.email = '';
      this.password = '';
    } else {
      this.phone = '';
    }
  }

  /** Bascule entre les deux façons de créer un compte ; chacune n'utilise que ses propres champs. */
  chooseSignupMethod(method: 'phone' | 'email'): void {
    this.signupMethod = method;
    this.error = '';
    if (method === 'phone') {
      this.newPassword = '';
      this.confirmation = '';
    } else {
      this.phone = '';
    }
  }

  pick(account: MockAccount): void {
    this.email = account.email;
    this.password = account.password;
    this.error = '';
    this.demoOpen = false;
    if (account.needsGroup && !this.groupId) this.groupId = this.groups[0]?.id ?? '';
  }

  // --- Envoi ----------------------------------------------------------------------------

  async submit(): Promise<void> {
    if (this.busy) return;

    this.busy = true;
    this.error = '';

    try {
      if (this.view === 'signup') {
        await (this.signupMethod === 'phone' ? this.doSignUpByPhone() : this.doSignUpByEmail());
      } else if (this.view === 'confirm') {
        await this.doConfirmSignUp();
      } else if (this.view === 'signin' && this.signinMethod === 'phone' && !this.challenge) {
        await this.requestPhoneLogin();
      } else {
        const user = this.challenge ? await this.completeChallenge() : await this.signIn();
        if (user) this.leave(user);
      }
    } catch (error) {
      this.handle(error);
    } finally {
      this.busy = false;
    }
  }

  private signIn(): Promise<CurrentUser> {
    if (this.auth.configured) return this.auth.signIn(this.email.trim(), this.password);
    return this.auth.signInMock(this.email, this.password, this.groupId);
  }

  private async completeChallenge(): Promise<CurrentUser | null> {
    if (!this.passwordsAgree()) return null;
    return this.auth.completeNewPassword(this.challenge!, this.newPassword);
  }

  private async doSignUpByEmail(): Promise<void> {
    const email = this.email.trim();
    if (!this.identityProvided()) return;
    if (!email) {
      this.error = 'Indiquez votre courriel.';
      return;
    }
    if (!this.auth.configured) {
      this.error = "L'inscription n'est disponible qu'une fois Cognito configuré.";
      return;
    }
    if (!this.passwordsAgree()) return;

    this.phoneLoginPending = 'signup';
    const { needsConfirmation } = await this.auth.signUp(email, this.newPassword);
    // Conservé pour la connexion automatique une fois le compte confirmé.
    this.password = this.newPassword;
    await this.afterSignUp(email, needsConfirmation);
  }

  /**
   * Sans mot de passe : un mot de passe aléatoire est attribué en coulisses et
   * jamais montré. Le compte reste identifié par courriel côté Cognito — c'est
   * le numéro qui, lui, sera retrouvé via `account_phones` à la prochaine connexion.
   */
  private async doSignUpByPhone(): Promise<void> {
    const email = this.email.trim();
    const phone = toE164(this.phone.trim());
    if (!this.identityProvided()) return;
    if (!phone) {
      this.error = 'Indiquez un numéro de téléphone valide.';
      return;
    }
    if (!email) {
      this.error = 'Indiquez votre courriel.';
      return;
    }
    if (!this.auth.configured) {
      this.error = "L'inscription n'est disponible qu'une fois Cognito configuré.";
      return;
    }

    this.password = randomTempPassword();
    this.phoneLoginPending = 'signup';
    const { needsConfirmation } = await this.auth.signUp(email, this.password, phone);
    await this.afterSignUp(email, needsConfirmation);
  }

  /**
   * Connexion sans mot de passe, pour une fiche déjà dans l'annuaire (importée
   * par un administrateur) même si la personne ne s'est encore jamais connectée.
   *
   * Le numéro retrouve son courriel côté serveur (`/api/v1/auth/phone/:phone`,
   * qui regarde d'abord un compte déjà lié, puis la fiche elle-même). Reste
   * ensuite à savoir si un compte Cognito existe déjà pour ce courriel : le cas
   * échéant, on réinitialise son mot de passe (comme sur le site) ; sinon, ce
   * numéro n'a encore jamais servi à se connecter et on crée le compte à la
   * volée, exactement comme l'inscription par téléphone juste au-dessus. Les
   * deux envoient un code à six chiffres par courriel, l'écran qui suit est le
   * même — seule la façon de le confirmer diffère (`phoneLoginPending`).
   */
  private async requestPhoneLogin(): Promise<void> {
    const phone = toE164(this.phone.trim());
    if (!phone) {
      this.error = 'Indiquez un numéro de téléphone valide.';
      return;
    }
    if (!this.auth.configured) {
      this.error = 'La connexion par téléphone requiert Cognito.';
      return;
    }

    let email: string;
    try {
      email = await this.auth.lookupEmailByPhone(phone);
    } catch {
      this.error = "Aucune fiche n'est rattachée à ce numéro. Vérifiez-le, ou créez un compte.";
      return;
    }
    this.email = email;

    try {
      await this.auth.forgotPassword(email);
      this.phoneLoginPending = 'reset';
    } catch (error) {
      if ((error as { code?: string })?.code !== 'UserNotFoundException') {
        this.handle(error);
        return;
      }
      // Fiche importée, jamais encore connectée : pas de compte Cognito à
      // réinitialiser, on le crée — le mot de passe restera toujours inconnu
      // de la personne, `signInAfterSignUp` enchaîne dessus après le code.
      this.password = randomTempPassword();
      this.phoneLoginPending = 'signup';
      await this.auth.signUp(email, this.password);
    }

    this.code = '';
    this.show('confirm');
    this.notice = `Un code à six chiffres a été envoyé à ${email}.`;
  }

  private async afterSignUp(email: string, needsConfirmation: boolean): Promise<void> {
    if (needsConfirmation) {
      this.code = '';
      this.show('confirm');
      this.notice = `Un code à six chiffres a été envoyé à ${email}.`;
      return;
    }

    await this.signInAfterSignUp();
  }

  private async doConfirmSignUp(): Promise<void> {
    if (!this.code.trim()) {
      this.error = 'Saisissez le code reçu par courriel.';
      return;
    }

    const email = this.email.trim();
    const code = this.code.trim();

    if (this.phoneLoginPending === 'reset') {
      // Le mot de passe temporaire de `requestPhoneLogin` n'a pas survécu si la
      // personne a quitté l'écran entre-temps ; un nouveau ne coûte rien de plus.
      this.password = randomTempPassword();
      await this.auth.confirmPassword(email, code, this.password);
    } else {
      await this.auth.confirmSignUp(email, code);
    }

    await this.signInAfterSignUp();
  }

  /** Le code Cognito arrive parfois filtré dans les indésirables, ou expire. */
  async resendCode(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      if (this.phoneLoginPending === 'reset') {
        await this.auth.forgotPassword(this.email.trim());
      } else {
        await this.auth.resendSignUpCode(this.email.trim());
      }
      this.notice = `Un nouveau code a été envoyé à ${this.email.trim()}. Pensez à vérifier vos indésirables.`;
    } catch (error) {
      this.error = (error as Error)?.message || "L'envoi du code a échoué.";
    } finally {
      this.busy = false;
    }
  }

  private async signInAfterSignUp(): Promise<void> {
    const user = await this.auth.signIn(this.email.trim(), this.password);

    // Rien à écrire pour la connexion par téléphone d'une fiche déjà importée :
    // Prénom/Nom n'ont jamais été demandés, et le nom est déjà sur la fiche.
    // Écrire ces champs vides écraserait celui déjà enregistré à l'import.
    if (this.firstName.trim() || this.lastName.trim()) {
      // Best-effort, comme le numéro juste en dessous : la connexion ne doit pas
      // échouer si l'écriture du nom échoue, la personne pourra le corriger sur son profil.
      try {
        await this.auth.updateName(this.firstName.trim(), this.lastName.trim());
      } catch (error) {
        console.warn("Le nom n'a pas pu être enregistré à l'inscription", error);
      }
    }

    // Ce qui permettra la prochaine connexion par téléphone d'aller plus vite.
    const phone = toE164(this.phone.trim());
    if (phone) this.auth.registerAccountPhone(phone).catch(() => undefined);

    this.leave(user);
  }

  /** Prénom et nom : demandés à l'inscription, quelle que soit la méthode. */
  private identityProvided(): boolean {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.error = 'Indiquez votre prénom et votre nom.';
      return false;
    }
    return true;
  }

  /** Parcourir sans compte : seules les pages publiques resteront accessibles. */
  browse(): void {
    this.router.navigate(['/mobile/dashboard']);
  }

  /** Les deux règles communes aux deux écrans de saisie d'un mot de passe. */
  private passwordsAgree(): boolean {
    if (this.newPassword.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères.';
      return false;
    }
    if (this.newPassword !== this.confirmation) {
      this.error = 'Les deux mots de passe ne correspondent pas.';
      return false;
    }
    return true;
  }

  private handle(error: unknown): void {
    if (error instanceof NewPasswordRequiredError) {
      this.challenge = error.cognitoUser;
      this.error = '';
      return;
    }

    if (error instanceof GroupRequiredError) {
      this.error = this.groups.length
        ? 'Choisissez votre groupe.'
        : "Aucun groupe n'existe encore sur ce serveur.";
      return;
    }

    // Cognito répond en anglais ; ce cas est fréquent (l'inscription) pour qu'il
    // reste seul dans la langue de la page.
    const code = (error as { code?: string })?.code;
    if (code === 'UsernameExistsException') {
      this.error = 'Un compte existe déjà avec ce courriel. Connectez-vous plutôt.';
      return;
    }

    this.error = (error as Error)?.message || 'La connexion a échoué.';
  }

  private async leave(_user: CurrentUser): Promise<void> {
    if (this.redirect) {
      this.router.navigateByUrl(this.redirect);
      return;
    }
    // Même un administrateur reste sur le mobile après s'y être connecté :
    // l'espace de gestion est prévu pour un écran large. La destination précise
    // dépend des modules que le super admin a laissés ouverts (Accueil est le
    // fil des événements : rien à y montrer si ce module est coupé).
    const modules = await this.settings.ready();
    this.router.navigate([firstAvailableMobileRoute(modules)]);
  }
}

/**
 * Mot de passe jetable, jamais vu par la personne : l'inscription par
 * téléphone enchaîne aussitôt sur la connexion. Construit pour satisfaire à
 * coup sûr la politique par défaut de Cognito (majuscule, minuscule, chiffre,
 * symbole, huit caractères) sans dépendre de ce qu'un générateur aléatoire
 * produirait.
 */
function randomTempPassword(): string {
  return `Aa1!${crypto.randomUUID()}`;
}
