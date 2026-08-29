import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { PlatformSettingsService } from '../../core/platform-settings.service';

/**
 * Barre de navigation basse : rail bleu profond flottant, l'onglet courant
 * prenant la forme d'une pastille claire où l'icône et le libellé se placent
 * côte à côte.
 *
 * Le bleu profond répond au menu vertical de l'administration : c'est la même
 * famille de navigation, sur les deux plateformes.
 */
@Component({
  selector: 'app-mobile-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="bottom-nav">
      <!-- Coupée pour tout le monde par le super admin, l'onglet Accueil (le fil des
           événements) disparaît comme les autres — voir PlatformSettingsService. -->
      <button type="button"
              class="nav-item"
              *ngIf="settings.modules().mobileEvents"
              [class.active]="isActive('/mobile/dashboard')"
              (click)="go('/mobile/dashboard')">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span>Accueil</span>
      </button>

      <!-- L'annuaire n'existe que pour les groupes auxquels le module est attribué,
           et seulement si le super admin ne l'a pas coupé pour toute l'application. -->
      <button type="button"
              class="nav-item"
              *ngIf="auth.canSeeMembers() && settings.modules().mobileContacts"
              [class.active]="isActive('/mobile/members')"
              (click)="go('/mobile/members')">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
        <span>Contacts</span>
      </button>

      <button type="button"
              class="nav-item"
              *ngIf="settings.modules().mobileTickets"
              [class.active]="isActive('/mobile/tickets')"
              (click)="go('/mobile/tickets')">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4zm-5.5 6L12 12.6 9.5 14l.7-2.8-2.2-1.9 2.9-.2L12 6.5l1.1 2.6 2.9.2-2.2 1.9.7 2.8z" />
        </svg>
        <span>Billets</span>
      </button>

      <button type="button"
              class="nav-item"
              *ngIf="settings.modules().mobileProfile"
              [class.active]="isActive('/mobile/profile')"
              (click)="go('/mobile/profile')">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        <span>Profil</span>
      </button>
    </nav>

    <!-- Purement décoratif : un repère de bas d'écran, comme le modèle. -->
    <span class="handle"></span>
  `,
  styles: [`
    /* Dernier élément de la colonne de la coquille mobile : aucun positionnement
       absolu, donc la barre reste collée au bas de l'écran quoi qu'il arrive. */
    :host {
      flex: 0 0 auto;
      display: block;
      z-index: 900;
      padding: 6px 14px calc(12px + env(safe-area-inset-bottom, 0px));
      background: linear-gradient(180deg, rgba(253, 246, 241, 0) 0%, rgba(253, 246, 241, 0.92) 55%);
    }

    /* Rail bleu profond, comme le menu vertical de l'administration. */
    .bottom-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      padding: 7px;
      background: rgba(15, 45, 92, 0.95);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 26px;
      box-shadow: 0 14px 34px rgba(16, 28, 48, 0.35);
      font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .nav-item {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 9px 4px;
      border: none;
      background: none;
      border-radius: 20px;
      color: rgba(255, 255, 255, 0.62);
      font: inherit;
      cursor: pointer;
      transition: color 0.2s ease, background 0.2s ease;
    }

    .nav-item:active { color: #fff; }

    .nav-item svg { width: 23px; height: 23px; flex-shrink: 0; }

    .nav-item span {
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    /**
     * Onglet courant : pastille bleu vif, icône et libellé sur une même ligne.
     * Le bleu vif sur le rail bleu profond se distingue à la volée, comme le
     * modèle — sans recourir au blanc, réservé aux cartes du contenu.
     */
    .nav-item.active {
      flex: 0 0 auto;
      flex-direction: row;
      gap: 7px;
      padding: 10px 16px;
      background: #2563eb;
      color: #fff;
      box-shadow: 0 4px 14px -2px rgba(37, 99, 235, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
    }

    .nav-item.active span {
      font-size: 14px;
      font-weight: 800;
      color: #fff;
    }

    /* Un point orange sous la pastille : l'accent de la charte, sans la dominer. */
    .nav-item.active::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -6px;
      width: 16px;
      height: 3px;
      border-radius: 2px;
      background: #f4551d;
      transform: translateX(-50%);
    }

    .nav-item { position: relative; }

    /* Purement décoratif : le repère de bas d'écran qu'on trouve sous les barres
       flottantes des applications mobiles. */
    .handle {
      display: block;
      width: 32px;
      height: 4px;
      margin: 10px auto 0;
      border-radius: 999px;
      background: rgba(15, 45, 92, 0.16);
    }

    @media (max-width: 360px) {
      .nav-item.active span { font-size: 13px; }
      .nav-item span { font-size: 10px; }
    }
  `]
})
export class MobileFooterComponent implements OnInit {
  currentRoute = '';

  constructor(
    private router: Router,
    public auth: AuthService,
    public settings: PlatformSettingsService
  ) {}

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => (this.currentRoute = event.url));
  }

  go(path: string): void {
    this.router.navigate([path]);
  }

  isActive(path: string): boolean {
    return this.currentRoute === path || this.currentRoute.startsWith(path + '/');
  }
}
