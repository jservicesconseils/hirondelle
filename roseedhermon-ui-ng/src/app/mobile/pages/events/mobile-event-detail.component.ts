import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../shared/services/events/events.service';
import { EventImageService } from '../../../shared/services/events/event-image.service';
import { EventImageComponent } from '../../../shared/components/event-image/event-image.component';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EventCategoryEnum } from '../../../shared/models/model';
import { EventFileControllerService } from '../../../shared/services/api/api/eventFileController.service';
import { EventFileDTO } from '../../../shared/services/api/model/eventFileDTO';
import { MobileFooterComponent } from '../../components/mobile-footer.component';

@Component({
  selector: 'app-mobile-event-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, EventImageComponent, MobileFooterComponent],
  template: `
    <div class="mobile-event-detail">
      <!-- Header Section -->
      <div class="event-header">
        <div class="header-background">
          <div class="event-illustration">
            <!-- Flèches de navigation pour les images -->
            <button *ngIf="hasMultipleImages()" class="nav-arrow nav-arrow-left" (click)="previousImage()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            
            <button *ngIf="hasMultipleImages()" class="nav-arrow nav-arrow-right" (click)="nextImage()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
            
            <!-- Indicateur d'images -->
            <div *ngIf="hasMultipleImages()" class="image-indicator">
              <span class="current-image">{{ currentImageIndex + 1 }}</span>
              <span class="total-images">/ {{ eventImages.length }}</span>
            </div>
            
            <!-- Éléments décoratifs avec image de fond -->
            <div class="illustration-elements" [style.background-image]="getIllustrationBackgroundImage()">
              <div class="decorative-element" *ngFor="let element of getDecorativeElements()">
                {{ element }}
              </div>
            </div>
            
            <div class="main-title-overlay">
              <h1 class="event-main-title">{{ getEventMainTitle() }}</h1>
              <h2 class="event-subtitle">{{ getEventSubtitle() }}</h2>
            </div>
          </div>
        </div>
        
        <!-- Boutons de navigation -->
        <button class="nav-btn back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        
        <button class="nav-btn favorite-btn" (click)="toggleFavorite()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>

      <!-- Contenu principal -->
      <div class="event-content">
        <!-- Titre de l'evenement -->
        <div class="event-title-section">
          <h1 class="event-name">{{ getEventName() }}</h1>
        </div>

        <!-- Informations de l'evenement -->
        <div class="event-metadata">
          <div class="metadata-item">
            <svg class="metadata-icon" width="16" height="16" viewBox="0 0 24 24" fill="#666">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            <span class="metadata-text">{{ getEventDateTime() }}</span>
          </div>
          
          <div class="metadata-item location-item">
            <svg class="metadata-icon" width="16" height="16" viewBox="0 0 24 24" fill="#666">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span class="metadata-text">{{ getEventLocation() }}</span>
            <button class="directions-btn" (click)="openGoogleMaps()" *ngIf="hasLocation()" title="Ouvrir dans Google Maps">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <!-- Fond Google Maps style -->
                <rect x="2" y="2" width="20" height="20" rx="4" fill="#4285F4"/>
                <!-- Icône de localisation Google style -->
                <path d="M12 6C9.79 6 8 7.79 8 10c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4zm0 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="white"/>
                <!-- Flèche de navigation Google style -->
                <path d="M12 4l2 2-2 2V4z" fill="white"/>
                <path d="M10 6h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <!-- Point central -->
                <circle cx="12" cy="10" r="1.5" fill="#EA4335"/>
              </svg>
            </button>
          </div>

          <div class="metadata-item" *ngIf="hasMultipleDays()">
            <svg class="metadata-icon" width="16" height="16" viewBox="0 0 24 24" fill="#666">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            <span class="metadata-text">{{ event?.numberOfDays }} jour(s)</span>
          </div>

          <div class="metadata-item" *ngIf="event?.availableSeats">
            <svg class="metadata-icon" width="16" height="16" viewBox="0 0 24 24" fill="#666">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L12 12v8h2v6h6zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9.5c0-.83-.67-1.5-1.5-1.5S6 8.67 6 9.5V15H4.5v7h3z"/>
            </svg>
            <span class="metadata-text">{{ event?.availableSeats }} places disponibles</span>
          </div>

          <div class="metadata-item" *ngIf="event?.lastRegistrationDate">
            <svg class="metadata-icon" width="16" height="16" viewBox="0 0 24 24" fill="#666">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
              <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <span class="metadata-text">Limite: {{ getLastRegistrationDate() }}</span>
          </div>

          <div class="metadata-item" *ngIf="event?.eventType">
            <svg class="metadata-icon" width="16" height="16" viewBox="0 0 24 24" fill="#666">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span class="metadata-text">{{ getEventTypeLabel() }}</span>
          </div>

          <div class="metadata-item" *ngIf="event?.eventStatus">
            <svg class="metadata-icon" width="16" height="16" viewBox="0 0 24 24" fill="#666">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span class="metadata-text">{{ getEventStatusLabel() }}</span>
          </div>
        </div>

        <!-- Description -->
        <div class="description-section">
          <h3 class="section-title">Description</h3>
          <p class="description-text">{{ event?.description || 'Aucune description disponible pour cet evenement.' }}</p>
        </div>

        <!-- Presentateurs -->
        <div class="presenters-section" *ngIf="hasPresenters()">
          <h3 class="section-title">Presentateurs</h3>
          <div class="presenters-scroll-container">
          <div class="presenters-list">
            <div class="presenter-card" *ngFor="let presenter of event?.presenters">
              <div class="presenter-info">
                <h4 class="presenter-name">{{ presenter.firstName }} {{ presenter.lastName }}</h4>
                <p class="presenter-title" *ngIf="presenter.title">{{ presenter.title }}</p>
                <p class="presenter-resume" *ngIf="presenter.resume">{{ presenter.resume }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Images de l'evenement -->
        <div class="images-section" *ngIf="hasEventImages()">
          <h3 class="section-title">Images</h3>
          <div class="images-grid">
            <div class="image-item">
              <app-event-image 
                [event]="event"
                [altText]="event?.name || 'Image de l evenement'"
                shape="square"
                placeholderText="Image"
                containerClass="event-image-container"
                imageClass="event-image">
              </app-event-image>
            </div>
          </div>
        </div>


        <!-- Packages/Tarifs -->
        <div class="packages-section">
          <h3 class="section-title">Tarifs</h3>
          <div class="packages-list">
            <div class="package-card" [class.selected]="selectedPackage === 'standard'">
              <div class="package-left">
              <div class="package-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </div>
              <div class="package-info">
                <div class="package-name">Tarif Standard</div>
                <div class="package-duration">Accès complet</div>
              </div>
            </div>
              <div class="package-price">{{ getStandardPrice() }}</div>
              </div>
              </div>
            </div>

        </div>

      <!-- Footer avec bouton de réservation -->
      <footer class="event-footer">
          <button class="book-now-btn" (click)="bookEvent()">
            Réserver maintenant
          </button>
      </footer>
      
      <!-- Footer global -->
      <app-mobile-footer></app-mobile-footer>
    </div>
  `,
  styles: [`
    .mobile-event-detail {
      min-height: 100vh;
      background: #f8f9fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Header Section */
    .event-header {
      position: relative;
      height: 35vh;
      min-height: 250px;
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      overflow: hidden;
    }

    .header-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    }

    .header-background.has-image {
      background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5));
    }

    .event-illustration {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .illustration-elements {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      align-items: center;
      opacity: 0.7;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    /* Éléments décoratifs */
    .decorative-elements {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      align-items: center;
    }

    .decorative-element {
      font-size: 24px;
      margin: 10px;
      animation: float 3s ease-in-out infinite;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    .main-title-overlay {
      position: relative;
      z-index: 2;
      text-align: center;
      color: white;
    }

    .event-main-title {
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .event-subtitle {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    /* Navigation Buttons */
    .nav-btn {
      position: absolute;
      top: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 3;
    }

    .back-btn {
      left: 20px;
    }

    .favorite-btn {
      right: 20px;
      color: #ff4757;
    }

    .favorite-btn:hover {
      background: #ff4757;
      color: white;
    }

    /* Navigation Arrows */
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 4;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .nav-arrow:hover {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-50%) scale(1.1);
    }

    .nav-arrow-left {
      left: 20px;
    }

    .nav-arrow-right {
      right: 20px;
    }

    /* Image Indicator */
    .image-indicator {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      z-index: 4;
    }

    .current-image {
      color: #ffd700;
    }

    .total-images {
      color: rgba(255, 255, 255, 0.8);
    }

    /* Content Section */
    .event-content {
      background: white;
      border-radius: 20px 20px 0 0;
      margin-top: -20px;
      position: relative;
      z-index: 2;
      padding: 24px;
      min-height: 65vh;
    }

    .event-title-section {
      margin-bottom: 20px;
    }

    .event-name {
      font-size: 24px;
      font-weight: 700;
      color: #333;
      margin: 0;
      line-height: 1.3;
    }

    /* Metadata */
    .event-metadata {
      margin-bottom: 24px;
    }

    .metadata-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .metadata-icon {
      flex-shrink: 0;
    }

    .metadata-text {
      font-size: 16px;
      color: #666;
      font-weight: 500;
    }

    .location-item {
      position: relative;
    }

    .directions-btn {
      background: rgba(66, 133, 244, 0.08);
      border: 1px solid rgba(66, 133, 244, 0.3);
      padding: 6px;
      margin-left: auto;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(66, 133, 244, 0.2);
      position: relative;
      overflow: hidden;
    }

    .directions-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335);
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 8px;
    }

    .directions-btn:hover {
      background: rgba(66, 133, 244, 0.15);
      transform: scale(1.1);
      box-shadow: 0 3px 12px rgba(66, 133, 244, 0.3);
      border-color: #4285F4;
    }

    .directions-btn:hover::before {
      opacity: 0.05;
    }

    .directions-btn:active {
      transform: scale(1.05);
      box-shadow: 0 1px 3px rgba(66, 133, 244, 0.2);
    }

    .directions-btn svg {
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
    }

    .directions-btn:hover svg {
      transform: scale(1.05);
    }

    /* Sections */
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin: 0 0 12px 0;
    }

    .description-section {
      margin-bottom: 24px;
    }

    .description-text {
      font-size: 16px;
      line-height: 1.6;
      color: #666;
      margin: 0;
    }

    /* Presentateurs Section */
    .presenters-section {
      margin-bottom: 24px;
    }

    .presenters-scroll-container {
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #4CAF50 #f1f1f1;
    }

    .presenters-scroll-container::-webkit-scrollbar {
      height: 6px;
    }

    .presenters-scroll-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .presenters-scroll-container::-webkit-scrollbar-thumb {
      background: #4CAF50;
      border-radius: 3px;
    }

    .presenters-scroll-container::-webkit-scrollbar-thumb:hover {
      background: #2E7D32;
    }

    .presenters-list {
      display: flex;
      flex-direction: row;
      gap: 12px;
      padding-bottom: 8px;
      width: 100%;
    }

    .presenter-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 16px;
      border-left: 4px solid #4CAF50;
      flex: 1;
      min-width: 0;
    }

    .presenter-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .presenter-title {
      font-size: 14px;
      font-weight: 500;
      color: #4CAF50;
      margin: 0 0 8px 0;
    }

    .presenter-resume {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }


    /* Images Section */
    .images-section {
      margin-bottom: 24px;
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 12px;
    }

    .image-item {
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
    }

    .event-image-container {
      width: 100%;
      height: 100%;
    }

    .event-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Packages Section */
    .packages-section {
      margin-bottom: 24px;
    }

    .packages-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .package-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-radius: 12px;
      background: #f8f9fa;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .package-card.selected {
      border-color: #4CAF50;
      background: #e8f5e8;
    }

    .package-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .package-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #ffd700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .package-info {
      flex: 1;
    }

    .package-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .package-duration {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }

    .package-price {
      font-size: 20px;
      font-weight: 700;
      color: #4CAF50;
      text-align: right;
      flex-shrink: 0;
    }

    /* Footer */
    .event-footer {
      background: white;
      padding: 20px 24px;
      border-top: 1px solid #e0e0e0;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
    }

    .book-now-btn {
      width: 100%;
      padding: 16px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .book-now-btn:hover {
      background: #45a049;
      transform: translateY(-2px);
    }

    /* Responsive */
    @media (max-width: 480px) {
      .event-content {
        padding: 20px;
      }
      
      .event-main-title {
        font-size: 28px;
      }
      
      .event-subtitle {
        font-size: 16px;
      }
    }
  `]
})
export class MobileEventDetailComponent implements OnInit {
  event: EventDTO | null = null;
  isFavorite: boolean = false;
  selectedPackage: string = 'standard';
  
  // Gestion des images
  eventImages: EventFileDTO[] = [];
  currentImageIndex: number = 0;
  showDecorativeElements: boolean = false;
  
  // Exposer l'enum pour le template
  EventCategoryEnum = EventCategoryEnum;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private eventImageService: EventImageService,
    private eventFileControllerService: EventFileControllerService
  ) { }

  ngOnInit(): void {
    this.loadEvent();
  }

  loadEvent(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.eventService.getEvent(eventId).subscribe({
        next: (event: EventDTO) => {
          this.event = event;
          console.log('Événement chargé:', event);
          this.loadEventImages();
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement de l\'événement:', error);
        }
      });
    }
  }

  loadEventImages(): void {
    if (!this.event?.id) return;
    
    this.eventFileControllerService.getEventFiles(this.event.id).subscribe({
      next: (files: EventFileDTO[]) => {
        this.eventImages = files.filter((file: EventFileDTO) => 
          file.fileName && this.isImageFile(file.fileName)
        );
        console.log('Images chargées:', this.eventImages.length);
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des images:', error);
        this.eventImages = [];
      }
    });
  }

  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  getDecorativeElements(): string[] {
    if (!this.event) return ['🎉', '🎊', '🎈', '🎁', '🎪', '🎭'];
    
    switch (this.event.category) {
      case EventCategoryEnum.CONFERENCE:
        return ['🎤', '📊', '💼', '🎯', '📈', '💡'];
      case EventCategoryEnum.ATELIER:
        return ['🔧', '⚙️', '🛠️', '📐', '🔨', '⚡'];
      case EventCategoryEnum.SEMINAIRE:
        return ['📋', '📝', '📊', '📈', '💼', '🎯'];
      case EventCategoryEnum.FORMATION:
        return ['🎓', '📚', '✏️', '📖', '🎯', '💡'];
      case EventCategoryEnum.RETRAITE:
        return ['🏠', '🌿', '🧘', '🌸', '🕯️', '☮️'];
      default:
        return ['🎉', '🎊', '🎈', '🎁', '🎪', '🎭'];
    }
  }

  getEventMainTitle(): string {
    if (!this.event) return 'EVENEMENT';
    
    switch (this.event.category) {
      case EventCategoryEnum.CONFERENCE:
        return 'CONFERENCE';
      case EventCategoryEnum.ATELIER:
        return 'ATELIER';
      case EventCategoryEnum.SEMINAIRE:
        return 'SEMINAIRE';
      case EventCategoryEnum.FORMATION:
        return 'FORMATION';
      case EventCategoryEnum.RETRAITE:
        return 'RETRAITE';
      default:
        return 'EVENEMENT';
    }
  }

  getEventSubtitle(): string {
    if (!this.event) return 'DECOUVREZ';
    
    switch (this.event.category) {
      case EventCategoryEnum.CONFERENCE:
        return 'DECOUVREZ';
      case EventCategoryEnum.ATELIER:
        return 'APPRENEZ';
      case EventCategoryEnum.SEMINAIRE:
        return 'EXPLOREZ';
      case EventCategoryEnum.FORMATION:
        return 'DEVELOPPEZ';
      case EventCategoryEnum.RETRAITE:
        return 'DETENDEZ-VOUS';
      default:
        return 'DECOUVREZ';
    }
  }

  getEventDateTime(): string {
    if (!this.event?.date) return 'Date et heure non specifiees';
    
    const date = new Date(this.event.date);
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    // Simuler des heures basees sur la categorie
    let timeRange = '';
    switch (this.event.category) {
      case EventCategoryEnum.CONFERENCE:
        timeRange = '9h00 - 17h00';
        break;
      case EventCategoryEnum.ATELIER:
        timeRange = '14h00 - 18h00';
        break;
      case EventCategoryEnum.SEMINAIRE:
        timeRange = '10h00 - 16h00';
        break;
      case EventCategoryEnum.FORMATION:
        timeRange = '9h00 - 12h00';
        break;
      case EventCategoryEnum.RETRAITE:
        timeRange = '8h00 - 20h00';
        break;
      default:
        timeRange = '10h00 - 18h00';
    }
    
    return `${formattedDate} • ${timeRange}`;
  }

  getEventTimeRange(): string {
    if (!this.event?.date) return 'Heure non specifiee';
    
    // Simuler des heures basees sur la categorie
    switch (this.event.category) {
      case EventCategoryEnum.CONFERENCE:
        return '9h00 - 17h00';
      case EventCategoryEnum.ATELIER:
        return '14h00 - 18h00';
      case EventCategoryEnum.SEMINAIRE:
        return '10h00 - 16h00';
      case EventCategoryEnum.FORMATION:
        return '9h00 - 12h00';
      case EventCategoryEnum.RETRAITE:
        return '8h00 - 20h00';
      default:
        return '10h00 - 18h00';
    }
  }

  getEventLocation(): string {
    if (!this.event?.location) return 'Lieu non specifie';
    
    // Utiliser l'adresse complète
    const fullAddress = this.getFullAddress();
    if (fullAddress) {
      return fullAddress;
    }
    
    // Fallback si pas d'adresse complète
    if (this.event.location.city) {
      return this.event.location.city;
    }
    if (this.event.location.address) {
      return this.event.location.address;
    }
    
    return 'Lieu non specifie';
  }

  getLastRegistrationDate(): string {
    if (!this.event?.lastRegistrationDate) return 'Non specifiee';
    
    const date = new Date(this.event.lastRegistrationDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  hasMultipleDays(): boolean {
    return !!(this.event?.numberOfDays && this.event.numberOfDays > 1);
  }

  hasLocation(): boolean {
    return !!(this.event?.location && (this.event.location.address || this.event.location.city));
  }

  openGoogleMaps(): void {
    if (!this.event?.location) return;
    
    const fullAddress = this.getFullAddress();
    if (!fullAddress) return;
    
    // Encoder l'adresse pour l'URL
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Créer l'URL Google Maps
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    
    // Ouvrir dans un nouvel onglet
    window.open(googleMapsUrl, '_blank');
  }

  hasPresenters(): boolean {
    return !!(this.event?.presenters && this.event.presenters.length > 0);
  }

  getFullCityInfo(): string {
    if (!this.event?.location) return '';
    
    const parts = [];
    if (this.event.location.postalCode) {
      parts.push(this.event.location.postalCode);
    }
    if (this.event.location.city) {
      parts.push(this.event.location.city);
    }
    
    return parts.join(' ');
  }

  getFullAddress(): string {
    if (!this.event?.location) return '';
    
    const parts = [];
    if (this.event.location.address) parts.push(this.event.location.address);
    if (this.event.location.city) parts.push(this.event.location.city);
    if (this.event.location.country) parts.push(this.event.location.country);
    
    return parts.join(', ');
  }

  getEventTypeLabel(): string {
    if (!this.event?.eventType) return '';
    
    switch (this.event.eventType) {
      case 'PUBLIC':
        return 'Événement public';
      case 'PRIVATE':
        return 'Événement privé';
      default:
        return this.event.eventType;
    }
  }

  getEventStatusLabel(): string {
    if (!this.event?.eventStatus) return '';
    
    switch (this.event.eventStatus) {
      case 'DRAFT':
        return 'Brouillon';
      case 'PUBLISHED':
        return 'Publié';
      case 'CANCELLED':
        return 'Annulé';
      case 'COMPLETED':
        return 'Terminé';
      default:
        return this.event.eventStatus;
    }
  }

  getStandardPrice(): string {
    if (!this.event) return 'N/A';
    if (this.event.free) return 'Gratuit';
    if (this.event.amount) return '$' + this.event.amount;
    return 'N/A';
  }

  getPremiumPrice(): string {
    if (!this.event?.amount) return 'N/A';
    return '$' + (this.event.amount * 1.5).toFixed(0);
  }

  hasEventImages(): boolean {
    return this.eventImages.length > 0;
  }

  hasMultipleImages(): boolean {
    return this.eventImages.length > 1;
  }

  hasAnyImage(): boolean {
    return this.hasEventImages() || this.eventImageService.getEventImageUrl(this.event, true) !== '';
  }

  getCurrentImage(): EventFileDTO | null {
    if (this.eventImages.length === 0) return null;
    return this.eventImages[this.currentImageIndex];
  }

  getCurrentImageUrl(): string {
    const currentImage = this.getCurrentImage();
    if (!currentImage) {
      // Si pas d'image de la base de données, utiliser l'image de la carte
      return this.eventImageService.getEventImageUrl(this.event, true);
    }
    
    // Construire l'URL de l'image de la base de données
    const baseUrl = 'http://localhost:8081';
    if (currentImage.accessUrl) {
      return `${baseUrl}${currentImage.accessUrl}`;
    }
    
    // Fallback si pas d'accessUrl
    if (currentImage.fileName && this.event?.id) {
      return `${baseUrl}/api/v1/files/events/${this.event.id}/${currentImage.fileName}`;
    }
    
    return '';
  }

  nextImage(): void {
    if (this.eventImages.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.eventImages.length;
    }
  }

  previousImage(): void {
    if (this.eventImages.length > 1) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.eventImages.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  onImageError(event: any): void {
    console.log('Erreur de chargement de l\'image:', event);
    // Si l'image ne se charge pas, on peut essayer l'image suivante ou utiliser une image par défaut
    if (this.eventImages.length > 1) {
      this.nextImage();
    }
  }

  getDefaultBackgroundImage(): string {
    if (!this.event?.category) return '';
    
    // Images de fond par défaut basées sur la catégorie
    const defaultImages: { [key: string]: string } = {
      [EventCategoryEnum.CONFERENCE]: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
      [EventCategoryEnum.ATELIER]: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      [EventCategoryEnum.SEMINAIRE]: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
      [EventCategoryEnum.FORMATION]: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
      [EventCategoryEnum.RETRAITE]: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
    };
    
    return defaultImages[this.event.category] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop';
  }

  getIllustrationBackgroundImage(): string {
    // Priorité 1: Images enregistrées de l'événement dans la base de données
    if (this.hasEventImages()) {
      return `url(${this.getCurrentImageUrl()})`;
    }
    
    // Priorité 2: Image de la carte de l'événement (via EventImageService)
    const cardImageUrl = this.eventImageService.getEventImageUrl(this.event, true);
    if (cardImageUrl) {
      return `url(${cardImageUrl})`;
    }
    
    // Priorité 3: Image par défaut basée sur la catégorie
    const defaultImage = this.getDefaultBackgroundImage();
    if (defaultImage) {
      return `url(${defaultImage})`;
    }
    
    // Priorité 4: Pas d'image de fond
    return 'none';
  }

  getEventName(): string {
    console.log('getEventName - event:', this.event);
    console.log('getEventName - event?.name:', this.event?.name);
    
    if (!this.event) {
      console.log('getEventName - Pas d\'événement chargé');
      return 'Chargement...';
    }
    
    if (!this.event.name) {
      console.log('getEventName - Pas de nom dans l\'événement');
      return 'Nom non disponible';
    }
    
    console.log('getEventName - Nom trouvé:', this.event.name);
    return this.event.name;
  }

  goBack(): void {
    this.router.navigate(['/mobile/dashboard']);
  }

  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
  }

  bookEvent(): void {
    // Logique de reservation
    console.log('Reservation de l\'evenement:', this.event);
    // Ici vous pouvez ajouter la logique de reservation
  }
}