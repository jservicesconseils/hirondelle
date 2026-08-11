import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventService } from '../../../../shared/services/events/events.service';
import { EventImageService } from '../../../../shared/services/events/event-image.service';
import { EventCard, toEventCard } from '../../../../shared/utils/event-presentation';
import { InterestButtonComponent } from '../../../components/interest-button.component';
import { PublicHeaderComponent } from '../../../components/public-header.component';
import { PublicFooterComponent } from '../../../components/public-footer.component';

/** Fiche publique d'un événement, avec sa marque d'intérêt et sa réservation. */
@Component({
  selector: 'app-web-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    InterestButtonComponent,
    PublicHeaderComponent,
    PublicFooterComponent
  ],
  templateUrl: './web-event-detail.component.html',
  styleUrls: ['./web-event-detail.component.scss']
})
export class WebEventDetailComponent implements OnInit {
  card: EventCard | null = null;
  loading = true;
  loadError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private events: EventService,
    private images: EventImageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError = 'Aucun événement indiqué.';
      this.loading = false;
      return;
    }

    this.events.getEvent(id).subscribe({
      next: (event: EventDTO) => {
        this.card = toEventCard(event, event.files?.length ? this.images.getEventImageUrl(event) : null);
        this.loading = false;
      },
      error: (error: { status?: number }) => {
        // Un événement privé d'un autre groupe répond 404 : son existence n'est pas révélée.
        this.loadError =
          error?.status === 404
            ? "Cet événement n'existe pas, ou n'est pas ouvert à votre groupe."
            : `L'événement n'a pas pu être chargé (${error?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  /** Intervenants annoncés par l'organisateur. Vide si aucun n'est saisi. */
  get presenters(): NonNullable<EventDTO['presenters']> {
    return this.card?.event.presenters?.filter((person) => person.firstName || person.lastName) ?? [];
  }

  get bookable(): boolean {
    return !!this.card?.upcoming;
  }

  onVisualError(): void {
    if (!this.card) return;
    this.card.visual = this.card.visual === this.card.style.illustration ? null : this.card.style.illustration;
  }

  book(): void {
    if (!this.card?.id) return;
    this.router.navigate(['/web/evenements', this.card.id, 'reservation']);
  }
}
