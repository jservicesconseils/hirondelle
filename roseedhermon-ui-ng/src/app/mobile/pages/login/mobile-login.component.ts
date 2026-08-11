import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CognitoUser } from 'amazon-cognito-identity-js';

import { AuthService, GroupRequiredError, NewPasswordRequiredError } from '../../../core/auth/auth.service';
import { CurrentUser } from '../../../core/auth/auth.model';
import { MOCK_ACCOUNTS, MockAccount, MOCK_PASSWORD } from '../../../core/auth/mock-accounts';
import { GroupEntity } from '../../../shared/services/api/model/groupEntity';
import { MockDirectoryService } from '../../../core/auth/mock-directory.service';

/** Connexion de l'application mobile. */
@Component({
  selector: 'app-mobile-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mobile-login.component.html',
  styleUrls: ['./mobile-login.component.scss']
})
export class MobileLoginComponent implements OnInit {
  email = '';
  password = '';

  challenge: CognitoUser | null = null;
  newPassword = '';
  confirmation = '';

  busy = false;
  error = '';

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
    private router: Router
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

  get selectedAccount(): MockAccount | null {
    const needle = this.email.trim().toLowerCase();
    return this.accounts.find((account) => account.email === needle) ?? null;
  }

  get needsGroup(): boolean {
    return !!this.selectedAccount?.needsGroup;
  }

  pick(account: MockAccount): void {
    this.email = account.email;
    this.password = account.password;
    this.error = '';
    this.demoOpen = false;
    if (account.needsGroup && !this.groupId) this.groupId = this.groups[0]?.id ?? '';
  }

  async submit(): Promise<void> {
    if (this.busy) return;

    this.busy = true;
    this.error = '';

    try {
      const user = this.challenge ? await this.completeChallenge() : await this.signIn();
      if (user) this.leave(user);
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
    if (this.newPassword.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères.';
      return null;
    }
    if (this.newPassword !== this.confirmation) {
      this.error = 'Les deux mots de passe ne correspondent pas.';
      return null;
    }
    return this.auth.completeNewPassword(this.challenge!, this.newPassword);
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

    this.error = (error as Error)?.message || 'La connexion a échoué.';
  }

  /** Parcourir sans compte : seules les pages publiques resteront accessibles. */
  browse(): void {
    this.router.navigate(['/mobile/dashboard']);
  }

  private leave(_user: CurrentUser): void {
    if (this.redirect) {
      this.router.navigateByUrl(this.redirect);
      return;
    }
    // Même un administrateur reste sur le mobile après s'y être connecté :
    // l'espace de gestion est prévu pour un écran large.
    this.router.navigate(['/mobile/dashboard']);
  }
}
