import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MobileFooterComponent } from '../../components/mobile-footer.component';

@Component({
  selector: 'app-mobile-events-test',
  standalone: true,
  imports: [CommonModule, IonicModule, MobileFooterComponent],
  template: `
    <ion-app>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Test Ionic</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-card>
          <ion-card-header>
            <ion-card-title>Test des styles Ionic</ion-card-title>
            <ion-card-subtitle>Si vous voyez ceci stylé, Ionic fonctionne</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <ion-button expand="block" color="primary">
              <ion-icon name="checkmark" slot="start"></ion-icon>
              Bouton Ionic
            </ion-button>
            
            <ion-list>
              <ion-item>
                <ion-label>Item 1</ion-label>
                <ion-icon name="star" slot="end"></ion-icon>
              </ion-item>
              <ion-item>
                <ion-label>Item 2</ion-label>
                <ion-icon name="heart" slot="end"></ion-icon>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </ion-content>
      
      <!-- Footer global -->
      <app-mobile-footer></app-mobile-footer>
    </ion-app>
  `,
  styles: [`
    ion-card {
      margin: 16px;
    }
    
    ion-button {
      margin: 16px 0;
    }
  `]
})
export class MobileEventsTestComponent {
  constructor() { }
} 