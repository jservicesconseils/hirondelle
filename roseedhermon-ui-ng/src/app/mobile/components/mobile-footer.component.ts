import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../core/auth/auth.service';
import { PlatformSettingsService } from '../../core/platform-settings.service';

/**
 * Barre de navigation basse : bandeau plat collé au bord de l'écran, comme les
 * grandes applications de magasinage (icône au-dessus du libellé, l'onglet
 * courant se distinguant par la couleur plutôt que par une pastille flottante).
 * Nos propres couleurs — le bleu profond de l'entête, l'orange de la charte
 * pour l'onglet actif — plutôt que celles du modèle.
 */
@Component({
  selector: 'app-mobile-footer',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
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
        <span>{{ 'nav.home' | translate }}</span>
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
        <span>{{ 'nav.contacts' | translate }}</span>
      </button>

      <button type="button"
              class="nav-item"
              *ngIf="settings.modules().mobileTickets"
              [class.active]="isActive('/mobile/tickets')"
              (click)="go('/mobile/tickets')">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4zm-5.5 6L12 12.6 9.5 14l.7-2.8-2.2-1.9 2.9-.2L12 6.5l1.1 2.6 2.9.2-2.2 1.9.7 2.8z" />
        </svg>
        <span>{{ 'nav.tickets' | translate }}</span>
      </button>

      <button type="button"
              class="nav-item"
              *ngIf="settings.modules().mobileProfile"
              [class.active]="isActive('/mobile/profile')"
              (click)="go('/mobile/profile')">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        <span>{{ 'nav.profile' | translate }}</span>
      </button>
    </nav>
  `,
  styles: [`
    /* Dernier élément de la colonne de la coquille mobile : aucun positionnement
       absolu, donc la barre reste collée au bas de l'écran quoi qu'il arrive. */
    :host {
      flex: 0 0 auto;
      display: block;
      z-index: 900;
    }

    /* Bandeau plat, collé au bord — plus de rail flottant ni de marge autour :
       le fond va jusqu'au vrai bas de l'écran, la zone sûre n'étant qu'un
       padding à l'intérieur de la barre elle-même. Même bleu que les bandeaux
       d'en-tête, pour que le bas et le haut de l'écran se répondent. */
    .bottom-nav {
      display: flex;
      align-items: stretch;
      background: linear-gradient(135deg, #16346b 0%, #2b5fb8 62%, #3d78d6 100%);
      padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
      font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .nav-item {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 6px 2px;
      border: none;
      background: none;
      color: rgba(255, 255, 255, 0.65);
      font: inherit;
      cursor: pointer;
      transition: color 0.15s ease;
    }

    .nav-item svg { width: 22px; height: 22px; flex-shrink: 0; }

    .nav-item span {
      font-size: 10.5px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    /* Onglet courant : blanc plein (au lieu du blanc atténué des autres),
       pas de pastille ni de fond — juste l'opacité qui change. */
    .nav-item.active {
      color: #fff;
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
