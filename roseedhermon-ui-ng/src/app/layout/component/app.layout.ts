import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppFooter } from './app.footer';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppFooter,
    MenubarModule,
    ButtonModule,
    InputTextModule
  ],
  template: `
    <div>
      <p-menubar [model]="items" class="custom-menubar">
        <ng-template pTemplate="start">
          <div class="menubar-logo">
            <span class="app-name">ROSEE D'HERMON</span>
          </div>
        </ng-template>

        <ng-template pTemplate="end">
          <div class="menubar-actions">
            <!-- Usager -->
            <span class="user-name">Bienvenue, {{ userName }}</span>

            <!-- Recherche -->
            <div class="search-container">
              <i class="pi pi-search search-icon"></i>
              <input type="text" pInputText placeholder="Rechercher..." class="search-input" />
            </div>

            <!-- Langue -->
            <button
              type="button"
              pButton
              icon="pi pi-globe"
              class="lang-btn"
              (click)="toggleLanguage()"
              label="{{ currentLanguage }}">
            </button>

            <!-- Aide -->
            <button
              type="button"
              pButton
              icon="pi pi-question-circle"
              class="help-btn"
              (click)="openHelp()">
            </button>
          </div>
        </ng-template>
      </p-menubar>

      <div class="layout-main-container">
        <div class="layout-main">
          <router-outlet></router-outlet>
        </div>
        <app-footer></app-footer>
      </div>

      <div class="layout-mask animate-fadein"></div>
    </div>
  `,
  styles: [`
 
    .menubar-logo .app-name {
      color: white;
      font-size: 1.25rem;
      font-weight: bold;
      font-weight: 800;
    }

    .menubar-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-name {
      color: white;
      font-weight: 800;
      margin-right: 0.75rem;
    }

    .search-container {
  position: relative;
  width: 300px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: #999;
  font-size: 1rem;
  font-weight: 800;
}

.search-input {
  width: 100%;
  padding-left: 2.2rem;
  height: 2.5rem;
  font-size: 1rem;
  font-weight: 800;
}


    .lang-btn, .help-btn {
      background-color: #0059b3;
      border: none;
      color: white;
      font-weight: 800;
    }
   
  
    .lang-btn:hover,
    .help-btn:hover {
      background-color: #0066cc;
      font-weight: 800;
    }
  `]
})
export class AppLayout {
  items: MenuItem[] = [];
  userName = 'Jean Dupont';
  currentLanguage = 'FR';

  ngOnInit() {
    this.items = [
      {
        label: 'Tableau de bord',
        icon: 'pi pi-fw pi-home',
        routerLink: ['/app/dashboard']
      },
      {
        label: 'Membres',
        icon: 'pi pi-fw pi-users',
        routerLink: ['/app/members']
      },
      {
        label: 'Événements',
        icon: 'pi pi-fw pi-calendar',
        routerLink: ['/app/events']
      }
    ];
  }

  toggleLanguage() {
    this.currentLanguage = this.currentLanguage === 'FR' ? 'EN' : 'FR';
    console.log('Langue changée vers :', this.currentLanguage);
    // Implémente ici ngx-translate si nécessaire
  }

  openHelp() {
    console.log('Aide cliquée');
    // Ouvre un modal ou redirige vers une page d'aide
  }
}
