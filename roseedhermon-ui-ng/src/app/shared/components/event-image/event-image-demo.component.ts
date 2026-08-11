import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventImageComponent } from './event-image.component';
import { EventDTO } from '../../services/api/model/eventDTO';

@Component({
  selector: 'app-event-image-demo',
  standalone: true,
  imports: [CommonModule, EventImageComponent],
  template: `
    <div class="demo-container">
      <h2>Démonstration de la gestion des images d'événements</h2>
      
      <div class="demo-section">
        <h3>1. Événement avec image dans la base de données</h3>
        <div class="image-demo">
          <app-event-image 
            [event]="eventWithImage"
            [altText]="'Événement avec image'"
            shape="rounded"
            placeholderText="Image manquante">
          </app-event-image>
          <p class="demo-description">
            ✅ Utilise l'image de la base de données
          </p>
        </div>
      </div>

      <div class="demo-section">
        <h3>2. Événement sans image (fallback local)</h3>
        <div class="image-demo">
          <app-event-image 
            [event]="eventWithoutImage"
            [altText]="'Événement sans image'"
            shape="rounded"
            placeholderText="Aucune image">
          </app-event-image>
          <p class="demo-description">
            ⚠️ Utilise l'image locale de fallback
          </p>
        </div>
      </div>

      <div class="demo-section">
        <h3>3. Événement avec erreur de chargement (fallback en ligne)</h3>
        <div class="image-demo">
          <app-event-image 
            [event]="eventWithError"
            [altText]="'Événement avec erreur'"
            shape="rounded"
            placeholderText="Erreur de chargement">
          </app-event-image>
          <p class="demo-description">
            🔄 Après 3 tentatives, utilise une image en ligne
          </p>
        </div>
      </div>

      <div class="demo-section">
        <h3>4. Différentes formes</h3>
        <div class="shapes-demo">
          <div class="shape-item">
            <h4>Circulaire</h4>
            <app-event-image 
              [event]="eventWithoutImage"
              [altText]="'Circulaire'"
              shape="circular"
              placeholderText="C">
            </app-event-image>
          </div>
          <div class="shape-item">
            <h4>Arrondie</h4>
            <app-event-image 
              [event]="eventWithoutImage"
              [altText]="'Arrondie'"
              shape="rounded"
              placeholderText="A">
            </app-event-image>
          </div>
          <div class="shape-item">
            <h4>Carrée</h4>
            <app-event-image 
              [event]="eventWithoutImage"
              [altText]="'Carrée'"
              shape="square"
              placeholderText="S">
            </app-event-image>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .demo-section {
      margin-bottom: 40px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .demo-section h3 {
      margin-top: 0;
      color: #333;
    }

    .image-demo {
      display: flex;
      align-items: center;
      gap: 20px;
      margin: 20px 0;
    }

    .image-demo app-event-image {
      width: 150px;
      height: 100px;
    }

    .demo-description {
      margin: 0;
      font-style: italic;
      color: #666;
    }

    .shapes-demo {
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
    }

    .shape-item {
      text-align: center;
    }

    .shape-item h4 {
      margin-bottom: 10px;
      color: #333;
    }

    .shape-item app-event-image {
      width: 80px;
      height: 80px;
    }
  `]
})
export class EventImageDemoComponent {
  // Événement avec image dans la base de données
  eventWithImage: EventDTO = {
    id: '1',
    name: 'Conférence Tech 2024',
    description: 'Une conférence sur les nouvelles technologies',
    category: 'CONFERENCE',
    date: new Date(),
    location: { placeName: 'Centre de conférences', city: 'Paris' },
    files: [
      {
        id: 'file1',
        fileName: 'conference-image.jpg',
        mimeType: 'image/jpeg',
        fileType: 'PRESENTATION_PHOTO',
        mainPhoto: true
      }
    ],
    mainPhotoId: 'file1'
  } as EventDTO;

  // Événement sans image
  eventWithoutImage: EventDTO = {
    id: '2',
    name: 'Atelier de formation',
    description: 'Un atelier de formation pratique',
    category: 'ATELIER',
    date: new Date(),
    location: { placeName: 'Salle de formation', city: 'Lyon' },
    files: []
  } as EventDTO;

  // Événement avec URL d'image qui va échouer
  eventWithError: EventDTO = {
    id: '3',
    name: 'Séminaire Business',
    description: 'Un séminaire sur les stratégies business',
    category: 'SEMINAIRE',
    date: new Date(),
    location: { placeName: 'Hôtel des affaires', city: 'Marseille' },
    files: [
      {
        id: 'file2',
        fileName: 'nonexistent-image.jpg',
        mimeType: 'image/jpeg',
        fileType: 'PRESENTATION_PHOTO',
        mainPhoto: true
      }
    ],
    mainPhotoId: 'file2'
  } as EventDTO;
}