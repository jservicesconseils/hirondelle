import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { scrollToAnchor } from './public-header.component';

/** Pied de page commun aux pages publiques. */
@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="site-footer">
      <div class="shell footer-inner">
        <div class="footer-brand">
          <span class="brand-mark">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 4c-4.2.5-7.4 2.2-9.6 5.1C9.6 11.6 8.6 14.6 8.3 18l-2.6 3h3.5c.4-2.9 1.2-5.3 2.6-7.2 1.9-2.6 4.7-4.1 8.2-4.6L21 4z"
                fill="currentColor" />
            </svg>
          </span>
          <div>
            <strong>Hirondelle</strong>
            <small>Événements et communautés</small>
          </div>
        </div>

        <nav class="footer-links">
          <button type="button" (click)="goTo('evenements')">Événements</button>
          <button type="button" (click)="goTo('categories')">Catégories</button>
          <button type="button" (click)="goTo('organiser')">Organiser</button>
          <a routerLink="/login">Se connecter</a>
        </nav>
      </div>

      <div class="shell footer-legal">
        <small>© {{ year }} · Version 1.0.0</small>
        <a routerLink="/web/confidentialite">Politique de confidentialité</a>
      </div>
    </footer>
  `,
  styleUrls: ['./public-footer.component.scss']
})
export class PublicFooterComponent {
  readonly year = new Date().getFullYear();

  constructor(private router: Router) {}

  goTo(anchor: string): void {
    if (this.router.url.split('?')[0].split('#')[0] === '/web') {
      scrollToAnchor(anchor);
      return;
    }
    this.router.navigate(['/web']).then(() => setTimeout(() => scrollToAnchor(anchor), 60));
  }
}
