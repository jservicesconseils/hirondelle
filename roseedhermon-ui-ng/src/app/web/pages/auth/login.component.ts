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
 * Les écrans de la page, qui se succèdent dans le même panneau : connexion,
 * inscription et son code de confirmation, connexion par téléphone et son
 * propre code, demande de code de réinitialisation, choix du nouveau mot de
 * passe, et le mot de passe provisoire imposé par Cognito à la première
 * connexion.
 */
export type LoginView =
  | 'signin'
  | 'signup'
  | 'confirm'
  | 'phone'
  | 'phone-code'
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

  email = '';
  password = '';
  remember = false;
  revealPassword = false;

  /** Connexion par téléphone : le numéro saisi, conservé pour l'attacher au compte. */
  phone = '';

  // Réinitialisation : le code reçu par courriel, puis le mot de passe choisi.
  code = '';
  newPassword = '';
  confirmation = '';

  // Mot de passe provisoire à remplacer, imposé par Cognito.
  challenge: CognitoUser | null = null;

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
    if (this.view === 'phone') return 'Connexion par téléphone';
    if (this.view === 'phone-code') return 'Confirmez le code';
    if (this.view === 'forgot') return 'Mot de passe oublié';
    if (this.view === 'reset') return 'Choisissez un nouveau mot de passe';
    if (this.view === 'challenge') return 'Choisissez votre mot de passe';
    return 'Bon retour parmi nous';
  }

  get lead(): string {
    if (this.view === 'signup') {
      return "Un compte suffit pour organiser votre propre événement — aucun groupe requis.";
    }
    if (this.view === 'confirm') {
      return `Saisissez le code à six chiffres envoyé à ${this.email.trim()}.`;
    }
    if (this.view === 'phone') {
      return "Indiquez le numéro de votre compte. Le code de vérification part par courriel pour " +
        "l'instant — le SMS suivra dès que le numéro sera activé.";
    }
    if (this.view === 'phone-code') {
      return `Saisissez le code à six chiffres envoyé à ${this.email.trim()}.`;
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
    if (this.view === 'signup') return 'Créer mon compte';
    if (this.view === 'confirm') return 'Confirmer';
    if (this.view === 'phone') return 'Recevoir mon code';
    if (this.view === 'phone-code') return 'Confirmer et me connecter';
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
      else if (this.view === 'signup') await this.doSignUp();
      else if (this.view === 'confirm') await this.doConfirmSignUp();
      else if (this.view === 'phone') await this.requestPhoneCode();
      else if (this.view === 'phone-code') await this.confirmPhoneCode();
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

  /** Part vers Google. La page ne revient qu'après le détour par Cognito. */
  async signInWithGoogle(): Promise<void> {
    this.error = '';
    try {
      await this.auth.signInWithGoogle(this.redirect || '/app/dashboard', this.remember);
    } catch (error) {
      this.error = (error as Error)?.message || "La connexion par Google n'a pas pu démarrer.";
    }
  }

  private signIn(): Promise<CurrentUser> {
    if (this.auth.configured) return this.auth.signIn(this.email.trim(), this.password, this.remember);
    return this.auth.signInMock(this.email, this.password, this.groupId, this.remember);
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

  private async doSignUp(): Promise<void> {
    const email = this.email.trim();
    const phone = toE164(this.phone.trim());
    if (!email) {
      this.error = 'Indiquez votre courriel.';
      return;
    }
    if (!phone) {
      this.error = 'Indiquez un numéro de téléphone valide.';
      return;
    }
    if (!this.auth.configured) {
      this.error = "L'inscription n'est disponible qu'une fois Cognito configuré.";
      return;
    }
    if (!this.passwordsAgree()) return;

    const { needsConfirmation } = await this.auth.signUp(email, this.newPassword, phone);
    // Conservé pour la connexion automatique une fois le compte confirmé.
    this.password = this.newPassword;

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
    await this.auth.confirmSignUp(this.email.trim(), this.code.trim());
    await this.signInAfterSignUp();
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

  /**
   * Connexion sans mot de passe, pour un compte qui existe déjà : le code
   * réutilise le mécanisme Cognito de réinitialisation, mais au lieu de
   * demander un mot de passe à retenir, on lui en attribue un aléatoire et on
   * enchaîne directement sur la connexion.
   */
  private async requestPhoneCode(): Promise<void> {
    const phone = toE164(this.phone.trim());
    if (!phone) {
      this.error = 'Indiquez un numéro de téléphone valide.';
      return;
    }
    if (!this.auth.configured) {
      this.error = 'La connexion par téléphone requiert Cognito.';
      return;
    }

    try {
      // Cognito garde le courriel comme identifiant : ce détour retrouve celui
      // du compte à partir du seul numéro que la personne a saisi.
      this.email = await this.auth.lookupEmailByPhone(phone);
    } catch {
      this.error = "Aucun compte n'est rattaché à ce numéro. Créez-en un d'abord.";
      return;
    }

    await this.auth.forgotPassword(this.email);
    this.code = '';
    this.show('phone-code');
    this.notice = `Un code à six chiffres a été envoyé à ${this.email}.`;
  }

  private async confirmPhoneCode(): Promise<void> {
    if (!this.code.trim()) {
      this.error = 'Saisissez le code reçu par courriel.';
      return;
    }

    const email = this.email.trim();
    const tempPassword = randomTempPassword();

    await this.auth.confirmPassword(email, this.code.trim(), tempPassword);
    const user = await this.auth.signIn(email, tempPassword, this.remember);

    // Accessoire : la connexion ne doit pas échouer pour un attribut secondaire.
    const phone = toE164(this.phone.trim());
    if (phone) this.auth.updatePhoneNumber(phone).catch(() => undefined);

    this.leave(user);
  }

  private async signInAfterSignUp(): Promise<void> {
    const user = await this.auth.signIn(this.email.trim(), this.password, this.remember);

    // Ce qui permettra la prochaine connexion par téléphone à retrouver ce compte.
    const phone = toE164(this.phone.trim());
    if (phone) this.auth.registerAccountPhone(phone).catch(() => undefined);

    this.leave(user);
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
      this.show('challenge');
      return;
    }

    if (error instanceof GroupRequiredError) {
      this.error = this.groups.length
        ? 'Choisissez le groupe auquel rattacher ce compte.'
        : "Aucun groupe n'existe encore : créez-en un avec le compte super administrateur.";
      return;
    }

    // Cognito répond en anglais ; ce cas est fréquent (l'inscription) pour qu'il
    // reste seul dans la langue de la page.
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
 * Mot de passe jetable, jamais vu par la personne : la connexion par téléphone
 * enchaîne aussitôt sur `signIn`. Construit pour satisfaire à coup sûr la
 * politique par défaut de Cognito (majuscule, minuscule, chiffre, symbole,
 * huit caractères) sans dépendre de ce qu'un générateur aléatoire produirait.
 */
function randomTempPassword(): string {
  return `Aa1!${crypto.randomUUID()}`;
}
