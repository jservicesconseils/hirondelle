import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

/**
 * Page de retour de Google.
 *
 * Cognito y renvoie le navigateur avec un code à usage unique. L'échange se fait
 * ici, puis la page s'efface : personne n'est censé s'y attarder. En cas d'échec,
 * on affiche la raison plutôt que de rediriger en silence vers un formulaire qui
 * semblerait n'avoir rien fait.
 */
@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="callback">
      <ng-container *ngIf="!error">
        <span class="spinner" aria-hidden="true"></span>
        <p>Connexion en cours…</p>
      </ng-container>

      <ng-container *ngIf="error">
        <i class="pi pi-times-circle"></i>
        <h1>La connexion n'a pas abouti</h1>
        <p>{{ error }}</p>
        <a routerLink="/login">Revenir à la connexion</a>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .callback {
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 0.9rem;
        min-height: 100vh;
        padding: 2rem;
        background: #fdf6f1;
        color: #14243c;
        font-family: 'Lato', 'Segoe UI', system-ui, sans-serif;
        text-align: center;
      }

      h1 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 800;
      }

      p {
        margin: 0;
        max-width: 30rem;
        color: #667a92;
        line-height: 1.6;
      }

      i {
        color: #f4551d;
        font-size: 2rem;
      }

      a {
        margin-top: 0.5rem;
        padding: 0.7rem 1.4rem;
        border-radius: 999px;
        background: #f4551d;
        color: #fff;
        font-weight: 700;
        text-decoration: none;
      }

      .spinner {
        width: 34px;
        height: 34px;
        border: 3px solid rgba(244, 85, 29, 0.25);
        border-top-color: #f4551d;
        border-radius: 50%;
        animation: turn 0.8s linear infinite;
      }

      @keyframes turn {
        to {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .spinner {
          animation-duration: 3s;
        }
      }
    `
  ]
})
export class OauthCallbackComponent implements OnInit {
  error = '';

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const parameters = this.route.snapshot.queryParamMap;

    // Refus côté Google ou côté Cognito : la raison est dans l'URL.
    const refusal = parameters.get('error_description') ?? parameters.get('error');
    if (refusal) {
      this.error = refusal;
      return;
    }

    const code = parameters.get('code');
    if (!code) {
      this.error = "Aucun code d'autorisation n'a été reçu.";
      return;
    }

    try {
      const target = this.auth.pendingReturnUrl;
      await this.auth.completeFederatedSignIn(code, parameters.get('state'));
      this.router.navigateByUrl(target || '/app/dashboard');
    } catch (error) {
      this.error = (error as Error)?.message || 'La connexion a échoué.';
    }
  }
}
