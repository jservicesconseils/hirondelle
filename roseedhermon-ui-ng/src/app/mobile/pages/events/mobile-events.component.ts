import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EventService } from '../../../shared/services/events/events.service';
import { EventImageService } from '../../../shared/services/events/event-image.service';
import { EventImageComponent } from '../../../shared/components/event-image/event-image.component';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EventCategoryEnum } from '../../../shared/models/model';
import { MobileFooterComponent } from '../../components/mobile-footer.component';

@Component({
  selector: 'app-mobile-events',
  standalone: true,
  imports: [CommonModule, IonicModule, EventImageComponent, MobileFooterComponent],
  template: `
    <div class="mobile-container">
      <!-- Header -->
      <header class="mobile-header">
        <h1 class="header-title">Événements</h1>
      </header>

      <!-- Contenu principal -->
      <main class="mobile-content">
        <!-- Barre de recherche -->
        <div class="search-container">
          <input 
            type="text" 
            placeholder="Rechercher un événement..."
            (input)="onSearchChange($event)"
            class="search-input">
        </div>

        <!-- Liste des événements -->
        <div class="events-list">
          <div *ngFor="let event of filteredEvents" 
               class="event-item" 
               (click)="viewEventDetails(event)">
            
            <!-- Image de l'événement -->
            <div class="event-avatar">
              <app-event-image 
                [event]="event"
                [altText]="event.name || 'Événement'"
                shape="circular"
                placeholderText="Événement"
                containerClass="event-avatar"
                imageClass="event-image">
              </app-event-image>
            </div>
            
            <!-- Contenu de l'événement -->
            <div class="event-content">
              <h2 class="event-title">{{ event.name }}</h2>
              <h3 class="event-category">{{ event.category }}</h3>
              <p class="event-description">{{ event.description }}</p>
              
              <div class="event-details">
                <div class="event-detail">
                  <i class="icon-calendar"></i>
                  <span>{{ event.date }}</span>
                </div>
                
                <div class="event-detail">
                  <i class="icon-location"></i>
                  <span>{{ event.location?.placeName }}, {{ event.location?.city }}</span>
                </div>
                
                <div *ngIf="event.amount" class="event-detail">
                  <i class="icon-cash"></i>
                  <span>{{ event.amount }} CAD</span>
                </div>
              </div>
            </div>
            
            <!-- Chip de catégorie -->
            <div class="event-chip" [class]="'chip-' + getCategoryColor(event.category || '')">
              {{ event.category || 'Non défini' }}
            </div>
          </div>
        </div>

        <!-- Message si aucun événement -->
        <div *ngIf="filteredEvents.length === 0" class="empty-state">
          <i class="icon-calendar empty-icon"></i>
          <h3>Aucun événement trouvé</h3>
          <p>Essayez de modifier votre recherche</p>
        </div>
      </main>
      
      <!-- Footer global -->
      <app-mobile-footer></app-mobile-footer>
    </div>
  `,
  styles: [`
    /* Styles CSS natifs pour mobile */
    .mobile-container {
      min-height: 100vh;
      background: #f8f9fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    /* Header */
    .mobile-header {
      background: #ED5F00;
      color: white;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .header-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    /* Contenu principal */
    .mobile-content {
      padding: 16px;
    }
    
    /* Barre de recherche */
    .search-container {
      margin-bottom: 20px;
    }
    
    .search-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .search-input::placeholder {
      color: #666;
    }
    
    /* Liste des événements */
    .events-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .event-item {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: flex-start;
      gap: 16px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .event-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    
    /* Avatar */
    .event-avatar {
      width: 60px;
      height: 60px;
      background: #f0f0f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }

    .event-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    
    .icon-calendar {
      font-size: 24px;
      color: #ED5F00;
    }
    
    .icon-location {
      font-size: 16px;
      color: #ED5F00;
    }
    
    .icon-cash {
      font-size: 16px;
      color: #ED5F00;
    }
    
    /* Contenu de l'événement */
    .event-content {
      flex: 1;
      min-width: 0;
    }
    
    .event-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 4px 0;
    }
    
    .event-category {
      font-size: 0.9rem;
      font-weight: 500;
      color: #666;
      margin: 0 0 8px 0;
    }
    
    .event-description {
      font-size: 0.9rem;
      color: #888;
      margin: 0 0 12px 0;
      line-height: 1.4;
    }
    
    .event-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .event-detail {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #666;
    }
    
    .event-detail i {
      width: 16px;
      text-align: center;
    }
    
    /* Chip de catégorie */
    .event-chip {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      color: white;
      background: #ED5F00;
      align-self: flex-start;
    }
    
    .chip-conference {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .chip-workshop {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .chip-seminar {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    
    .chip-default {
      background: linear-gradient(135deg, #ED5F00 0%, #9914CB 100%);
    }
    
    /* État vide */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    
    .empty-icon {
      font-size: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }
    
    .empty-state h3 {
      margin: 0 0 8px 0;
      font-size: 1.2rem;
    }
    
    .empty-state p {
      margin: 0;
      font-size: 0.9rem;
      color: #999;
    }
  `]
})
export class MobileEventsComponent implements OnInit {
  events: EventDTO[] = [];
  filteredEvents: EventDTO[] = [];
  searchTerm: string = '';

  constructor(
    private eventService: EventService,
    private eventImageService: EventImageService
  ) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.filteredEvents = events;
        console.log('Mobile Events - Événements chargés:', this.events.length);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
      }
    });
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.filterEvents();
  }

  filterEvents(): void {
    if (!this.searchTerm) {
      this.filteredEvents = this.events;
    } else {
              this.filteredEvents = this.events.filter(event =>
        (event.name?.toLowerCase().includes(this.searchTerm)) ||
        (event.description?.toLowerCase().includes(this.searchTerm)) ||
        (event.category?.toLowerCase().includes(this.searchTerm)) ||
        (event.location?.city?.toLowerCase().includes(this.searchTerm))
      );
    }
  }



  getCategoryColor(category: string): string {
    if (!category) return 'default';
    
    switch (category) {
      case EventCategoryEnum.CONFERENCE:
        return 'conference';
      case EventCategoryEnum.ATELIER:
        return 'workshop';
      case EventCategoryEnum.SEMINAIRE:
        return 'seminar';
      case EventCategoryEnum.FORMATION:
        return 'formation';
      case EventCategoryEnum.RETRAITE:
        return 'retraite';
      case EventCategoryEnum.AUTRE:
        return 'autre';
      default:
        return 'default';
    }
  }

  viewEventDetails(event: EventDTO): void {
    console.log('Voir détails de l\'événement:', event);
    // TODO: Navigation vers la page de détails
  }

  getEventImageUrl(event: EventDTO): string {
    return this.eventImageService.getEventImageUrl(event);
  }

  onImageError(event: any, eventData: EventDTO): void {
    this.eventImageService.onImageError(eventData, event.target);
  }

  onImageLoad(event: any, eventData: EventDTO): void {
    this.eventImageService.onImageLoad(eventData, event.target);
  }
}