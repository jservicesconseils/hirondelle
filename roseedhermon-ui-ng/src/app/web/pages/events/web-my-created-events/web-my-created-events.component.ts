import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventStats } from '../../../../shared/services/api/model/eventStats';
import { EventService } from '../../../../shared/services/events/events.service';
import { EventImageService } from '../../../../shared/services/events/event-image.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { byDate, EventCard, toEventCard } from '../../../../shared/utils/event-presentation';
import { PublicHeaderComponent } from '../../../components/public-header.component';
import { PublicFooterComponent } from '../../../components/public-footer.component';

/** Une carte, augmentée des chiffres de son organisateur. */
interface OrganisedCard {
  card: EventCard;
  stats: EventStats | null;
}

/**
 * Événements créés par la personne connectée, avec leurs statistiques.
 *
 * `POST /events` pose désormais `createdByEmail` d'après la session : cette page
 * ne fait que retrouver, parmi tout ce qui est visible, ce que ce courriel a créé
 * — public ou réservé à un groupe, avec ou sans rôle d'administration. Le serveur
 * reste seul juge : `GET /:id/stats` refuse ce qu'`administers()` ne reconnaît pas.
 */
@Component({
  selector: 'app-web-my-created-events',
  standalone: true,
  imports: [CommonModule, RouterModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './web-my-created-events.component.html',
  styleUrls: ['./web-my-created-events.component.scss']
})
export class WebMyCreatedEventsComponent implements OnInit {
  items: OrganisedCard[] = [];
  loading = true;
  failed = false;

  constructor(
    private events: EventService,
    private images: EventImageService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.events.getEventsWithFiles().subscribe({
      next: (list) => this.ingest(list),
      error: () =>
        this.events.getEvents().subscribe({
          next: (list) => this.ingest(list),
          error: () => {
            this.loading = false;
            this.failed = true;
          }
        })
    });
  }

  private ingest(list: EventDTO[]): void {
    const email = (this.auth.user().email ?? '').trim().toLowerCase();

    const mine = (list ?? []).filter(
      (event) => !!email && (event.createdByEmail ?? '').trim().toLowerCase() === email
    );

    if (!mine.length) {
      this.items = [];
      this.loading = false;
      return;
    }

    const cards = mine
      .map((event) => toEventCard(event, event.files?.length ? this.images.getEventImageUrl(event) : null))
      .sort(byDate);

    // Une carte s'affiche même si ses chiffres échouent à charger — plutôt que de
    // faire disparaître tout l'onglet pour un seul appel qui a échoué.
    forkJoin(
      cards.map((card) =>
        this.events.getEventStats(card.id).pipe(catchError(() => of(null)))
      )
    ).subscribe((allStats) => {
      this.items = cards.map((card, index) => ({ card, stats: allStats[index] }));
      this.loading = false;
    });
  }

  trackByCard(_index: number, item: OrganisedCard): string {
    return item.card.id;
  }
}
