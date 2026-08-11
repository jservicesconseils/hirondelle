import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { EventService } from '../../../shared/services/events/events.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { environment } from '../../../../environments/environment';
import { TicketStoreService, StoredTicket } from '../../services/ticket-store.service';

/** Une entrée de l'historique, prête à afficher. */
interface TicketRow {
  ticket: StoredTicket;
  event: EventDTO;
  name: string;
  day: string;
  month: string;
  dateLabel: string;
  placeLabel: string;
  tariffLabel: string;
  passNumber: string;
  upcoming: boolean;
}

@Component({
  selector: 'app-mobile-tickets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tickets-screen">

      <header class="screen-head">
        <h1>Mes billets</h1>
        <p>{{ subtitle }}</p>
      </header>

      <p class="state" *ngIf="loading">Chargement de vos billets…</p>

      <!-- Aucun billet -->
      <section class="empty" *ngIf="!loading && !rows.length">
        <span class="empty-mark">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4z" />
          </svg>
        </span>
        <h2>Aucun billet pour l'instant</h2>
        <p>Vos réservations apparaîtront ici, avec leur code QR.</p>
        <button type="button" class="cta" (click)="browseEvents()">Découvrir les événements</button>
      </section>

      <ng-container *ngIf="!loading && rows.length">

        <section class="group" *ngIf="upcomingRows.length">
          <h2 class="group-title">À venir <span>{{ upcomingRows.length }}</span></h2>
          <ng-container *ngTemplateOutlet="list; context: { $implicit: upcomingRows }"></ng-container>
        </section>

        <section class="group" *ngIf="pastRows.length">
          <h2 class="group-title past">Passés <span>{{ pastRows.length }}</span></h2>
          <ng-container *ngTemplateOutlet="list; context: { $implicit: pastRows }"></ng-container>
        </section>
      </ng-container>

      <!-- Gabarit commun aux deux groupes -->
      <ng-template #list let-items>
        <article class="ticket-row" *ngFor="let row of items" [class.past]="!row.upcoming">
          <span class="date-badge">
            <strong>{{ row.day }}</strong>
            <small>{{ row.month }}</small>
          </span>

          <div class="row-body" (click)="openTicket(row)">
            <h3>{{ row.name }}</h3>
            <p *ngIf="row.placeLabel">{{ row.placeLabel }}</p>
            <p class="row-meta">{{ row.dateLabel }} · {{ row.tariffLabel }}</p>
            <span class="pass">PASS {{ row.passNumber }}</span>
          </div>

          <div class="row-actions">
            <button type="button" class="icon-btn view" (click)="openTicket(row)" aria-label="Voir le billet">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" /></svg>
            </button>
            <button type="button"
                    class="icon-btn cancel"
                    *ngIf="row.upcoming"
                    (click)="cancel(row)"
                    [disabled]="cancelling === row.ticket.registrationId"
                    aria-label="Annuler la réservation">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
            </button>
          </div>
        </article>
      </ng-template>

      <p class="footnote" *ngIf="!loading && rows.length">
        L'historique est conservé sur cet appareil : l'API d'inscription n'expose pas encore
        la liste des billets d'une personne.
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .tickets-screen {
      min-height: 100vh;
      padding: 26px 18px 24px;
      background:
        radial-gradient(58% 30% at 82% 8%, rgba(255, 214, 190, 0.5) 0%, rgba(255, 214, 190, 0) 100%),
        radial-gradient(52% 28% at 12% 52%, rgba(206, 224, 255, 0.45) 0%, rgba(206, 224, 255, 0) 100%),
        #f4f5f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1c20;
    }

    .screen-head { text-align: center; margin-bottom: 22px; }
    .screen-head h1 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
    .screen-head p { margin: 4px 0 0; font-size: 15px; color: #7c8189; }

    .state { text-align: center; color: #7c8189; padding: 40px 0; margin: 0; }

    /* ---------- État vide ---------- */

    .empty { text-align: center; padding: 30px 20px; }

    .empty-mark {
      width: 92px;
      height: 92px;
      margin: 0 auto 18px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffe6cc 0%, #ffd0b0 100%);
      color: #f4552e;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-mark svg { width: 44px; height: 44px; }

    .empty h2 { margin: 0 0 6px; font-size: 20px; font-weight: 800; }
    .empty p { margin: 0 0 20px; font-size: 15px; color: #7c8189; }

    .cta {
      height: 52px;
      padding: 0 26px;
      border: none;
      border-radius: 26px;
      background: linear-gradient(135deg, #ff9f45 0%, #f4552e 100%);
      color: #fff;
      font: inherit;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 22px rgba(244, 85, 46, 0.32);
    }

    /* ---------- Groupes ---------- */

    .group { margin-bottom: 24px; }

    .group-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px;
      font-size: 18px;
      font-weight: 800;
    }

    .group-title span {
      padding: 2px 9px;
      border-radius: 10px;
      background: #e6f4ec;
      color: #17804a;
      font-size: 13px;
      font-weight: 700;
    }

    .group-title.past span { background: #eceef2; color: #6b7178; }

    /* ---------- Ligne de billet ---------- */

    .ticket-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      margin-bottom: 12px;
      background: rgba(255, 255, 255, 0.88);
      border-radius: 20px;
      box-shadow: 0 6px 20px rgba(31, 26, 22, 0.07);
    }

    .ticket-row.past { opacity: 0.72; }

    .date-badge {
      flex: 0 0 56px;
      width: 56px;
      padding: 8px 0;
      border-radius: 16px;
      background: linear-gradient(135deg, #ff9f45 0%, #f4552e 100%);
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1.1;
    }

    .ticket-row.past .date-badge { background: linear-gradient(135deg, #b9bfc9 0%, #98a0ac 100%); }

    .date-badge strong { font-size: 20px; font-weight: 800; }
    .date-badge small { font-size: 11px; letter-spacing: 0.06em; }

    .row-body { flex: 1 1 auto; min-width: 0; cursor: pointer; }

    .row-body h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 800;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .row-body p {
      margin: 2px 0 0;
      font-size: 13.5px;
      color: #5f646b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .row-body .row-meta { color: #7c8189; }

    .pass {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 9px;
      border-radius: 8px;
      background: #eef2f8;
      color: #4a5560;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }

    .row-actions { display: flex; flex-direction: column; gap: 8px; }

    .icon-btn {
      width: 38px;
      height: 38px;
      border: none;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .icon-btn svg { width: 19px; height: 19px; }
    .icon-btn.view { background: #e8f1ff; color: #1877d6; }
    .icon-btn.cancel { background: #fdeceb; color: #d0402c; }
    .icon-btn:disabled { opacity: 0.5; cursor: default; }

    .footnote {
      margin: 4px 0 0;
      text-align: center;
      font-size: 12.5px;
      line-height: 1.5;
      color: #8a9096;
    }
  `]
})
export class MobileTicketsComponent implements OnInit {
  rows: TicketRow[] = [];
  loading = true;
  cancelling = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private eventService: EventService,
    private ticketStore: TicketStoreService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get upcomingRows(): TicketRow[] {
    return this.rows.filter((row) => row.upcoming);
  }

  get pastRows(): TicketRow[] {
    return this.rows.filter((row) => !row.upcoming);
  }

  get subtitle(): string {
    if (this.loading) return 'Historique de vos participations';
    if (!this.rows.length) return 'Historique de vos participations';
    const upcoming = this.upcomingRows.length;
    return upcoming
      ? `${this.rows.length} billet(s) · ${upcoming} à venir`
      : `${this.rows.length} billet(s) · tous passés`;
  }

  browseEvents(): void {
    this.router.navigate(['/mobile/events']);
  }

  openTicket(row: TicketRow): void {
    this.router.navigate(['/mobile/ticket', row.ticket.eventId]);
  }

  /** Annulation réelle : `DELETE /api/v1/registrations/:id`, puis retrait de l'historique. */
  cancel(row: TicketRow): void {
    this.cancelling = row.ticket.registrationId;
    this.http.delete(`${environment.host}/api/v1/registrations/${row.ticket.registrationId}`).subscribe({
      next: () => {
        this.ticketStore.remove(row.ticket.registrationId);
        this.rows = this.rows.filter((item) => item.ticket.registrationId !== row.ticket.registrationId);
        this.cancelling = '';
      },
      error: (error: any) => {
        console.error('Annulation impossible', error);
        this.cancelling = '';
      }
    });
  }

  private load(): void {
    const tickets = this.ticketStore.all();
    if (!tickets.length) {
      this.loading = false;
      return;
    }

    // Un événement supprimé entre-temps ne doit pas casser la page : il est ignoré.
    forkJoin(
      tickets.map((ticket) =>
        this.eventService.getEvent(ticket.eventId).pipe(catchError(() => of(null as EventDTO | null)))
      )
    ).subscribe((events) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.rows = tickets
        .map((ticket, index) => ({ ticket, event: events[index] }))
        .filter((entry): entry is { ticket: StoredTicket; event: EventDTO } => !!entry.event)
        .map(({ ticket, event }) => {
          const date = parseFrDate(event.date);
          const day = date ? capitalize(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })) : (event.date || 'Date à définir');
          return {
            ticket,
            event,
            name: event.name || 'Événement',
            day: date ? `${date.getDate()}`.padStart(2, '0') : '--',
            month: date ? date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase() : '',
            dateLabel: event.time ? `${day} · ${event.time}` : day,
            placeLabel: [event.location?.placeName, event.location?.city].filter(Boolean).join(', '),
            tariffLabel: event.free ? 'Gratuit' : (event.amount ? `${event.amount} $` : 'Tarif non renseigné'),
            passNumber: '#' + ticket.registrationId.slice(-6).toUpperCase(),
            upcoming: !!date && date.getTime() >= today.getTime()
          };
        })
        // Les prochains d'abord, puis les passés du plus récent au plus ancien.
        .sort((a, b) => {
          if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
          const timeA = parseFrDate(a.event.date)?.getTime() ?? 0;
          const timeB = parseFrDate(b.event.date)?.getTime() ?? 0;
          return a.upcoming ? timeA - timeB : timeB - timeA;
        });

      this.loading = false;
    });
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
