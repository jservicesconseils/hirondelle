import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-mobile-tabs',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  template: `
    <ion-app>
      <ion-header>
        <ion-toolbar>
          <ion-title></ion-title>
          <ion-buttons slot="end">
            <ion-button>
              <ion-icon name="notifications-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <div class="main-content">
          <router-outlet></router-outlet>
        </div>
      </ion-content>

      <div class="bottom-tabs">
        <div class="tab-button" [class.active]="isActive('/mobile/dashboard')" (click)="navigateTo('/mobile/dashboard')">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Accueil</ion-label>
        </div>

        <div class="tab-button" [class.active]="isActive('/mobile/events')" (click)="navigateTo('/mobile/events')">
          <ion-icon name="calendar-outline"></ion-icon>
          <ion-label>Événements</ion-label>
        </div>

        <div class="tab-button" [class.active]="isActive('/mobile/members')" (click)="navigateTo('/mobile/members')">
          <ion-icon name="people-outline"></ion-icon>
          <ion-label>Membres</ion-label>
        </div>

        <div class="tab-button" [class.active]="isActive('/mobile/profile')" (click)="navigateTo('/mobile/profile')">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Profil</ion-label>
        </div>
      </div>
    </ion-app>
  `,
  styles: [`
    ion-toolbar {
      --background: linear-gradient(135deg, #ED5F00 0%, #9914CB 100%);
      --color: white;
    }
    
    .main-content {
      min-height: calc(100vh - 120px);
      padding-bottom: 60px; /* Espace pour les tabs en bas */
    }

    .bottom-tabs {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 8px 0;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
    }

    .tab-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #6c757d;
    }

    .tab-button.active {
      color: #ED5F00;
    }

    .tab-button ion-icon {
      font-size: 1.5rem;
      margin-bottom: 4px;
    }

    .tab-button ion-label {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .tab-button:active {
      opacity: 0.7;
    }
  `]
})
export class MobileTabsComponent {
  currentRoute: string = '';

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

  navigateTo(path: string) {
    console.log('Navigation vers:', path);
    this.router.navigate([path]).then(
      (success) => console.log('Navigation réussie vers:', path),
      (error) => console.error('Erreur de navigation:', error)
    );
  }

  isActive(path: string): boolean {
    const isActive = this.currentRoute === path || this.currentRoute.startsWith(path + '/');
    return isActive;
  }
}