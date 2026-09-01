import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MobileFooterComponent } from './mobile-footer.component';
import { AppLanguage, LanguageService } from '../../core/language.service';

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
  `]
})
export class MobileTabsComponent {
  languageChosen: boolean;

  constructor(private language: LanguageService) {
    this.languageChosen = this.language.hasChosenLanguage();
  }

  pick(lang: AppLanguage): void {
    this.language.setLanguage(lang);
    this.languageChosen = true;
  }
}
