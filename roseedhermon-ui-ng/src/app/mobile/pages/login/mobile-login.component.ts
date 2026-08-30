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

/** Les écrans qui se succèdent dans la même feuille : connexion, inscription, son code, et le
 *  choix du mot de passe qui clôt la réclamation d'une fiche déjà importée. */
export type MobileLoginView = 'signin' | 'signup' | 'confirm' | 'claimPassword';

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

  /** Connexion : par courriel ou par le numéro déjà au dossier — un mot de passe dans les deux cas. */
  signinMethod: 'password' | 'phone' = 'password';

  /** Inscription : nouvelle personne (par courriel) ou fiche déjà importée à réclamer par téléphone. */
  signupMethod: 'phone' | 'email' = 'email';
  phone = '';

  /**
   * Quel mécanisme Cognito l'étape « confirm » doit finaliser, une fois le code
   * saisi : `signup` pour une inscription classique, aussitôt suivie de la
   * connexion ; `claim` pour la réclamation d'une fiche déjà importée, qui
   * enchaîne plutôt sur l'écran de choix du mot de passe (`claimPassword`).
   */
  private phoneLoginPending: 'claim' | 'signup' | null = null;

  /** Utilisateur obtenu par la connexion provisoire de la réclamation, en attendant le vrai mot de passe. */
  private claimedUser: CurrentUser | null = null;

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
  ) {
    // Le mobile n'a pas de case « Se souvenir de moi » comme le site : une appli
    // reste connectée jusqu'à une déconnexion volontaire, point final. `remember`
    // décide où la session s'écrit (localStorage, qui survit à la fermeture de
    // l'appli, plutôt que sessionStorage, qui n'y survit pas) — les appels de
    // connexion plus bas s'y réfèrent tous par défaut, poser ce drapeau une
    // bonne fois pour toutes ici suffit à couvrir chacun d'eux.
    this.auth.remember = true;
  }

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
    if (this.view === 'claimPassword') return 'Choisissez votre mot de passe';
    if (this.view === 'signup') return 'Créer un compte';
    if (this.view === 'confirm') return 'Confirmez votre courriel';
    return 'Bienvenue';
  }

  get lead(): string {
    if (this.challenge) return 'Remplacez le mot de passe reçu par texto.';
    if (this.view === 'claimPassword') {
      return 'Ce mot de passe vous servira à vous connecter la prochaine fois, par téléphone ou par courriel.';
    }
    if (this.view === 'signup' && this.signupMethod === 'phone') {
      return "Indiquez le numéro et le courriel déjà au dossier : nous vérifions votre fiche, puis vous choisirez votre mot de passe.";
    }
    if (this.view === 'signup') return "Un compte suffit pour retrouver vos événements et vos billets.";
    if (this.view === 'confirm') return `Saisissez le code à six chiffres envoyé à ${this.email.trim()}.`;
    if (this.view === 'signin' && this.signinMethod === 'phone') {
      return 'Connectez-vous avec le numéro déjà au dossier et votre mot de passe.';
    }
    return 'Connectez-vous pour retrouver votre groupe, vos événements et vos billets.';
  }

  get submitLabel(): string {
    if (this.busy) return 'Un instant…';
    if (this.challenge) return 'Enregistrer';
    if (this.view === 'claimPassword') return 'Enregistrer mon mot de passe';
    if (this.view === 'signup' && this.signupMethod === 'phone') return 'Vérifier mon numéro';
    if (this.view === 'signup') return 'Créer mon compte';
    if (this.view === 'confirm') return 'Confirmer';
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

  /**
   * Bascule entre les deux façons de se connecter ; le mot de passe sert aux
   * deux, seul l'identifiant change (courriel, ou numéro déjà au dossier).
   */
  chooseSigninMethod(method: 'password' | 'phone'): void {
    this.signinMethod = method;
    this.error = '';
    if (method === 'phone') {
      this.email = '';
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
      } else if (this.view === 'claimPassword') {
        await this.doClaimPassword();
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

  /**
   * Courriel/mot de passe comme d'habitude, ou le numéro déjà au dossier : dans
   * les deux cas un mot de passe, retrouver le courriel qui va avec est la seule
   * différence pour une fiche déjà importée.
   */
  private async signIn(): Promise<CurrentUser> {
    if (!this.auth.configured) return this.auth.signInMock(this.email, this.password, this.groupId);

    if (this.signinMethod === 'phone') {
      const phone = toE164(this.phone.trim());
      if (!phone) throw new Error('Indiquez un numéro de téléphone valide.');
      try {
        this.email = await this.auth.lookupEmailByPhone(phone);
      } catch {
        throw new Error("Aucune fiche n'est rattachée à ce numéro. Vérifiez-le, ou créez un compte.");
      }
    }

    return this.auth.signIn(this.email.trim(), this.password);
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
   * Réclame une fiche déjà dans l'annuaire (importée par un administrateur),
   * même si la personne ne s'est encore jamais connectée.
   *
   * Le numéro doit retrouver, côté serveur, exactement le courriel que la
   * personne vient de saisir — c'est cette double correspondance qui tient
   * lieu de preuve d'identité, avant même le code envoyé par courriel juste
   * après : sans elle, quiconque connaît le numéro et le courriel d'un autre
   * membre (visibles dans l'annuaire une fois connecté) pourrait réclamer sa
   * fiche à sa place. Le mot de passe définitif ne se choisit qu'à l'écran
   * suivant (`claimPassword`), une fois le code confirmé — celui posé ici
   * n'est qu'un mot de passe provisoire, jamais montré.
   */
  private async doSignUpByPhone(): Promise<void> {
    const phone = toE164(this.phone.trim());
    const email = this.email.trim();
    if (!phone) {
      this.error = 'Indiquez un numéro de téléphone valide.';
      return;
    }
    if (!email) {
      this.error = 'Indiquez votre courriel.';
      return;
    }
    if (!this.auth.configured) {
      this.error = "La réclamation d'une fiche n'est disponible qu'une fois Cognito configuré.";
      return;
    }

    let onFile: string;
    try {
      onFile = await this.auth.lookupEmailByPhone(phone);
    } catch {
      this.error = "Aucune fiche n'est rattachée à ce numéro. Vérifiez-le, ou créez un compte.";
      return;
    }
    if (onFile.trim().toLowerCase() !== email.toLowerCase()) {
      this.error = "Ce courriel ne correspond pas au numéro indiqué.";
      return;
    }
    this.email = onFile;

    this.password = randomTempPassword();
    this.phoneLoginPending = 'claim';
    const { needsConfirmation } = await this.auth.signUp(onFile, this.password, phone);
    await this.afterSignUp(onFile, needsConfirmation);
  }

  private async afterSignUp(email: string, needsConfirmation: boolean): Promise<void> {
    if (needsConfirmation) {
      this.code = '';
      this.show('confirm');
      this.notice = `Un code à six chiffres a été envoyé à ${email}.`;
      return;
    }

    // Improbable (pool configuré pour confirmer d'emblée) : on saute directement
    // à l'étape qui suivrait la confirmation du code.
    await this.afterConfirm();
  }

  private async doConfirmSignUp(): Promise<void> {
    if (!this.code.trim()) {
      this.error = 'Saisissez le code reçu par courriel.';
      return;
    }

    await this.auth.confirmSignUp(this.email.trim(), this.code.trim());
    await this.afterConfirm();
  }

  /** Ce qui suit la confirmation du code : connexion finale pour une inscription
   *  classique, ou choix du vrai mot de passe pour la réclamation d'une fiche. */
  private async afterConfirm(): Promise<void> {
    if (this.phoneLoginPending === 'claim') {
      // Connexion provisoire, avec le mot de passe jamais montré posé par
      // `doSignUpByPhone` — nécessaire pour pouvoir le remplacer ensuite par
      // celui que la personne va choisir (`AuthService.changePassword`).
      this.claimedUser = await this.auth.signIn(this.email.trim(), this.password);
      this.newPassword = '';
      this.confirmation = '';
      this.show('claimPassword');
      return;
    }

    await this.signInAfterSignUp();
  }

  /** Dernière étape de la réclamation d'une fiche : le vrai mot de passe remplace le provisoire. */
  private async doClaimPassword(): Promise<void> {
    if (!this.passwordsAgree()) return;

    await this.auth.changePassword(this.password, this.newPassword);
    this.password = this.newPassword;

    // Ce qui permettra la prochaine connexion par téléphone d'aller plus vite.
    const phone = toE164(this.phone.trim());
    if (phone) this.auth.registerAccountPhone(phone).catch(() => undefined);

    if (this.claimedUser) this.leave(this.claimedUser);
  }

  /** Le code Cognito arrive parfois filtré dans les indésirables, ou expire. */
  async resendCode(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await this.auth.resendSignUpCode(this.email.trim());
      this.notice = `Un nouveau code a été envoyé à ${this.email.trim()}. Pensez à vérifier vos indésirables.`;
    } catch (error) {
      this.error = (error as Error)?.message || "L'envoi du code a échoué.";
    } finally {
      this.busy = false;
    }
  }

  /** Connexion finale d'une inscription classique (par courriel) : le mot de passe choisi fait foi. */
  private async signInAfterSignUp(): Promise<void> {
    const user = await this.auth.signIn(this.email.trim(), this.password);

    // Best-effort : la connexion ne doit pas échouer si l'écriture du nom
    // échoue, la personne pourra le corriger sur son profil.
    try {
      await this.auth.updateName(this.firstName.trim(), this.lastName.trim());
    } catch (error) {
      console.warn("Le nom n'a pas pu être enregistré à l'inscription", error);
    }

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
