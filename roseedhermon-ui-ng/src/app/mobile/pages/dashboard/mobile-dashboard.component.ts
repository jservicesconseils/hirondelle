import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { EventService } from '../../../shared/services/events/events.service';
import { EventImageService } from '../../../shared/services/events/event-image.service';
import { EventImageComponent } from '../../../shared/components/event-image/event-image.component';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EVENT_CATEGORIES, EventCategoryEnum } from '../../../shared/models/model';
import { MobileFooterComponent } from '../../components/mobile-footer.component';
// import { LucideAngularModule, Search, Bell, Heart, Home, Calendar, Users, Settings, Camera, Plane, MapPin, Music, Gamepad2, Utensils, Palette, Laptop, Briefcase, GraduationCap, Activity, Ticket, Wrench, BookOpen, Mountain, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-mobile-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, EventImageComponent, MobileFooterComponent],
  template: `
    <div class="mobile-dashboard">
      <!-- Header Section with Illustrations -->
      <div class="mobile-header">
        <div class="header-background">
          <div class="travel-illustrations">
            <div class="illustration camera"><i class="pi pi-camera" style="font-size: 24px;"></i></div>
            <div class="illustration airplane"><i class="pi pi-send" style="font-size: 24px;"></i></div>
            <div class="illustration suitcase"><i class="pi pi-briefcase" style="font-size: 24px;"></i></div>
            <div class="illustration road"><i class="pi pi-map-marker" style="font-size: 24px;"></i></div>
            <div class="travel-text">TRAVEL ADVENTURE</div>
          </div>
            </div>
        
        <div class="header-content">
          <div class="header-top">
            <div class="welcome-section">
              <h2 class="welcome-text">Welcome back 👋</h2>
              <h1 class="user-name">{{ userInfo.name }}</h1>
          </div>
            <div class="notification-btn" [class.has-notification]="hasNotifications">
              <i class="pi pi-bell" style="font-size: 20px;"></i>
              <div class="notification-dot" *ngIf="hasNotifications"></div>
            </div>
        </div>
        
          <!-- Search Bar -->
          <div class="search-section">
            <div class="search-bar" [class.search-active]="searchTerm">
              <i class="pi pi-search" style="font-size: 16px;"></i>
              <input 
                type="text" 
                placeholder="Rechercher par nom d'événement..." 
                [(ngModel)]="searchTerm"
                (input)="onSearchChange($event)"
                (focus)="onSearchFocus()"
                (blur)="onSearchBlur()"
              />
              <button 
                class="clear-search-btn" 
                *ngIf="searchTerm"
                (click)="clearSearch()"
                type="button">
                <i class="pi pi-times" style="font-size: 14px;"></i>
              </button>
            </div>
        </div>
        </div>
      </div>

      <!-- Content -->
      <div class="mobile-content">
        <!-- Categories Section -->
        <div class="categories-section">
          <h3 class="section-title">Category</h3>
          <div class="categories-horizontal">
            <div 
                   class="category-card"
              *ngFor="let category of categories"
              [class.selected]="selectedCategory === category.name"
                   (click)="selectCategory(category)">
                 <div class="category-content">
                   <div class="category-icon" [ngClass]="getCategoryIconClass(category.name)">
                     <div class="icon-shape" [ngSwitch]="category.name">
                       <!-- Conférence - Microphone -->
                       <svg *ngSwitchCase="EventCategoryEnum.CONFERENCE" width="20" height="20" viewBox="0 0 24 24" fill="#1e40af">
                         <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                         <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                       </svg>
                       
                       <!-- Atelier - Outils -->
                       <svg *ngSwitchCase="EventCategoryEnum.ATELIER" width="20" height="20" viewBox="0 0 24 24" fill="#ea580c">
                         <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                       </svg>
                       
                       <!-- Séminaire - Graphique -->
                       <svg *ngSwitchCase="EventCategoryEnum.SEMINAIRE" width="20" height="20" viewBox="0 0 24 24" fill="#7c3aed">
                         <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                       </svg>
                       
                       <!-- Formation - Diplôme -->
                       <svg *ngSwitchCase="EventCategoryEnum.FORMATION" width="20" height="20" viewBox="0 0 24 24" fill="#059669">
                         <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                       </svg>
                       
                       <!-- Retraite - Maison -->
                       <svg *ngSwitchCase="EventCategoryEnum.RETRAITE" width="20" height="20" viewBox="0 0 24 24" fill="#dc2626">
                         <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                       </svg>
                       
                       <!-- Autre - Étoile -->
                       <svg *ngSwitchCase="EventCategoryEnum.AUTRE" width="20" height="20" viewBox="0 0 24 24" fill="#7c2d12">
                         <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                       </svg>
                       
                       <!-- Default - Calendrier -->
                       <svg *ngSwitchDefault width="20" height="20" viewBox="0 0 24 24" fill="#2e31a4">
                         <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                       </svg>
                     </div>
                   </div>
                   <span class="category-label">{{ category.label }}</span>
                 </div>
              </div>
            </div>
            </div>

        <!-- Popular Events Section -->
        <div class="events-section">
          <div class="section-header">
            <h3 class="section-title">Popular Event</h3>
            <div class="section-info">
              <span class="results-count" *ngIf="searchTerm || selectedCategory">
                {{ popularEvents.length }} résultat(s)
              </span>
              <button class="see-more-btn" *ngIf="!searchTerm && !selectedCategory">See More</button>
            </div>
          </div>
          <div class="events-horizontal">
            <div 
              class="event-card popular-event" 
              *ngFor="let event of popularEvents; let i = index"
              [class.jazz-theme]="i === 0"
              [class.sport-theme]="i === 1"
                 (click)="viewEventDetails(event)">
              <div class="event-image-container">
                <app-event-image 
                  [event]="event"
                  [altText]="event.name || 'Événement'"
                  shape="square"
                  placeholderText="Événement populaire"
                  containerClass="event-image-bg"
                  imageClass="event-image-bg">
                </app-event-image>
                </div>
                <div class="event-header">
                  <div class="event-icon">
                    <div [ngSwitch]="event.category">
                      <!-- Conférence - Microphone -->
                      <svg *ngSwitchCase="EventCategoryEnum.CONFERENCE" width="20" height="20" viewBox="0 0 24 24" fill="#1e40af">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                      </svg>
                      
                      <!-- Atelier - Outils -->
                      <svg *ngSwitchCase="EventCategoryEnum.ATELIER" width="20" height="20" viewBox="0 0 24 24" fill="#ea580c">
                        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                      </svg>
                      
                      <!-- Séminaire - Graphique -->
                      <svg *ngSwitchCase="EventCategoryEnum.SEMINAIRE" width="20" height="20" viewBox="0 0 24 24" fill="#7c3aed">
                        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                      </svg>
                      
                      <!-- Formation - Diplôme -->
                      <svg *ngSwitchCase="EventCategoryEnum.FORMATION" width="20" height="20" viewBox="0 0 24 24" fill="#059669">
                        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                      </svg>
                      
                      <!-- Retraite - Maison -->
                      <svg *ngSwitchCase="EventCategoryEnum.RETRAITE" width="20" height="20" viewBox="0 0 24 24" fill="#dc2626">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                      </svg>
                      
                      <!-- Autre - Étoile -->
                      <svg *ngSwitchCase="EventCategoryEnum.AUTRE" width="20" height="20" viewBox="0 0 24 24" fill="#7c2d12">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                      
                      <!-- Default - Calendrier -->
                      <svg *ngSwitchDefault width="20" height="20" viewBox="0 0 24 24" fill="#2e31a4">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                  </div>
                  </div>
                  <button class="detail-btn" (click)="viewEventDetails(event)">
                    <i class="pi pi-eye" style="font-size: 16px;"></i>
                  </button>
                </div>
              <div class="event-content">
                <div class="event-title-container">
                  <div class="event-title">{{ event.name || 'Nom non disponible' }}</div>
                </div>
                <div class="event-info">
                  <div class="event-details">
                    <div class="event-date">
                      <svg class="date-icon" width="12" height="12" viewBox="0 0 24 24" fill="#6b7280">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                      <span class="date-text">{{ event.date | date:'dd MMMM yyyy' }}</span>
                    </div>
                    <div class="event-location">
                      <svg class="location-icon" width="12" height="12" viewBox="0 0 24 24" fill="#6b7280">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span class="location-text">{{ event.location?.city }}</span>
                </div>
              </div>
                <div class="event-price">{{ event.free ? 'Free' : (event.amount ? '$' + event.amount : 'N/A') }}</div>
                </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Event for You Section -->
        <div class="events-section">
          <div class="section-header">
            <h3 class="section-title">Event for you</h3>
            <div class="section-info">
              <span class="results-count" *ngIf="searchTerm || selectedCategory">
                {{ filteredEvents.length }} résultat(s)
              </span>
              <button class="see-more-btn" *ngIf="!searchTerm && !selectedCategory">See More</button>
            </div>
          </div>
          <div class="events-horizontal">
            <div 
              class="event-card event-for-you" 
              *ngFor="let event of filteredEvents; let i = index"
              [class.food-theme]="i === 0"
              [class.concert-theme]="i === 1"
                 (click)="viewEventDetails(event)">
              <div class="event-image-container">
                <app-event-image 
                  [event]="event"
                  [altText]="event.name || 'Événement'"
                  shape="square"
                  placeholderText="Événement pour vous"
                  containerClass="event-image-bg"
                  imageClass="event-image-bg">
                </app-event-image>
                </div>
                <div class="event-header">
                  <div class="event-icon">
                    <div [ngSwitch]="event.category">
                      <!-- Conférence - Microphone -->
                      <svg *ngSwitchCase="EventCategoryEnum.CONFERENCE" width="20" height="20" viewBox="0 0 24 24" fill="#1e40af">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                      </svg>
                      
                      <!-- Atelier - Outils -->
                      <svg *ngSwitchCase="EventCategoryEnum.ATELIER" width="20" height="20" viewBox="0 0 24 24" fill="#ea580c">
                        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                      </svg>
                      
                      <!-- Séminaire - Graphique -->
                      <svg *ngSwitchCase="EventCategoryEnum.SEMINAIRE" width="20" height="20" viewBox="0 0 24 24" fill="#7c3aed">
                        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                      </svg>
                      
                      <!-- Formation - Diplôme -->
                      <svg *ngSwitchCase="EventCategoryEnum.FORMATION" width="20" height="20" viewBox="0 0 24 24" fill="#059669">
                        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                      </svg>
                      
                      <!-- Retraite - Maison -->
                      <svg *ngSwitchCase="EventCategoryEnum.RETRAITE" width="20" height="20" viewBox="0 0 24 24" fill="#dc2626">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                      </svg>
                      
                      <!-- Autre - Étoile -->
                      <svg *ngSwitchCase="EventCategoryEnum.AUTRE" width="20" height="20" viewBox="0 0 24 24" fill="#7c2d12">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                      
                      <!-- Default - Calendrier -->
                      <svg *ngSwitchDefault width="20" height="20" viewBox="0 0 24 24" fill="#2e31a4">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                  </div>
                  </div>
                  <button class="detail-btn" (click)="viewEventDetails(event)">
                    <i class="pi pi-eye" style="font-size: 16px;"></i>
                  </button>
                </div>
              <div class="event-content">
                <div class="event-title-container">
                  <div class="event-title">{{ event.name || 'Nom non disponible' }}</div>
                </div>
                <div class="event-info">
                  <div class="event-details">
                    <div class="event-date">
                      <svg class="date-icon" width="12" height="12" viewBox="0 0 24 24" fill="#6b7280">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                      <span class="date-text">{{ event.date | date:'dd MMMM yyyy' }}</span>
                    </div>
                    <div class="event-location">
                      <svg class="location-icon" width="12" height="12" viewBox="0 0 24 24" fill="#6b7280">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span class="location-text">{{ event.location?.city }}</span>
                </div>
              </div>
                <div class="event-price">{{ event.free ? 'Free' : (event.amount ? '$' + event.amount : 'N/A') }}</div>
                </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <!-- Footer global -->
      <app-mobile-footer></app-mobile-footer>
    </div>
  `,
  styles: [`
    /* Global styles for proper scrolling */
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }
    
    /* Nouveau Design Mobile Dashboard - Style Figma */
    .mobile-dashboard {
      min-height: calc(100vh - 70px);
      background: #f8f9fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Header Section with Travel Illustrations */
    .mobile-header {
      background: linear-gradient(135deg, #4CAF50 0%, #2e31a4 100%);
      color: white;
      padding: 0;
      position: relative;
      overflow: hidden;
      min-height: 200px;
    }
    
    .header-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #4CAF50 0%, #2e31a4 100%);
    }
    
    .travel-illustrations {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.3;
    }
    
    .illustration {
      position: absolute;
      font-size: 24px;
      animation: float 6s ease-in-out infinite;
    }
    
    .camera {
      top: 20px;
      right: 30px;
      animation-delay: 0s;
    }
    
    .airplane {
      top: 40px;
      right: 60px;
      animation-delay: 1s;
    }
    
    .suitcase {
      top: 60px;
      right: 20px;
      animation-delay: 2s;
    }
    
    .road {
      top: 80px;
      right: 50px;
      animation-delay: 3s;
    }
    
    .travel-text {
      position: absolute;
      top: 100px;
      right: 20px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      opacity: 0.7;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    .header-content {
      position: relative;
      z-index: 10;
      padding: 20px 16px;
    }
    
    /* Header Top Section */
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    
    .welcome-section {
      flex: 1;
    }
    
    .welcome-text {
      font-size: 16px;
      font-weight: 400;
      margin: 0 0 4px 0;
      opacity: 0.9;
    }
    
    .user-name {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      color: white;
    }
    
    .notification-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }
    
    .notification-btn i {
      font-size: 20px;
      color: white;
    }
    
    .notification-dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background: #ff4757;
      border-radius: 50%;
      border: 2px solid white;
    }
    
    /* Search Section */
    .search-section {
      margin-top: 20px;
      margin-bottom: -60px;
      position: relative;
      z-index: 100;
      transform: translateY(40px);
    }
    
    .search-bar {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      border: 2px solid rgba(0,0,0,0.1);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      position: relative;
    }

    .search-bar.search-active {
      border-color: #4CAF50;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
    }
    
    .search-bar i {
      color: #666;
      font-size: 16px;
      transition: color 0.3s ease;
    }

    .search-bar.search-active i {
      color: #4CAF50;
    }
    
    .search-bar input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      color: #333;
      background: transparent;
      font-weight: 500;
    }
    
    .search-bar input::placeholder {
      color: #999;
      font-size: 14px;
      font-weight: 400;
    }

    .clear-search-btn {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    .clear-search-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #666;
    }
    
    /* Mobile Content */
    .mobile-content {
      padding: 60px 16px 20px 16px;
      background: #f8f9fa;
      margin-top: -40px;
      position: relative;
      z-index: 1;
    }
    
    /* Categories Section */
    .categories-section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin: 0 0 16px 0;
    }
    
    .categories-horizontal {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 4px 0;
      -webkit-overflow-scrolling: touch;
    }
    
    .categories-horizontal::-webkit-scrollbar {
      display: none;
    }
    
    .category-card {
      background: white;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      min-width: 140px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.3s ease;
      flex-shrink: 0;
      border: 2px solid transparent;
      position: relative;
      overflow: hidden;
    }
    
    .category-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #c2410c;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 1;
    }
    
    .category-card.selected::before {
      opacity: 1;
    }
    
    .category-card.selected {
      border-color: #c2410c;
    }
    
    .category-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      color: #333;
      transition: color 0.3s ease;
    }
    
    .category-card.selected .category-content {
      color: white;
    }
    
    .category-icon {
      font-size: 20px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      flex-shrink: 0;
      color: #2e31a4;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }
    
    .category-card.selected .category-icon svg {
      fill: white !important;
    }
    
    .icon-shape {
      width: 20px;
      height: 20px;
      display: block;
    }
    
    /* Icônes spécifiques pour chaque catégorie */
    .conference-icon {
      width: 20px;
      height: 20px;
      background-color: #FF6B6B;
      border-radius: 50%;
    }
    
    .atelier-icon {
      width: 20px;
      height: 20px;
      background-color: #4ECDC4;
      border-radius: 0;
      transform: rotate(45deg);
    }
    
    .seminaire-icon {
      width: 20px;
      height: 20px;
      background-color: #45B7D1;
      border-radius: 0;
    }
    
    .formation-icon {
      width: 20px;
      height: 20px;
      background-color: #96CEB4;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
    }
    
    .retraite-icon {
      width: 20px;
      height: 20px;
      background-color: #FFEAA7;
      border-radius: 50% 0 50% 0;
    }
    
    .autre-icon {
      width: 20px;
      height: 20px;
      background-color: #DDA0DD;
      border-radius: 0 50% 0 50%;
    }
    
    .default-icon {
      width: 20px;
      height: 20px;
      background-color: #2e31a4;
      border-radius: 50%;
    }
    
    /* Styles pour les états hover et selected */
    .category-card:hover .conference-icon,
    .category-card.selected .conference-icon { background-color: white !important; }
    .category-card:hover .atelier-icon,
    .category-card.selected .atelier-icon { background-color: white !important; }
    .category-card:hover .seminaire-icon,
    .category-card.selected .seminaire-icon { background-color: white !important; }
    .category-card:hover .formation-icon,
    .category-card.selected .formation-icon { background-color: white !important; }
    .category-card:hover .retraite-icon,
    .category-card.selected .retraite-icon { background-color: white !important; }
    .category-card:hover .autre-icon,
    .category-card.selected .autre-icon { background-color: white !important; }
    
    .category-label {
      font-size: 13px;
      font-weight: 600;
      text-align: left;
      line-height: 1.1;
      flex: 1;
    }
    
    /* Events Section */
    .events-section {
      margin-bottom: 16px;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .section-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .see-more-btn {
      background: none;
      border: none;
      color: #2196F3;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }

    .results-count {
      font-size: 12px;
      color: #4CAF50;
      font-weight: 600;
      background: rgba(76, 175, 80, 0.1);
      padding: 4px 8px;
      border-radius: 12px;
      border: 1px solid rgba(76, 175, 80, 0.2);
    }
    
    .events-horizontal {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding: 4px 0;
      -webkit-overflow-scrolling: touch;
    }
    
    .events-horizontal::-webkit-scrollbar {
      display: none;
    }
    
    /* Event Cards */
    .event-card {
      border-radius: 16px;
      min-width: 240px;
      max-width: 240px;
      height: 200px;
      cursor: pointer;
      transition: all 0.3s ease;
      flex-shrink: 0;
      border: 1px solid rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      background-color: white; /* Background blanc pour toute la carte */
    }
    
    .event-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .event-image-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 133px; /* 2/3 de 200px pour la zone image */
      z-index: 1;
    }

    .event-image-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 3;
      color: white;
      font-size: 24px;
      background: rgba(0,0,0,0.5);
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Event Header */
    .event-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 16px 16px 0 16px;
      position: relative;
      z-index: 2;
    }
    
    .event-icon {
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 10px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .event-title {
      font-size: 15px;
      font-weight: 800;
      color: #000000;
      line-height: 1.3;
      margin: 0 0 6px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      position: relative;
      z-index: 3;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    }
    
    .detail-btn {
      background: rgba(255, 255, 255, 0.9);
      border: none;
      color: #666;
      font-size: 16px;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .detail-btn:hover {
      color: #2196F3;
      background: rgba(33, 150, 243, 0.9);
    }
    
    /* Event Content */
    .event-content {
      display: flex;
      flex-direction: column;
      padding: 8px;
      position: absolute;
      bottom: 5px;
      left: 5px;
      right: 5px;
      height: 65px; /* Ajusté pour contenir tous les éléments */
      z-index: 2;
      background: white;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden; /* Empêche le débordement */
    }
    
    .event-title-container {
      width: 100%;
      margin-bottom: 1px;
    }
    
    .event-info {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
      flex: 1;
      min-width: 0; /* Pour permettre le truncate */
      position: relative;
      z-index: 3;
      overflow: hidden; /* Empêche le débordement */
    }
    
    .event-title {
      font-size: 12px;
      font-weight: 600;
      color: #000000;
      line-height: 1.0;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      position: relative;
      z-index: 3;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    }
    
    .event-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .event-date,
    .event-location {
      font-size: 11px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 6px;
      margin: -2px 0 0 0; /* Remonte de 2px vers le haut */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .date-icon,
    .location-icon {
      flex-shrink: 0;
      margin-right: 2px;
    }
    
    .date-text {
      color: #6b7280; /* Gris pour la date */
      font-weight: 500;
    }
    
    .location-text {
      color: #6b7280; /* Gris pour le lieu */
      font-weight: 500;
    }
    
    .event-price {
      font-size: 12px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
      padding: 4px 8px;
      border-radius: 6px;
      align-self: flex-end;
      margin-left: 8px;
      margin-bottom: 4px;
      box-shadow: 0 2px 4px rgba(234, 88, 12, 0.3);
      flex-shrink: 0;
    }
    
    
    /* Responsive Design */
    @media (max-width: 480px) {
      .mobile-dashboard {
        padding: 16px;
        min-height: calc(100vh - 65px);
      }
      
      .mobile-header {
        height: 200px;
      }
      
      .header-content {
        padding: 20px 16px;
      }
      
      .search-bar {
        margin: 0 16px;
      }
      
      .mobile-content {
        padding: 0 16px;
      }
      
      .event-card {
        min-width: 280px;
        max-width: 280px;
      }
      
      .category-card {
        min-width: 80px;
        padding: 16px 12px;
      }
      
      .category-icon {
        font-size: 28px;
      }
      
      .category-label {
        font-size: 12px;
      }
    }
    
    /* Animation for illustrations */
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
  `]
})
export class MobileDashboardComponent implements OnInit {
  events: EventDTO[] = [];
  popularEvents: EventDTO[] = [];
  filteredEvents: EventDTO[] = [];
  searchTerm: string = '';
  selectedCategory: string = '';
  favorites: Set<string> = new Set();
  hasNotifications: boolean = true;
  
  // Exposer l'enum pour le template
  EventCategoryEnum = EventCategoryEnum;

  // Informations de l'utilisateur connecté
  userInfo = {
    name: 'Utilisateur',
    status: 'Prêt pour de nouveaux événements',
    avatar: 'assets/images/user-avatar.svg'
  };

  categories = [
    { name: EventCategoryEnum.CONFERENCE, icon: 'pi pi-users', label: 'Conférence' },
    { name: EventCategoryEnum.ATELIER, icon: 'pi pi-wrench', label: 'Atelier' },
    { name: EventCategoryEnum.SEMINAIRE, icon: 'pi pi-chart-line', label: 'Séminaire' },
    { name: EventCategoryEnum.FORMATION, icon: 'pi pi-graduation-cap', label: 'Formation' },
    { name: EventCategoryEnum.RETRAITE, icon: 'pi pi-home', label: 'Retraite' },
    { name: EventCategoryEnum.AUTRE, icon: 'pi pi-star', label: 'Autre' }
  ];

  constructor(
    private eventService: EventService,
    private eventImageService: EventImageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Sélectionner la première catégorie par défaut
    if (this.categories.length > 0) {
      this.selectedCategory = this.categories[0].name;
    }
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getEventsWithFiles().subscribe({
      next: (events) => {
        this.events = events;
        this.popularEvents = events.slice(0, 5); // Top 5 events
        this.filteredEvents = events;
        console.log('Dashboard - Événements chargés:', this.events.length);
        console.log('Premier événement:', events[0]);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        // Fallback vers getEvents() si getEventsWithFiles() échoue
        this.eventService.getEvents().subscribe({
          next: (fallbackEvents) => {
            this.events = fallbackEvents;
            this.popularEvents = fallbackEvents.slice(0, 5);
            this.filteredEvents = fallbackEvents;
            console.log('Dashboard - Événements chargés (fallback):', this.events.length);
          },
          error: (fallbackError) => {
            console.error('Erreur lors du chargement des événements (fallback):', fallbackError);
          }
        });
      }
    });
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.filterEvents();
  }

  onSearchFocus(): void {
    console.log('Focus sur le champ de recherche');
  }

  onSearchBlur(): void {
    console.log('Perte de focus sur le champ de recherche');
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterEvents();
  }

  selectCategory(category: any): void {
    this.selectedCategory = this.selectedCategory === category.name ? '' : category.name;
    this.filterEvents();
  }

  filterEvents(): void {
    let filtered = this.events;

    if (this.searchTerm) {
      filtered = filtered.filter(event =>
        event.name?.toLowerCase().includes(this.searchTerm)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(event =>
        event.category === this.selectedCategory
      );
    }

    this.filteredEvents = filtered;
    
    // Mettre à jour aussi les événements populaires si une recherche est active
    if (this.searchTerm || this.selectedCategory) {
      this.popularEvents = filtered.slice(0, 5);
    } else {
      // Si pas de recherche, garder les 5 premiers événements originaux
      this.popularEvents = this.events.slice(0, 5);
    }
  }

  getEventImage(event: EventDTO): string {
    return this.eventImageService.getEventImageUrl(event);
  }

  onImageError(event: any, eventData: EventDTO): void {
    this.eventImageService.onImageError(eventData, event.target);
  }

  onImageLoad(event: any, eventData: EventDTO): void {
    this.eventImageService.onImageLoad(eventData, event.target);
  }

  viewEventDetails(event: EventDTO): void {
    console.log('Voir détails de l\'événement:', event);
    if (event.id) {
      this.router.navigate(['/mobile/events', event.id]);
    }
  }

  toggleFavorite(event: EventDTO, eventClick: Event): void {
    eventClick.stopPropagation();
    const eventId = event.id?.toString() || '';
    
    if (this.favorites.has(eventId)) {
      this.favorites.delete(eventId);
    } else {
      this.favorites.add(eventId);
    }
  }

  isFavorite(event: EventDTO): boolean {
    return this.favorites.has(event.id?.toString() || '');
  }

  onAvatarError(event: any): void {
    // Fallback vers une icône si l'image ne charge pas
    event.target.style.display = 'none';
    event.target.parentElement.innerHTML = '<i class="icon-user"></i>';
  }

  toggleNotifications(): void {
    console.log('Ouvrir les notifications');
    // TODO: Implémenter l'ouverture des notifications
  }

  getEventIcon(category?: string): string {
    switch (category) {
      case 'CONFERENCE':
        return 'pi pi-users';
      case 'ATELIER':
        return 'pi pi-wrench';
      case 'SEMINAIRE':
        return 'pi pi-book';
      case 'FORMATION':
        return 'pi pi-graduation-cap';
      case 'RETRAITE':
        return 'pi pi-home';
      case 'AUTRE':
        return 'pi pi-star';
      default:
        return 'pi pi-calendar';
    }
  }

  getCategoryIcon(categoryName?: string): string {
    switch (categoryName) {
      case 'CONFERENCE':
        return '●';
      case 'ATELIER':
        return '▲';
      case 'SEMINAIRE':
        return '■';
      case 'FORMATION':
        return '◆';
      case 'RETRAITE':
        return '★';
      case 'AUTRE':
        return '♦';
      default:
        return '○';
    }
  }

  getCategoryIconClass(categoryName?: string): string {
    switch (categoryName) {
      case 'CONFERENCE':
        return 'conference';
      case 'ATELIER':
        return 'atelier';
      case 'SEMINAIRE':
        return 'seminaire';
      case 'FORMATION':
        return 'formation';
      case 'RETRAITE':
        return 'retraite';
      case 'AUTRE':
        return 'autre';
      default:
        return '';
    }
  }

  getCategoryColor(categoryName?: string): string {
    switch (categoryName) {
      case 'CONFERENCE':
        return '#FF6B6B';
      case 'ATELIER':
        return '#4ECDC4';
      case 'SEMINAIRE':
        return '#45B7D1';
      case 'FORMATION':
        return '#96CEB4';
      case 'RETRAITE':
        return '#FFEAA7';
      case 'AUTRE':
        return '#DDA0DD';
      default:
        return '#2e31a4';
    }
  }

  getCategoryBorderRadius(categoryName?: string): string {
    switch (categoryName) {
      case 'CONFERENCE':
        return '50%';
      case 'ATELIER':
        return '0';
      case 'SEMINAIRE':
        return '0';
      case 'FORMATION':
        return '50% 50% 50% 0';
      case 'RETRAITE':
        return '50% 0 50% 0';
      case 'AUTRE':
        return '0 50% 0 50%';
      default:
        return '50%';
    }
  }

  getCategoryIconStyle(categoryName?: string): string {
    const color = this.getCategoryColor(categoryName);
    const borderRadius = this.getCategoryBorderRadius(categoryName);
    
    switch (categoryName) {
      case 'CONFERENCE':
        return `background-color: ${color}; border-radius: ${borderRadius}; width: 20px; height: 20px; display: block;`;
      case 'ATELIER':
        return `background-color: ${color}; border-radius: ${borderRadius}; width: 20px; height: 20px; display: block; transform: rotate(45deg);`;
      case 'SEMINAIRE':
        return `background-color: ${color}; border-radius: ${borderRadius}; width: 20px; height: 20px; display: block;`;
      case 'FORMATION':
        return `background-color: ${color}; border-radius: ${borderRadius}; width: 20px; height: 20px; display: block; transform: rotate(-45deg);`;
      case 'RETRAITE':
        return `background-color: ${color}; border-radius: ${borderRadius}; width: 20px; height: 20px; display: block;`;
      case 'AUTRE':
        return `background-color: ${color}; border-radius: ${borderRadius}; width: 20px; height: 20px; display: block;`;
      default:
        return `background-color: ${color}; border-radius: ${borderRadius}; width: 20px; height: 20px; display: block;`;
    }
  }

} 