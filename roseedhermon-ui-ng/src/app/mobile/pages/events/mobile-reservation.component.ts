import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { EventService } from '../../../shared/services/events/events.service';
import { EventImageService } from '../../../shared/services/events/event-image.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EventCard, toEventCard } from '../../../shared/utils/event-presentation';
import { AuthService } from '../../../core/auth/auth.service';
import { ReservationDraftService } from '../../services/reservation-draft.service';
import { TicketStoreService } from '../../services/ticket-store.service';

/** Plafond du sélecteur de places, quand l'organisateur n'a pas annoncé de jauge. */
const MAX_SEATS = 10;

/**
 * Réservation sur mobile : qui vient, et combien de places.
 *
 * Cet écran manquait au parcours — le détail menait droit au paiement, et
 * l'inscription partait sans nom ni courriel. Le serveur la refuse désormais,
 * et il a raison : un billet sans personne au bout ne se contrôle pas à l'entrée.
 */
@Component({
  selector: 'app-mobile-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mobile-reservation.component.html',
  styleUrls: ['./mobile-reservation.component.scss']
})
export class MobileReservationComponent implements OnInit {
  card: EventCard | null = null;
  loading = true;
  loadError = '';

  firstName = '';
  lastName = '';
  email = '';
  phoneNumber = '';
  seats = 1;
  note = '';

  /** Les erreurs ne s'affichent qu'après une première tentative d'envoi. */
  touched = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private events: EventService,
    private images: EventImageService,
    private auth: AuthService,
    private draft: ReservationDraftService,
    private tickets: TicketStoreService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError = 'Aucun événement indiqué.';
      this.loading = false;
      return;
    }

    // Une place déjà prise sur cet appareil rouvre le billet plutôt que d'en créer un second.
    if (this.tickets.findByEvent(id)) {
      this.router.navigate(['/mobile/ticket', id], { replaceUrl: true });
      return;
    }

    this.events.getEvent(id).subscribe({
      next: (event: EventDTO) => {
        this.card = toEventCard(event, event.files?.length ? this.images.getEventImageUrl(event) : null);
        this.prefill(id);
        this.loading = false;
      },
      error: (error: { status?: number }) => {
        this.loadError =
          error?.status === 404
            ? "Cet événement n'existe pas, ou n'est pas ouvert à votre groupe."
            : `L'événement n'a pas pu être chargé (${error?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  /**
   * Ce qu'on sait déjà : le brouillon si l'on revient du paiement, sinon la fiche
   * membre de la session. Rien n'est inventé — un champ inconnu reste vide.
   */
  private prefill(eventId: string): void {
    const saved = this.draft.forEvent(eventId);
    if (saved) {
      this.firstName = saved.firstName;
      this.lastName = saved.lastName;
      this.email = saved.email;
      this.phoneNumber = saved.phoneNumber;
      this.seats = saved.seats;
      this.note = saved.note;
      return;
    }

    const member = this.auth.user().member;
    this.firstName = member?.firstName ?? '';
    this.lastName = member?.lastName ?? '';
    this.email = member?.email ?? this.auth.user().email ?? '';
    this.phoneNumber = member?.phoneNumber ?? '';
  }

  // --- Tarif ------------------------------------------------------------------------

  get requiresPayment(): boolean {
    return !!this.card && !this.card.free && !!this.card.amount;
  }

  get total(): number {
    if (!this.card?.amount) return 0;
    return this.card.amount * this.seats;
  }

  get totalLabel(): string {
    if (this.card?.free) return 'Gratuit';
    if (!this.card?.amount) return 'Tarif non communiqué';
    return `${this.total.toLocaleString('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} $`;
  }

  /** Le choix s'arrête à la jauge annoncée quand il y en a une. */
  get seatChoices(): number[] {
    const max = Math.min(MAX_SEATS, this.card?.seats ?? MAX_SEATS);
    return Array.from({ length: Math.max(1, max) }, (_, index) => index + 1);
  }

  // --- Validation -------------------------------------------------------------------

  get firstNameValid(): boolean {
    return this.firstName.trim().length >= 2;
  }

  get lastNameValid(): boolean {
    return this.lastName.trim().length >= 2;
  }

  get emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  get formValid(): boolean {
    return this.firstNameValid && this.lastNameValid && this.emailValid;
  }

  get submitLabel(): string {
    if (this.requiresPayment) return `Payer ${this.totalLabel}`;
    return 'Confirmer ma place';
  }

  // --- Actions ----------------------------------------------------------------------

  /**
   * Les coordonnées sont mises de côté, puis c'est l'écran du billet qui crée
   * réellement l'inscription — un seul endroit la crée, et le paiement peut
   * s'intercaler sans que rien ne se perde.
   */
  submit(): void {
    this.touched = true;
    const eventId = this.card?.id;
    if (!eventId || !this.formValid) return;

    this.draft.save({
      eventId,
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim().toLowerCase(),
      phoneNumber: this.phoneNumber.trim(),
      seats: this.seats,
      note: this.note.trim()
    });

    const target = this.requiresPayment ? '/mobile/payment' : '/mobile/ticket';
    this.router.navigate([target, eventId]);
  }

  goBack(): void {
    if (this.card?.id) {
      this.router.navigate(['/mobile/events', this.card.id]);
    } else {
      this.router.navigate(['/mobile/events']);
    }
  }
}
