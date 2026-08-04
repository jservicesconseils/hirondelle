import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MobileFooterComponent } from '../../components/mobile-footer.component';

@Component({
  selector: 'app-mobile-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, MobileFooterComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Profil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Header du profil -->
      <div class="profile-header ion-padding">
        <ion-avatar class="profile-avatar">
          <img src="assets/images/placeholder-member.jpg" alt="Photo de profil">
        </ion-avatar>
        <h2>Nom Utilisateur</h2>
        <p>utilisateur&#64;example.com</p>
      </div>

      <!-- Menu du profil -->
      <ion-list>
        <ion-item button>
          <ion-icon name="person-outline" slot="start"></ion-icon>
          <ion-label>Informations personnelles</ion-label>
        </ion-item>
        
        <ion-item button>
          <ion-icon name="calendar-outline" slot="start"></ion-icon>
          <ion-label>Mes événements</ion-label>
        </ion-item>
        
        <ion-item button>
          <ion-icon name="settings-outline" slot="start"></ion-icon>
          <ion-label>Paramètres</ion-label>
        </ion-item>
        
        <ion-item button>
          <ion-icon name="help-circle-outline" slot="start"></ion-icon>
          <ion-label>Aide</ion-label>
        </ion-item>
        
        <ion-item button>
          <ion-icon name="information-circle-outline" slot="start"></ion-icon>
          <ion-label>À propos</ion-label>
        </ion-item>
      </ion-list>

      <!-- Bouton de déconnexion -->
      <div class="ion-padding">
        <ion-button expand="block" color="danger" fill="outline">
          <ion-icon name="log-out-outline" slot="start"></ion-icon>
          Se déconnecter
        </ion-button>
      </div>
    </ion-content>
    
    <!-- Footer global -->
    <app-mobile-footer></app-mobile-footer>
  `,
  styles: [`
    .profile-header {
      text-align: center;
      background: linear-gradient(135deg, #ED5F00 0%, #9914CB 100%);
      color: white;
      margin-bottom: 20px;
    }
    
    .profile-avatar {
      --size: 100px;
      margin: 0 auto 16px;
    }
    
    .profile-header h2 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .profile-header p {
      margin: 0;
      opacity: 0.9;
    }
  `]
})
export class MobileProfileComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log('Mobile Profile - Composant chargé');
  }
}