import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MobileFooterComponent } from './mobile-footer.component';
import { AppLanguage, LanguageService } from '../../core/language.service';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Coquille des écrans mobiles : elle occupe exactement la fenêtre, la page défile
 * à l'intérieur, et la barre de navigation est le dernier élément de la colonne.
 *
 * Elle n'est donc pas en `position: fixed` — les règles globales de `styles.scss`
 * (`app-root { height: 100%; overflow-y: auto }`) font de la racine un conteneur de
 * défilement séparé, ce qui décrochait la barre du bas de l'écran.
 */
@Component({
  selector: 'app-mobile-tabs',
  standalone: true,
  imports: [CommonModule, RouterModule, MobileFooterComponent, TranslatePipe],
  template: `
    <div class="mobile-shell">
      <div class="mobile-scroll">
        <router-outlet></router-outlet>
      </div>
      <app-mobile-footer></app-mobile-footer>
    </div>

    <!-- Personne connectée : nom et photo, toujours visibles en haut à droite,
         quel que soit l'écran — cliquer y mène directement au profil. -->
    <button type="button" class="user-badge" *ngIf="auth.isAuthenticated() && displayName" (click)="goToProfile()">
      <span class="badge-name">{{ displayName }}</span>
      <span class="badge-avatar">
        <img *ngIf="photo" [src]="photo" alt="" />
        <ng-container *ngIf="!photo">{{ initials }}</ng-container>
      </span>
    </button>

    <!-- Premier lancement uniquement : disparaît dès qu'une langue est choisie
         (LanguageService.hasChosenLanguage), et ne réapparaît plus ensuite. -->
    <div class="lang-veil" *ngIf="!languageChosen">
      <div class="lang-card">
        <h1>{{ 'language.title' | translate }}</h1>
        <p>{{ 'language.subtitle' | translate }}</p>
        <div class="lang-options">
          <button type="button" (click)="pick('fr')">Français</button>
          <button type="button" (click)="pick('en')">English</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .mobile-shell {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      background: #f4f5f7;
      overflow: hidden;
    }

    /* Seule cette zone défile. */
    .mobile-scroll {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .lang-veil {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: linear-gradient(135deg, #1e3a8a 0%, #f4551d 130%);
    }

    .lang-card {
      width: 100%;
      max-width: 360px;
      background: #fff;
      border-radius: 24px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 24px 60px rgba(16, 28, 48, 0.35);
    }

    .lang-card h1 { margin: 0 0 8px; font-size: 20px; font-weight: 800; color: #1a1c22; }
    .lang-card p { margin: 0 0 24px; font-size: 14px; color: #6b7178; }

    .lang-options { display: flex; flex-direction: column; gap: 12px; }

    .lang-options button {
      height: 52px;
      border: 1px solid #e6e9ee;
      border-radius: 14px;
      background: #f9fafb;
      font: inherit;
      font-size: 16px;
      font-weight: 700;
      color: #1a1c22;
      cursor: pointer;
    }

    .lang-options button:active { background: #2563eb; color: #fff; border-color: transparent; }

    /* Personne connectée, en haut à droite : par-dessus tout le reste, sur
       n'importe quel écran, où que la page en soit défilée. */
    .user-badge {
      position: fixed;
      top: calc(env(safe-area-inset-top, 0px) + 12px);
      right: 12px;
      z-index: 1200;
      display: flex;
      align-items: center;
      gap: 7px;
      border: none;
      padding: 5px 6px 5px 12px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 999px;
      box-shadow: 0 8px 20px rgba(16, 28, 48, 0.18);
      cursor: pointer;
      max-width: 62vw;
    }

    .badge-name {
      font-size: 13px;
      font-weight: 700;
      color: #1a1c22;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badge-avatar {
      flex: 0 0 auto;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      overflow: hidden;
    }

    .badge-avatar img { width: 100%; height: 100%; object-fit: cover; }
  `]
})
export class MobileTabsComponent {
  languageChosen: boolean;

  constructor(
    private language: LanguageService,
    public auth: AuthService,
    private router: Router
  ) {
    this.languageChosen = this.language.hasChosenLanguage();
  }

  pick(lang: AppLanguage): void {
    this.language.setLanguage(lang);
    this.languageChosen = true;
  }

  /** Prénom et nom de la personne connectée ; rien d'inventé sans fiche liée. */
  get displayName(): string {
    const member = this.auth.user().member;
    const full = `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim();
    if (full) return full;
    return this.auth.user().email?.split('@')[0] || '';
  }

  get photo(): string {
    return (this.auth.user().member?.photo || '').trim();
  }

  get initials(): string {
    const member = this.auth.user().member;
    const letters = `${member?.firstName?.charAt(0) ?? ''}${member?.lastName?.charAt(0) ?? ''}`.trim();
    if (letters) return letters.toUpperCase();
    return (this.auth.user().email?.charAt(0) ?? '').toUpperCase();
  }

  goToProfile(): void {
    this.router.navigate(['/mobile/profile']);
  }
}
