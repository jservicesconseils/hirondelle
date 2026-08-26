import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../shared/services/events/events.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EventFileControllerService } from '../../../shared/services/api/api/eventFileController.service';
import { EventFileDTO } from '../../../shared/services/api/model/eventFileDTO';
import { environment } from '../../../../environments/environment';

/** Un présentateur prêt à afficher (aucune photo n'est stockée : on met les initiales). */
interface PresenterView {
  initials: string;
  name: string;
  title: string;
}

/** Un document téléchargeable de l'événement. */
interface DocumentView {
  name: string;
  meta: string;
  url: string;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

@Component({
  selector: 'app-mobile-event-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-screen">
      <p class="state" *ngIf="loading">Chargement de l'événement…</p>
      <p class="state error" *ngIf="loadError">{{ loadError }}</p>

      <ng-container *ngIf="event && !loading">

        <!-- Visuel principal, titre et informations clés en surimpression -->
        <header class="hero" [style.background-image]="heroImage ? 'url(' + heroImage + ')' : null">
          <div class="hero-shade"></div>

          <button type="button" class="round-btn back" (click)="goBack()" aria-label="Retour">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
          </button>

          <button type="button" class="round-btn fav" [class.on]="favorite" (click)="favorite = !favorite" aria-label="Favori">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </button>

          <div class="hero-text">
            <h1>{{ event.name || 'Sans titre' }}</h1>
            <div class="hero-meta">
              <span>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z" /></svg>
                {{ dateLabel }}
              </span>
              <span *ngIf="placeLabel">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
                {{ placeLabel }}
              </span>
            </div>
          </div>
        </header>

        <!-- Feuille blanche remontant sur le visuel -->
        <div class="sheet">

          <section class="section" *ngIf="presenters.length">
            <h2>Présentateurs</h2>
            <div class="presenter-row">
              <figure class="presenter" *ngFor="let presenter of presenters">
                <span class="presenter-avatar">{{ presenter.initials }}</span>
                <figcaption>
                  <strong>{{ presenter.name }}</strong>
                  <small *ngIf="presenter.title">{{ presenter.title }}</small>
                </figcaption>
              </figure>
            </div>
          </section>

          <section class="section">
            <h2>Description</h2>
            <p class="description">{{ event.description || 'Aucune description n’a été renseignée pour cet événement.' }}</p>
          </section>

          <!-- Informations complémentaires réellement présentes en base -->
          <section class="section" *ngIf="facts.length">
            <h2>Informations</h2>
            <ul class="fact-list">
              <li *ngFor="let fact of facts">
                <span>{{ fact.label }}</span>
                <strong>{{ fact.value }}</strong>
              </li>
            </ul>
          </section>

          <section class="section" *ngIf="documents.length">
            <h2>Documents</h2>
            <a class="document" *ngFor="let document of documents" [href]="document.url" target="_blank" rel="noopener">
              <span class="doc-icon">{{ extensionOf(document.name) }}</span>
              <span class="doc-body">
                <strong>{{ document.name }}</strong>
                <small>{{ document.meta }}</small>
              </span>
              <svg class="doc-download" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </a>
          </section>

          <section class="section" *ngIf="gallery.length">
            <h2>Galerie photos</h2>
            <div class="gallery">
              <a class="gallery-item" *ngFor="let photo of gallery" [href]="photo" target="_blank" rel="noopener">
                <img [src]="photo" alt="Photo de l'événement" loading="lazy" />
              </a>
            </div>
          </section>
        </div>

        <!-- Action principale, ancrée en bas -->
        <div class="action-bar">
          <button type="button" class="reserve" (click)="reserve()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4z" />
            </svg>
            Réserver ma place
          </button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .detail-screen {
      min-height: 100vh;
      background: #fdf6f1;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #16202f;
      padding-bottom: 0;
    }

    .state {
      text-align: center;
      color: #667a92;
      font-size: 15px;
      padding: 60px 24px;
      margin: 0;
    }

    .state.error { color: #b00020; font-weight: 600; }

    /* ---------- Visuel ---------- */

    .hero {
      position: relative;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 18px 20px 46px;
      /* Faute de photo : le dégradé bleu des bandeaux, comme partout ailleurs. */
      background: linear-gradient(135deg, #16346b 0%, #2b5fb8 62%, #3d78d6 100%);
      background-size: cover;
      background-position: center;
    }

    .hero-shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.62) 100%);
    }

    .round-btn {
      position: absolute;
      top: 18px;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(6px);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2;
    }

    .round-btn svg { width: 22px; height: 22px; }
    .round-btn.back { left: 18px; }
    .round-btn.fav { right: 18px; }
    .round-btn.fav.on { color: #ff6b6b; }

    .hero-text { position: relative; z-index: 1; color: #fff; }

    .hero-text h1 {
      margin: 0 0 10px;
      // Une règle globale fixe la couleur des h1 : sans cette redéfinition, ici plus
      // spécifique, elle l'emporterait sur le blanc hérité du bandeau.
      color: #fff;
      font-size: 30px;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.01em;
      text-transform: uppercase;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
    }

    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.95);
    }

    .hero-meta span { display: inline-flex; align-items: center; gap: 6px; }
    .hero-meta svg { width: 16px; height: 16px; flex-shrink: 0; }

    /* ---------- Feuille de contenu ---------- */

    .sheet {
      position: relative;
      margin-top: -28px;
      padding: 24px 20px 8px;
      background: #fff;
      border-radius: 28px 28px 0 0;
    }

    .section { margin-bottom: 26px; }

    .section h2 {
      margin: 0 0 12px;
      font-size: 19px;
      font-weight: 800;
      text-align: center;
    }

    .description {
      margin: 0;
      font-size: 15px;
      line-height: 1.6;
      color: #667a92;
      text-align: center;
    }

    /* ---------- Présentateurs ---------- */

    .presenter-row {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .presenter {
      margin: 0;
      width: 96px;
      text-align: center;
    }

    .presenter-avatar {
      width: 76px;
      height: 76px;
      margin: 0 auto 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d3410d 0%, #f4551d 100%);
      color: #fff;
      font-size: 24px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .presenter figcaption strong {
      display: block;
      font-size: 14px;
      font-weight: 700;
    }

    .presenter figcaption small {
      display: block;
      font-size: 12px;
      color: #667a92;
      margin-top: 2px;
    }

    /* ---------- Informations ---------- */

    .fact-list { list-style: none; margin: 0; padding: 0; }

    .fact-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 0;
      border-bottom: 1px solid #eef1f7;
      font-size: 15px;
    }

    .fact-list li:last-child { border-bottom: none; }
    .fact-list span { color: #667a92; }
    .fact-list strong { font-weight: 700; text-align: right; }

    /* ---------- Documents ---------- */

    .document {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      text-decoration: none;
      color: inherit;
    }

    .doc-icon {
      flex: 0 0 42px;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ff8a5c 0%, #f4551d 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .doc-body { flex: 1 1 auto; min-width: 0; }

    .doc-body strong {
      display: block;
      font-size: 15px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .doc-body small { font-size: 13px; color: #667a92; }

    .doc-download { width: 22px; height: 22px; color: #2b5fb8; flex-shrink: 0; }

    /* ---------- Galerie ---------- */

    .gallery {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .gallery-item {
      display: block;
      border-radius: 12px;
      overflow: hidden;
      background: #f2f6fd;
      aspect-ratio: 1;
    }

    .gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; }

    /* ---------- Action ---------- */

    .action-bar {
      position: sticky;
      bottom: 0;
      z-index: 950;
      padding: 12px 18px 14px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 42%);
    }

    .reserve {
      width: 100%;
      height: 60px;
      border: none;
      border-radius: 30px;
      background: #f4551d;
      color: #fff;
      font: inherit;
      font-size: 19px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      box-shadow: 0 12px 26px rgba(244, 85, 46, 0.36);
    }

    .reserve svg { width: 24px; height: 24px; }
    .reserve:active { transform: scale(0.99); }
  `]
})
export class MobileEventDetailComponent implements OnInit {
  event: EventDTO | null = null;
  loading = true;
  loadError = '';
  favorite = false;

  heroImage = '';
  gallery: string[] = [];
  documents: DocumentView[] = [];
  presenters: PresenterView[] = [];
  facts: { label: string; value: string }[] = [];

  dateLabel = '';
  placeLabel = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private eventFiles: EventFileControllerService
  ) {}

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.loadError = 'Événement introuvable.';
      this.loading = false;
      return;
    }

    this.eventService.getEvent(eventId).subscribe({
      next: (event: EventDTO) => {
        this.event = event;
        this.buildView(event);
        this.loading = false;
        this.loadFiles(eventId);
      },
      error: (error: any) => {
        console.error("Erreur lors du chargement de l'événement", error);
        this.loadError = `Impossible de charger l'événement (${error?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/mobile/events']);
  }

  /**
   * Seul un événement explicitement gratuit saute le paiement. Un tarif absent ne
   * vaut pas gratuité : l'écran de paiement le signale et laisse confirmer la place.
   */
  /**
   * La réservation demande d'abord qui vient : sans nom ni courriel, le serveur
   * refuse l'inscription, et un billet anonyme ne se contrôle pas à l'entrée.
   */
  reserve(): void {
    if (!this.event?.id) return;
    this.router.navigate(['/mobile/reservation', this.event.id]);
  }

  extensionOf(fileName: string): string {
    const dot = fileName.lastIndexOf('.');
    return dot > -1 ? fileName.slice(dot + 1).toUpperCase().slice(0, 4) : 'DOC';
  }

  // --- Construction ---------------------------------------------------------------

  private buildView(event: EventDTO): void {
    const date = parseFrDate(event.date);
    const dayLabel = date
      ? capitalize(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }))
      : event.date || 'Date à définir';
    this.dateLabel = event.time ? `${dayLabel} · ${event.time}` : dayLabel;

    this.placeLabel = [event.location?.placeName, event.location?.city].filter(Boolean).join(', ');

    this.presenters = (event.presenters || []).map((presenter) => ({
      initials: `${(presenter.firstName || '').charAt(0)}${(presenter.lastName || '').charAt(0)}`.toUpperCase() || '?',
      name: `${presenter.firstName || ''} ${presenter.lastName || ''}`.trim() || 'Présentateur',
      title: presenter.title || ''
    }));

    // Uniquement les champs réellement renseignés : rien n'est inventé.
    const facts: { label: string; value: string }[] = [];
    if (event.category) facts.push({ label: 'Catégorie', value: event.category });
    if (event.eventType) facts.push({ label: 'Type', value: event.eventType });
    if (event.numberOfDays) facts.push({ label: 'Durée', value: `${event.numberOfDays} jour(s)` });
    if (event.availableSeats) facts.push({ label: 'Places disponibles', value: `${event.availableSeats}` });
    if (event.lastRegistrationDate) facts.push({ label: 'Clôture des inscriptions', value: event.lastRegistrationDate });
    facts.push({
      label: 'Tarif',
      value: event.free ? 'Gratuit' : (event.amount ? `${event.amount} $` : 'Non renseigné')
    });
    this.facts = facts;
  }

  private loadFiles(eventId: string): void {
    this.eventFiles.getEventFiles(eventId).subscribe({
      next: (files: EventFileDTO[]) => {
        const list = files || [];

        const images = list.filter((file) => isImage(file.fileName));
        this.gallery = images.map((file) => this.fileUrl(eventId, file));
        // La photo principale sert de visuel ; sinon la première image disponible.
        const main = images.find((file) => file.isMainPhoto) || images[0];
        this.heroImage = main ? this.fileUrl(eventId, main) : '';

        this.documents = list
          .filter((file) => !isImage(file.fileName))
          .map((file) => ({
            name: file.fileName || 'Document',
            meta: [formatSize(file.fileSize), this.extensionOf(file.fileName || '')].filter(Boolean).join(' · '),
            url: this.fileUrl(eventId, file)
          }));
      },
      error: (error: any) => {
        // Un événement sans fichiers reste parfaitement consultable.
        console.warn('Fichiers de l\'événement indisponibles', error);
      }
    });
  }

  /** Route de service des fichiers : `/api/v1/files/events/:eventId/:filename`. */
  private fileUrl(eventId: string, file: EventFileDTO): string {
    if (file.accessUrl) return file.accessUrl;
    return `${environment.host}/api/v1/files/events/${eventId}/${encodeURIComponent(file.fileName || '')}`;
  }
}

// --- Utilitaires ------------------------------------------------------------------

function isImage(fileName?: string): boolean {
  const name = (fileName || '').toLowerCase();
  return IMAGE_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function parseFrDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
