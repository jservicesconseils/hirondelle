import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '../../../shared/services/events/events.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { MobileFooterComponent } from '../../components/mobile-footer.component';

@Component({
  selector: 'app-mobile-ticket',
  standalone: true,
  imports: [CommonModule, IonicModule, MobileFooterComponent],
  template: `
    <div class="mobile-container">
      <!-- Header -->
      <header class="ticket-header">
        <button class="back-btn" (click)="goBack()">
          <i class="icon-back"></i>
        </button>
        <h1 class="header-title">Mon Billet</h1>
      </header>

      <!-- Contenu principal -->
      <main class="ticket-content">
        <!-- Carte du billet -->
        <div class="ticket-card">
          <!-- En-tête du billet -->
          <div class="ticket-header-card">
            <div class="event-info">
              <h2 class="event-title">{{ event?.name }}</h2>
              <p class="event-category">{{ event?.category }}</p>
            </div>
            <div class="ticket-status">
              <span class="status-badge">Validé</span>
            </div>
          </div>

          <!-- QR Code -->
          <div class="qr-section">
            <div class="qr-code">
              <div class="qr-placeholder">
                <i class="icon-qr"></i>
                <p>QR Code</p>
              </div>
            </div>
            <p class="qr-note">Scannez ce code à l'entrée</p>
          </div>

          <!-- Détails du billet -->
          <div class="ticket-details">
            <div class="detail-item">
              <i class="icon-calendar"></i>
              <div class="detail-content">
                <h3>Date & Heure</h3>
                <p>{{ event?.date }}</p>
              </div>
            </div>

            <div class="detail-item">
              <i class="icon-location"></i>
              <div class="detail-content">
                <h3>Lieu</h3>
                <p>{{ event?.location?.placeName }}, {{ event?.location?.city }}</p>
              </div>
            </div>

            <div class="detail-item">
              <i class="icon-user"></i>
              <div class="detail-content">
                <h3>Participant</h3>
                <p>{{ participantInfo.name }}</p>
              </div>
            </div>

            <div class="detail-item">
              <i class="icon-ticket"></i>
              <div class="detail-content">
                <h3>Numéro de billet</h3>
                <p class="ticket-number">{{ ticketNumber }}</p>
              </div>
            </div>
          </div>

          <!-- Informations importantes -->
          <div class="important-info">
            <h3>Informations importantes</h3>
            <ul class="info-list">
              <li>Présentez ce billet à l'entrée</li>
              <li>Arrivez 15 minutes avant l'événement</li>
              <li>Ce billet est nominatif</li>
              <li>Pas de remboursement possible</li>
            </ul>
          </div>
        </div>

        <!-- Actions -->
        <div class="ticket-actions">
          <button class="download-btn" (click)="downloadTicket()">
            <i class="icon-download"></i>
            Télécharger
          </button>
          
          <button class="share-btn" (click)="shareTicket()">
            <i class="icon-share"></i>
            Partager
          </button>
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
    .ticket-header {
      background: linear-gradient(135deg, #ED5F00 0%, #9914CB 100%);
      color: white;
      padding: 20px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .back-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .back-btn:hover {
      background: rgba(255,255,255,0.3);
    }
    
    .back-btn i {
      font-size: 18px;
      color: white;
    }
    
    .header-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    /* Contenu principal */
    .ticket-content {
      padding: 20px 16px;
    }
    
    /* Carte du billet */
    .ticket-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      margin-bottom: 24px;
    }
    
    /* En-tête du billet */
    .ticket-header-card {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .event-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #333;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }
    
    .event-category {
      font-size: 0.9rem;
      color: #666;
      margin: 0;
    }
    
    .status-badge {
      background: #4CAF50;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    
    /* Section QR Code */
    .qr-section {
      text-align: center;
      margin-bottom: 24px;
      padding: 20px 0;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .qr-code {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }
    
    .qr-placeholder {
      width: 120px;
      height: 120px;
      background: #f8f9fa;
      border: 2px dashed #ddd;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .qr-placeholder i {
      font-size: 32px;
      color: #999;
    }
    
    .qr-placeholder p {
      font-size: 0.8rem;
      color: #999;
      margin: 0;
    }
    
    .qr-note {
      font-size: 0.9rem;
      color: #666;
      margin: 0;
    }
    
    /* Détails du billet */
    .ticket-details {
      margin-bottom: 24px;
    }
    
    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .detail-item:last-child {
      margin-bottom: 0;
    }
    
    .detail-item i {
      font-size: 20px;
      color: #ED5F00;
      margin-top: 2px;
    }
    
    .detail-content h3 {
      font-size: 0.9rem;
      font-weight: 600;
      color: #666;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .detail-content p {
      font-size: 1rem;
      color: #333;
      margin: 0;
      font-weight: 500;
    }
    
    .ticket-number {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      color: #ED5F00 !important;
    }
    
    /* Informations importantes */
    .important-info {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
    }
    
    .important-info h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 12px 0;
    }
    
    .info-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .info-list li {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }
    
    .info-list li:last-child {
      margin-bottom: 0;
    }
    
    .info-list li::before {
      content: "•";
      color: #ED5F00;
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    
    /* Actions */
    .ticket-actions {
      display: flex;
      gap: 12px;
    }
    
    .download-btn,
    .share-btn {
      flex: 1;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .download-btn {
      background: linear-gradient(135deg, #ED5F00 0%, #9914CB 100%);
      color: white;
      border: none;
    }
    
    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(237, 95, 0, 0.3);
    }
    
    .share-btn {
      background: white;
      color: #333;
      border: 2px solid #e0e0e0;
    }
    
    .share-btn:hover {
      border-color: #ED5F00;
      color: #ED5F00;
    }
    
    .icon-qr::before {
      content: "📱";
    }
    
    .icon-download::before {
      content: "⬇️";
    }
  `]
})
export class MobileTicketComponent implements OnInit {
  event: EventDTO | null = null;
  ticketNumber: string = '';
  
  // Informations du participant
  participantInfo = {
        name: 'Utilisateur',
    email: 'ridwan@example.com',
    phone: '+62 812-3456-7890'
  };

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.loadTicketDetails();
    this.generateTicketNumber();
  }

  loadTicketDetails(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.eventService.getEvent(eventId).subscribe({
        next: (event) => {
          this.event = event;
          console.log('Détails du billet:', event);
        },
        error: (error) => {
          console.error('Erreur lors du chargement du billet:', error);
        }
      });
    }
  }

  generateTicketNumber(): void {
    // Générer un numéro de billet unique
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.ticketNumber = `TKT-${timestamp}-${random}`.toUpperCase();
  }

  goBack(): void {
    // TODO: Navigation vers la page précédente
    console.log('Retour');
  }

  downloadTicket(): void {
    console.log('Télécharger le billet');
    // TODO: Implémenter le téléchargement du billet en PDF
  }

  shareTicket(): void {
    console.log('Partager le billet');
    // TODO: Implémenter le partage du billet
  }
} 