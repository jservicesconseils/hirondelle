import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-mobile-layout',
  standalone: true,
  imports: [CommonModule, IonicModule],
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
        <!-- Contenu principal -->
        <div class="main-content">
          <ng-content></ng-content>
        </div>
      </ion-content>
    </ion-app>
  `,
  styles: [`
    ion-toolbar {
      --background: linear-gradient(135deg, #ED5F00 0%, #9914CB 100%);
      --color: white;
    }
    
    .main-content {
      min-height: calc(100vh - 120px);
    }
  `]
})
export class MobileLayoutComponent {

  constructor() { }
}