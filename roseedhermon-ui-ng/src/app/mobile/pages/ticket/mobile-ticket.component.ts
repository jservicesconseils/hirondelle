import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as QRCode from 'qrcode';

import { EventService } from '../../../shared/services/events/events.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EventRegistrationDTO } from '../../../shared/services/api/model/eventRegistrationDTO';
import { environment } from '../../../../environments/environment';
import { TicketStoreService } from '../../services/ticket-store.service';
import { ReservationDraftService } from '../../services/reservation-draft.service';

@Component({
  selector: 'app-mobile-ticket',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ticket-screen">

      <!-- Bandeau de confirmation -->
      <header class="confirm" [class.pending]="loading" [class.failed]="!!loadError">
        <button type="button" class="round-btn" (click)="goBack()" aria-label="Retour">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        </button>

        <span class="confirm-mark" *ngIf="!loadError">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l2.5 2.5L16 9.5" />
          </svg>
        </span>

        <h1 *ngIf="loading">Réservation en cours…</h1>
        <h1 *ngIf="!loading && !loadError && !alreadyBooked">Réservation confirmée !</h1>
        <h1 *ngIf="!loading && !loadError && alreadyBooked">Votre billet</h1>
        <h1 *ngIf="loadError">Réservation impossible</h1>

        <p *ngIf="!loading && !loadError && !alreadyBooked">Votre billet est prêt</p>
        <p *ngIf="!loading && !loadError && alreadyBooked">Vous êtes déjà inscrit à cet événement</p>
        <p *ngIf="loadError">{{ loadError }}</p>
      </header>

      <!-- Billet -->
      <section class="ticket" *ngIf="!loading && !loadError && event">
        <span class="admit">ADMIT ONE</span>

        <div class="ticket-body">
          <div class="ticket-info">
            <h2>{{ event.name || 'Événement' }}</h2>

            <p>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z" /></svg>
              {{ dateLabel }}
            </p>

            <p *ngIf="placeLabel">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
              {{ placeLabel }}
            </p>

            <p>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              {{ tariffLabel }} · 1 personne
            </p>
          </div>

          <div class="ticket-stub">
            <span class="pass">PASS {{ passNumber }}</span>
            <img class="qr" *ngIf="qrDataUrl" [src]="qrDataUrl" alt="Code QR du billet" />
          </div>
        </div>
      </section>

      <p class="notice" *ngIf="!loading && !loadError">
        Présentez ce billet à l'entrée<span *ngIf="event?.date"> · Valide le {{ event?.date }}</span>
      </p>

      <div class="actions" *ngIf="!loading && !loadError">
        <button type="button" class="btn outline" (click)="download()">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
          Télécharger
        </button>
        <button type="button" class="btn solid" (click)="share()">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" /></svg>
          Partager
        </button>
      </div>

      <p class="footnote" *ngIf="!loading && !loadError">
        Billet enregistré sur votre compte · Aucun envoi par courriel n'est encore configuré.
      </p>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .ticket-screen {
      min-height: 100vh;
      background: #f6f5f2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1b1e23;
      padding-bottom: 24px;
    }

    /* ---------- Confirmation ---------- */

    .confirm {
      position: relative;
      padding: 46px 24px 34px;
      text-align: center;
      background: linear-gradient(180deg, #dff0dd 0%, #eaf6e6 100%);
      border-radius: 0 0 30px 30px;
      color: #1e7a45;
    }

    .confirm.pending { background: linear-gradient(180deg, #e7edf5 0%, #f1f5fa 100%); color: #3c5470; }
    .confirm.failed { background: linear-gradient(180deg, #fbe3e0 0%, #fdeeec 100%); color: #b3382a; }

    .round-btn {
      position: absolute;
      top: 18px;
      left: 18px;
      width: 38px;
      height: 38px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.7);
      color: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .round-btn svg { width: 20px; height: 20px; }

    .confirm-mark { display: block; margin-bottom: 14px; }
    .confirm-mark svg { width: 62px; height: 62px; }

    .confirm h1 {
      margin: 0;
      font-size: 27px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .confirm p { margin: 6px 0 0; font-size: 16px; color: #4a5560; }

    /* ---------- Billet ---------- */

    .ticket {
      position: relative;
      margin: -14px 18px 0;
      padding: 22px 18px;
      background: #fffdf8;
      border-radius: 18px;
      box-shadow: 0 12px 30px rgba(40, 34, 24, 0.12);
    }

    /* Bords dentelés du billet papier. */
    .ticket::before,
    .ticket::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 10px;
      background-image: radial-gradient(circle at 0 8px, #f6f5f2 5px, transparent 5.5px);
      background-size: 10px 16px;
      background-repeat: repeat-y;
    }

    .ticket::before { left: 0; }
    .ticket::after { right: 0; transform: scaleX(-1); }

    .admit {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      background: #f4551d;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }

    .ticket-body { display: flex; align-items: flex-start; gap: 14px; }

    .ticket-info { flex: 1 1 auto; min-width: 0; }

    .ticket-info h2 {
      margin: 0 0 12px;
      font-size: 22px;
      font-weight: 800;
      text-transform: uppercase;
      color: #1b3a63;
      letter-spacing: -0.01em;
    }

    .ticket-info p {
      display: flex;
      align-items: center;
      gap: 9px;
      margin: 7px 0 0;
      font-size: 14px;
      color: #3f454d;
    }

    .ticket-info svg { width: 17px; height: 17px; flex-shrink: 0; color: #6b7480; }

    .ticket-stub {
      flex: 0 0 116px;
      padding-left: 14px;
      border-left: 2px dashed #ddd8cd;
      text-align: center;
    }

    .pass {
      display: block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #6b7480;
      margin-bottom: 8px;
    }

    .qr { width: 100%; max-width: 104px; display: block; margin: 0 auto; }

    /* ---------- Bas d'écran ---------- */

    .notice {
      margin: 20px 24px 0;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #3f454d;
    }

    .actions {
      display: flex;
      gap: 12px;
      padding: 18px 18px 0;
    }

    .btn {
      flex: 1 1 0;
      height: 54px;
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font: inherit;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn svg { width: 20px; height: 20px; }

    .btn.outline {
      border: 2px solid #1b3a63;
      background: #fff;
      color: #1b3a63;
    }

    .btn.solid {
      border: none;
      background: #f4551d;
      color: #fff;
      box-shadow: 0 10px 22px rgba(244, 85, 46, 0.32);
    }

    .footnote {
      margin: 16px 24px 0;
      text-align: center;
      font-size: 12.5px;
      color: #667a92;
    }
  `]
})
export class MobileTicketComponent implements OnInit {
  event: EventDTO | null = null;
  registration: EventRegistrationDTO | null = null;

  loading = true;
  loadError = '';
  /** Vrai quand le billet existait déjà : on ne réinscrit pas. */
  alreadyBooked = false;
  /** Arrivée directe sur cet écran, sans être passé par la réservation. */
  needsDetails = false;

  qrDataUrl = '';
  dateLabel = '';
  placeLabel = '';
  tariffLabel = 'Billet standard';
  passNumber = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private http: HttpClient,
    private ticketStore: TicketStoreService,
    private draft: ReservationDraftService
  ) {}

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.loadError = 'Aucun événement indiqué.';
      this.loading = false;
      return;
    }

    // L'événement, puis l'inscription réelle : le numéro de billet est celui rendu par l'API.
    // Revenir sur un billet déjà pris le rouvre au lieu d'inscrire une seconde fois.
    this.eventService
      .getEvent(eventId)
      .pipe(
        switchMap((event: EventDTO) => {
          this.event = event;
          this.buildLabels(event);

          const existing = this.ticketStore.findByEvent(eventId);
          if (existing) {
            this.alreadyBooked = true;
            return of<EventRegistrationDTO>({ id: existing.registrationId, eventId, status: 'CONFIRMED' });
          }

          /**
           * Coordonnées saisies à l'écran de réservation. Sans elles, la requête
           * partait avec le seul identifiant d'événement — et le serveur la
           * refuse : une inscription sans nom ni courriel ne se contrôle pas à
           * l'entrée, et ne permet pas de retrouver son billet.
           */
          const draft = this.draft.forEvent(eventId);
          if (!draft) {
            this.needsDetails = true;
            return of<EventRegistrationDTO>({ eventId });
          }

          return this.http.post<EventRegistrationDTO>(
            `${environment.host}/api/v1/registrations`,
            {
              eventId,
              status: 'CONFIRMED',
              firstName: draft.firstName,
              lastName: draft.lastName,
              email: draft.email,
              seats: draft.seats,
              ...(draft.phoneNumber ? { phoneNumber: draft.phoneNumber } : {}),
              ...(draft.note ? { note: draft.note } : {})
            }
          );
        })
      )
      .subscribe({
        next: (registration) => {
          // Sans coordonnées, rien n'a été créé : on renvoie saisir qui vient.
          if (this.needsDetails) {
            this.router.navigate(['/mobile/reservation', eventId], { replaceUrl: true });
            return;
          }

          this.registration = registration;
          this.passNumber = '#' + (registration?.id || '').slice(-6).toUpperCase();
          if (registration?.id) this.ticketStore.save(registration.id, eventId);
          // Le brouillon a fait son office : il n'a plus à traîner.
          this.draft.clear();
          this.buildQrCode();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors de la réservation', error);
          this.loadError = `La réservation n'a pas pu être enregistrée (${error?.status || 'réseau'}).`;
          this.loading = false;
        }
      });
  }

  goBack(): void {
    if (this.event?.id) {
      this.router.navigate(['/mobile/events', this.event.id]);
    } else {
      this.router.navigate(['/mobile/events']);
    }
  }

  download(): void {
    if (!this.qrDataUrl) return;
    const link = document.createElement('a');
    link.href = this.qrDataUrl;
    link.download = `billet-${(this.event?.name || 'evenement').replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
  }

  share(): void {
    const text = `Billet ${this.passNumber} — ${this.event?.name || 'Événement'} · ${this.dateLabel}`;
    const shareApi = (navigator as any).share;
    if (typeof shareApi === 'function') {
      shareApi.call(navigator, { title: this.event?.name || 'Billet', text }).catch(() => undefined);
      return;
    }
    // Repli lorsque le partage natif n'existe pas (navigateur de bureau).
    navigator.clipboard?.writeText(text);
  }

  private buildLabels(event: EventDTO): void {
    const date = parseFrDate(event.date);
    const day = date
      ? capitalize(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }))
      : event.date || 'Date à définir';
    this.dateLabel = event.time ? `${day} · ${event.time}` : day;

    this.placeLabel = [event.location?.placeName, event.location?.city].filter(Boolean).join(', ');
    this.tariffLabel = event.free ? 'Billet gratuit' : (event.amount ? `Billet ${event.amount} $` : 'Billet standard');
  }

  /** Le code encode l'inscription réelle : identifiant d'inscription et d'événement. */
  private buildQrCode(): void {
    const payload = `RDH|${this.registration?.id || ''}|${this.event?.id || ''}`;
    QRCode.toDataURL(payload, { margin: 0, width: 240, errorCorrectionLevel: 'M' })
      .then((url: string) => (this.qrDataUrl = url))
      .catch((error: unknown) => console.error('Génération du code QR impossible', error));
  }
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
