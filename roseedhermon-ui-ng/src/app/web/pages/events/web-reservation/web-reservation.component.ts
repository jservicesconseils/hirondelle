import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventRegistrationDTO } from '../../../../shared/services/api/model/eventRegistrationDTO';
import { EventService } from '../../../../shared/services/events/events.service';
import { EventImageService } from '../../../../shared/services/events/event-image.service';
import { RegistrationService } from '../../../../shared/services/events/registrations.service';
import { EventCard, toEventCard } from '../../../../shared/utils/event-presentation';
import { AuthService } from '../../../../core/auth/auth.service';
import { TicketStoreService } from '../../../../mobile/services/ticket-store.service';
import { PublicHeaderComponent } from '../../../components/public-header.component';
import { PublicFooterComponent } from '../../../components/public-footer.component';

const MAX_SEATS = 10;

/**
 * Réservation d'une place : coordonnées du participant, paiement si l'événement
 * est payant, puis création de l'inscription réelle avant de délivrer le billet.
 */
@Component({
  selector: 'app-web-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './web-reservation.component.html',
  styleUrls: ['./web-reservation.component.scss']
})
export class WebReservationComponent implements OnInit {
  card: EventCard | null = null;
  loading = true;
  loadError = '';

  submitting = false;
  submitError = '';
  touched = false;

  // Coordonnées du participant, enregistrées avec l'inscription.
  firstName = '';
  lastName = '';
  email = '';
  phoneNumber = '';
  note = '';
  seats = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private events: EventService,
    private images: EventImageService,
    private registrations: RegistrationService,
    private tickets: TicketStoreService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError = 'Aucun événement indiqué.';
      this.loading = false;
      return;
    }

    // Une place déjà réservée depuis ce navigateur n'est pas reprise.
    if (this.tickets.findByEvent(id)) {
      this.router.navigate(['/web/evenements', id, 'billet'], { replaceUrl: true });
      return;
    }

    this.prefillFromSession();

    this.events.getEvent(id).subscribe({
      next: (event: EventDTO) => {
        this.card = toEventCard(event, event.files?.length ? this.images.getEventImageUrl(event) : null);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loadError =
          error?.status === 404
            ? "Cet événement n'existe pas, ou n'est pas ouvert à votre groupe."
            : `L'événement n'a pas pu être chargé (${error?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  /** Les champs sont préremplis quand une session est ouverte. */
  private prefillFromSession(): void {
    const user = this.auth.user();
    const member = user.member;

    this.firstName = member?.firstName ?? '';
    this.lastName = member?.lastName ?? '';
    this.email = member?.email ?? user.email ?? '';
    this.phoneNumber = member?.phoneNumber ?? '';
  }

  // --- Nature de la réservation -----------------------------------------------------

  /** Le paiement n'est demandé que si un montant est réellement fixé. */
  get requiresPayment(): boolean {
    return !!this.card && !this.card.free && this.card.amount !== null;
  }

  /** Total dû, recalculé sur le nombre de places. */
  get total(): number | null {
    if (!this.card?.amount) return null;
    return this.card.amount * this.seats;
  }

  get maxSeats(): number {
    return Math.min(MAX_SEATS, this.card?.seats ?? MAX_SEATS);
  }

  get seatChoices(): number[] {
    return Array.from({ length: this.maxSeats }, (_, index) => index + 1);
  }

  // --- Validation du participant ----------------------------------------------------

  get firstNameValid(): boolean {
    return this.firstName.trim().length >= 2;
  }

  get lastNameValid(): boolean {
    return this.lastName.trim().length >= 2;
  }

  get emailValid(): boolean {
    // Le courriel sert de clé : c'est par lui que l'on retrouve une inscription.
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email.trim());
  }

  get attendeeValid(): boolean {
    return this.firstNameValid && this.lastNameValid && this.emailValid;
  }

  get formValid(): boolean {
    return this.attendeeValid;
  }

  get submitLabel(): string {
    if (this.submitting) return this.requiresPayment ? 'Redirection vers le paiement…' : 'Enregistrement…';
    if (this.requiresPayment && this.total) return `Payer ${this.total} $ et réserver`;
    return 'Confirmer ma réservation';
  }

  // --- Envoi ------------------------------------------------------------------------

  private buildPayload(eventId: string): EventRegistrationDTO {
    const payload: EventRegistrationDTO = {
      eventId,
      status: 'CONFIRMED',
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      seats: this.seats
    };

    if (this.phoneNumber.trim()) payload.phoneNumber = this.phoneNumber.trim();
    if (this.note.trim()) payload.note = this.note.trim();

    // Rattache la place à la fiche membre quand une session est ouverte.
    const memberId = this.auth.user().member?.id;
    if (memberId) payload.userId = memberId;

    return payload;
  }

  submit(): void {
    this.touched = true;
    this.submitError = '';

    const eventId = this.card?.id;
    if (!eventId || !this.formValid || this.submitting) return;

    this.submitting = true;
    const payload = this.buildPayload(eventId);

    if (this.requiresPayment) {
      // Le paiement se fait sur la page hébergée de Stripe ; la réservation
      // n'est confirmée que par le webhook, une fois le paiement réglé.
      this.registrations.createCheckoutSession(payload).subscribe({
        next: ({ url }) => {
          window.location.href = url;
        },
        error: (error: HttpErrorResponse) => {
          this.submitting = false;
          this.submitError = describeError(error);
        }
      });
      return;
    }

    this.registrations.register(payload).subscribe({
      next: (registration) => {
        if (registration?.id) this.tickets.save(registration.id, eventId);
        this.router.navigate(['/web/evenements', eventId, 'billet'], { replaceUrl: true });
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.submitError = describeError(error);
      }
    });
  }

  back(): void {
    if (this.card?.id) {
      this.router.navigate(['/web/evenements', this.card.id]);
    } else {
      this.router.navigate(['/web']);
    }
  }
}

/** Le serveur explique lui-même les refus métier ; on les relaie tels quels. */
function describeError(error: HttpErrorResponse): string {
  const message = typeof error?.error?.error === 'string' ? error.error.error : null;

  // 409 « places insuffisantes » (registration.routes.ts) porte `availableSeats` ;
  // le 409 « paiement non configuré » (checkout.service.ts) ne le porte pas et
  // doit afficher son propre message, pas celui des places.
  if (error?.status === 409 && typeof error.error?.availableSeats === 'number') {
    const left = error.error.availableSeats;
    return left > 0
      ? `Il ne reste que ${left} place${left > 1 ? 's' : ''} sur cet événement.`
      : "Cet événement est complet : il ne reste plus de place.";
  }

  if (message) return message;
  return `La réservation n'a pas pu être enregistrée (${error?.status || 'réseau'}).`;
}
