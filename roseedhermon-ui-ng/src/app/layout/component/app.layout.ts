import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppFooter } from './app.footer';
import { AppHeader } from './app.header';
import { AppSidebar } from './app.sidebar';

/**
 * Gabarit de l'application, calé sur la hauteur de la fenêtre : menu vertical à
 * gauche, barre supérieure et page à droite, pied de page sur toute la largeur en
 * dessous. Seule la zone de contenu défile ; la fenêtre elle-même ne défile pas.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeader, AppFooter, AppSidebar],
  template: `
    <div class="layout-shell">
      <div class="layout-body">
        <app-sidebar [open]="menuOpen" (closed)="menuOpen = false"></app-sidebar>

        <!-- Voile de fermeture du tiroir sur petit écran -->
        <div class="layout-scrim" *ngIf="menuOpen" (click)="menuOpen = false"></div>

        <!--
          Le pied de page appartient à la colonne de contenu, pas à la coquille :
          placé dessous, il formait une bande courant sous le menu, et le bas de
          la page ne respirait plus comme le haut.
        -->
        <div class="layout-content">
          <app-header (toggleMenu)="menuOpen = !menuOpen"></app-header>

          <div class="layout-main-container">
            <div class="layout-main">
              <router-outlet></router-outlet>
            </div>
          </div>

          <app-footer></app-footer>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /**
     * Sans cette règle, l'hôte reste en display: inline. Le blanc du gabarit y
     * ouvre une boîte de ligne qui décale la coquille vers le bas : le document
     * dépasse alors 100vh, la page défile, et il reste de l'air en haut qu'on ne
     * retrouve pas en bas.
     */
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .layout-shell {
      display: flex;
      flex-direction: column;
      /* 100% de l'hôte, et non 100vh : la coquille ne peut plus dépasser. */
      height: 100%;
      overflow: hidden;
      background: #fdf6f1;
    }

    /**
     * Rangée menu + contenu.
     *
     * C'est elle qui porte le retrait vertical, une seule fois pour ses deux
     * colonnes : le menu et le contenu commencent et finissent donc exactement
     * à la même hauteur, avec autant d'air en haut qu'en bas.
     */
    .layout-body {
      flex: 1 1 auto;
      min-height: 0;
      padding: 1rem 0;
      display: flex;
      align-items: stretch;
    }

    .layout-content {
      flex: 1 1 auto;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    /* Le seul conteneur qui défile. */
    .layout-main-container {
      flex: 1 1 auto;
      min-height: 0;
      margin-left: 60px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Les pages apportent déjà leur propre marge (.list-page). */
    .layout-main {
      padding: 0;
    }

    .layout-scrim {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(16, 28, 48, 0.5);
    }
  `]
})
export class AppLayout {
  /** Tiroir de navigation ouvert (petit écran uniquement). */
  menuOpen = false;
}
