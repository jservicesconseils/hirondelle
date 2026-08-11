import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MobileFooterComponent } from './mobile-footer.component';

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
  imports: [CommonModule, RouterModule, MobileFooterComponent],
  template: `
    <div class="mobile-shell">
      <div class="mobile-scroll">
        <router-outlet></router-outlet>
      </div>
      <app-mobile-footer></app-mobile-footer>
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
  `]
})
export class MobileTabsComponent {}
