import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CognitoUser } from 'amazon-cognito-identity-js';

import {
  AuthService,
  GroupRequiredError,
  NewPasswordRequiredError
} from '../../../core/auth/auth.service';
import { CurrentUser, ROLES } from '../../../core/auth/auth.model';
import { MOCK_ACCOUNTS, MockAccount, MOCK_PASSWORD } from '../../../core/auth/mock-accounts';
import { GroupEntity } from '../../../shared/services/api/model/groupEntity';
import { MockDirectoryService } from '../../../core/auth/mock-directory.service';
import { toE164 } from '../../../shared/utils/phone';

/**
 * Les écrans de la page, qui se succèdent dans le même panneau. Ils reprennent
 * exactement ceux de l'application mobile — connexion par un champ unique
 * (courriel ou numéro déjà au dossier), inscription d'un nouveau membre ou
 * réclamation d'une fiche importée avec son code puis le choix du mot de
 * passe — auxquels le web ajoute ses propres commodités : « mot de passe
 * oublié » (`forgot` / `reset`) et le mot de passe provisoire imposé par
 * Cognito à la première connexion (`challenge`).
 */
export type LoginView =
  | 'signin'
  | 'signup'
  | 'confirm'
  | 'claimPassword'
  | 'forgot'
  | 'reset'
  | 'challenge';

/**
 * Illustration de la moitié droite : la photo de rue en fête, le même fichier que
 * la septième vue du carrousel d'accueil. Tant qu'il n'est pas déposé, une photo
 * déjà présente prend le relais — la page n'est jamais amputée de sa moitié.
 */
const POSTER = 'media/showcase/celebration.jpg';
const POSTER_FALLBACK = 'media/showcase/conference-pleniere.jpg';

/** Connexion à l'espace d'administration. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  view: LoginView = 'signin';

  /**
   * Connexion : un seul champ, courriel ou numéro déjà au dossier — les deux
   * mènent au même compte, avec le même mot de passe. `signIn()` reconnaît
   * lequel des deux a été saisi. Sert aussi de champ courriel à l'inscription
   * et à la réinitialisation.
   */
  email = '';
  password = '';
  remember = false;
  revealPassword = false;

  /** Inscription par téléphone : le numéro de la fiche à réclamer. */
  phone = '';

  /** Inscription : nouvelle personne (par courriel) ou fiche déjà importée à réclamer par téléphone. */
  signupMethod: 'phone' | 'email' = 'email';

  // Identité : demandée à l'inscription d'un nouveau membre.
  firstName = '';
  lastName = '';

  // Réinitialisation / choix du mot de passe : le code reçu, puis le mot de passe et sa confirmation.
  code = '';
  newPassword = '';
  confirmation = '';

  // Mot de passe provisoire à remplacer, imposé par Cognito.
  challenge: CognitoUser | null = null;

  /**
   * Quel mécanisme Cognito l'étape « confirm » doit finaliser une fois le code
   * saisi : `signup` pour une inscription classique, aussitôt suivie de la
   * connexion ; `claim` pour la réclamation d'une fiche déjà importée, qui
   * enchaîne sur l'écran de choix du mot de passe (`claimPassword`).
   */
  private phoneLoginPending: 'claim' | 'signup' | null = null;

  /** Utilisateur obtenu par la connexion provisoire de la réclamation, en attendant le vrai mot de passe. */
  private claimedUser: CurrentUser | null = null;

  busy = false;
  error = '';
  notice = '';

  /** Groupes proposés à la connexion simulée, chargés depuis l'API. */
  groups: GroupEntity[] = [];
  groupId = '';
  groupsLoading = false;

  /** Vignettes de démonstration, repliées par défaut pour ne pas encombrer. */
  demoOpen = false;
  readonly accounts = MOCK_ACCOUNTS;
  readonly demoPassword = MOCK_PASSWORD;

  poster: string | null = POSTER;

  private redirect = '';

  constructor(
    public auth: AuthService,
    private directory: MockDirectoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '';

    if (this.auth.isAuthenticated()) {
      this.leave(this.auth.user());
      return;
    }

    this.remember = this.auth.remember;
    this.email = this.auth.rememberedEmail;

    if (!this.auth.configured) this.loadGroups();
  }

  // --- État de l'écran ----------------------------------------------------------------

  get title(): string {
    if (this.view === 'signup') return 'Créer un compte';
    if (this.view === 'confirm') return 'Confirmez votre courriel';
    if (this.view === 'claimPassword') return 'Choisissez votre mot de passe';
    if (this.view === 'forgot') return 'Mot de passe oublié';
    if (this.view === 'reset') return 'Choisissez un nouveau mot de passe';
    if (this.view === 'challenge') return 'Choisissez votre mot de passe';
    return 'Bon retour parmi nous';
  }

  get lead(): string {
    if (this.view === 'signup' && this.signupMethod === 'phone') {
      return "Indiquez le numéro et le courriel déjà au dossier : nous vérifions votre fiche, puis vous choisirez votre mot de passe.";
    }
    if (this.view === 'signup') {
      return "Un compte suffit pour organiser votre propre événement — aucun groupe requis.";
    }
    if (this.view === 'confirm') {
      return `Saisissez le code à six chiffres envoyé à ${this.email.trim()}.`;
    }
    if (this.view === 'claimPassword') {
      return 'Ce mot de passe vous servira à vous connecter la prochaine fois, par téléphone ou par courriel.';
    }
    if (this.view === 'forgot') {
      return 'Indiquez le courriel de votre compte : nous vous enverrons un code à six chiffres.';
    }
    if (this.view === 'reset') return 'Saisissez le code reçu, puis le mot de passe que vous souhaitez utiliser.';
    if (this.view === 'challenge') {
      return 'Votre mot de passe provisoire doit être remplacé avant la première utilisation.';
    }
    return 'Retrouvez vos groupes, vos membres et vos événements.';
  }

  get submitLabel(): string {
    if (this.busy) return 'Un instant…';
    if (this.view === 'signup' && this.signupMethod === 'phone') return 'Vérifier mon numéro';
    if (this.view === 'signup') return 'Créer mon compte';
    if (this.view === 'confirm') return 'Confirmer';
    if (this.view === 'claimPassword') return 'Enregistrer mon mot de passe';
    if (this.view === 'forgot') return 'Envoyer le code';
    if (this.view === 'reset') return 'Enregistrer le mot de passe';
    if (this.view === 'challenge') return 'Enregistrer et continuer';
    return 'Se connecter';
  }

  /** Vrai quand le compte saisi doit être rattaché à un groupe. */
  get selectedAccount(): MockAccount | null {
    const needle = this.email.trim().toLowerCase();
    return this.accounts.find((account) => account.email === needle) ?? null;
  }

  get needsGroup(): boolean {
    return !!this.selectedAccount?.needsGroup;
  }

  show(view: LoginView): void {
    this.view = view;
    this.error = '';
    this.notice = '';
    if (view === 'signin') {
      this.phoneLoginPending = null;
      this.claimedUser = null;
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

  /**
   * Une photo absente laisse sa place à la suivante, puis au dégradé : la page
   * garde sa composition en deux moitiés dans tous les cas.
   */
  onPosterMissing(): void {
    this.poster = this.poster === POSTER ? POSTER_FALLBACK : null;
  }

  /**
   * Les groupes sont lus sans session : le serveur, non configuré lui non plus,
   * répond à un visiteur anonyme. C'est seulement pour peupler la liste.
   */
  private loadGroups(): void {
    this.groupsLoading = true;
    this.directory.groups().subscribe({
      next: (groups) => {
        this.groups = groups;
        this.groupId = this.groupId || groups[0]?.id || '';
        this.groupsLoading = false;
      },
      error: () => {
        this.groupsLoading = false;
      }
    });
  }

  /** Remplit le formulaire depuis une des vignettes de démonstration. */
  pick(account: MockAccount): void {
    this.email = account.email;
    this.password = account.password;
    this.error = '';
    if (account.needsGroup && !this.groupId) this.groupId = this.groups[0]?.id ?? '';
  }

  // --- Envoi --------------------------------------------------------------------------

  async submit(): Promise<void> {
    if (this.busy) return;

    this.busy = true;
    this.error = '';

    try {
      if (this.view === 'forgot') await this.sendCode();
      else if (this.view === 'reset') await this.applyNewPassword();
      else if (this.view === 'signup') {
        await (this.signupMethod === 'phone' ? this.doSignUpByPhone() : this.doSignUpByEmail());
      }
      else if (this.view === 'confirm') await this.doConfirmSignUp();
      else if (this.view === 'claimPassword') await this.doClaimPassword();
      else {
        const user = this.view === 'challenge' ? await this.completeChallenge() : await this.signIn();
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
    const identifier = this.email.trim();
    if (!this.auth.configured) return this.auth.signInMock(identifier, this.password, this.groupId, this.remember);

    // Un « @ » ne trompe pas : sinon on tente le numéro déjà au dossier, sa
    // seule autre forme possible ici — un même mot de passe sert aux deux.
    if (!identifier.includes('@')) {
      const phone = toE164(identifier);
      if (!phone) throw new Error('Indiquez un courriel ou un numéro de téléphone valide.');
      try {
        this.email = await this.auth.lookupEmailByPhone(phone);
      } catch {
        throw new Error("Aucune fiche n'est rattachée à ce numéro. Vérifiez-le, ou créez un compte.");
      }
    }

    return this.auth.signIn(this.email.trim(), this.password, this.remember);
  }

  /**
   * Demande le code de réinitialisation. En local, aucun courriel ne part : le
   * dire est plus utile que de simuler un envoi qui n'aura pas lieu.
   */
  private async sendCode(): Promise<void> {
    const email = this.email.trim();
    if (!email) {
      this.error = 'Indiquez le courriel de votre compte.';
      return;
    }

    if (!this.auth.configured) {
      this.error =
        "En environnement local, aucun courriel n'est envoyé : les comptes de démonstration utilisent tous le mot de passe « " +
        this.demoPassword +
        ' ».';
      return;
    }

    await this.auth.forgotPassword(email);
    this.show('reset');
    this.notice = `Un code à six chiffres a été envoyé à ${email}. Il expire au bout d'une heure.`;
  }

  private async applyNewPassword(): Promise<void> {
    if (!this.code.trim()) {
      this.error = 'Saisissez le code reçu par courriel.';
      return;
    }
    if (!this.passwordsAgree()) return;

    await this.auth.confirmPassword(this.email.trim(), this.code.trim(), this.newPassword);
    this.code = '';
    this.password = '';
    this.newPassword = '';
    this.confirmation = '';
    this.show('signin');
    this.notice = 'Mot de passe modifié. Vous pouvez vous connecter.';
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
   * après. Le mot de passe définitif ne se choisit qu'à l'écran suivant
   * (`claimPassword`), une fois le code confirmé — celui posé ici n'est qu'un
   * mot de passe provisoire, jamais montré.
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
      this.claimedUser = await this.auth.signIn(this.email.trim(), this.password, this.remember);
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
    const user = await this.auth.signIn(this.email.trim(), this.password, this.remember);

    // Best-effort : la connexion ne doit pas échouer si l'écriture du nom
    // échoue, la personne pourra le corriger sur son profil.
    try {
      await this.auth.updateName(this.firstName.trim(), this.lastName.trim());
    } catch (error) {
      console.warn("Le nom n'a pas pu être enregistré à l'inscription", error);
    }

    this.leave(user);
  }

  /** Prénom et nom : demandés à l'inscription d'un nouveau membre. */
  private identityProvided(): boolean {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.error = 'Indiquez votre prénom et votre nom.';
      return false;
    }
    return true;
  }

  /** Les deux règles communes à tous les écrans de saisie d'un mot de passe. */
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
      this.show('challenge');
      return;
    }

    if (error instanceof GroupRequiredError) {
      this.error = this.groups.length
        ? 'Choisissez le groupe auquel rattacher ce compte.'
        : "Aucun groupe n'existe encore : créez-en un avec le compte super administrateur.";
      return;
    }

    // Cognito répond en anglais ; ces cas sont fréquents (l'inscription) pour
    // qu'ils restent seuls dans la langue de la page.
    const code = (error as { code?: string })?.code;
    if (code === 'UsernameExistsException') {
      this.error = 'Un compte existe déjà avec ce courriel. Connectez-vous plutôt.';
      return;
    }
    if (code === 'UserNotFoundException' && this.view === 'forgot') {
      this.error = "Aucun compte n'est rattaché à ce courriel. Créez-en un d'abord.";
      return;
    }

    this.error = (error as Error)?.message || 'La connexion a échoué.';
  }

  /** Chacun arrive sur l'espace qui lui correspond. */
  private leave(user: CurrentUser): void {
    if (this.redirect) {
      this.router.navigateByUrl(this.redirect);
      return;
    }

    if (user.roles.includes(ROLES.SUPER_ADMIN)) {
      this.router.navigate(['/app/groups']);
      return;
    }
    if (user.roles.includes(ROLES.GROUP_ADMIN)) {
      this.router.navigate(['/app/dashboard']);
      return;
    }

    // Un membre s'est connecté depuis le navigateur : il reste sur le site, avec
    // son agenda. L'envoyer vers `/mobile` lui donnerait la coquille du téléphone
    // sur un écran de bureau.
    this.router.navigate(['/web/mes-evenements']);
  }
}

/**
 * Mot de passe jetable, jamais vu par la personne : la réclamation d'une fiche
 * enchaîne aussitôt sur `signIn`, puis sur le choix du vrai mot de passe.
 * Construit pour satisfaire à coup sûr la politique par défaut de Cognito
 * (majuscule, minuscule, chiffre, symbole, huit caractères) sans dépendre de ce
 * qu'un générateur aléatoire produirait.
 */
function randomTempPassword(): string {
  return `Aa1!${crypto.randomUUID()}`;
}
