import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import * as QRCode from 'qrcode';

import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventRegistrationDTO } from '../../../../shared/services/api/model/eventRegistrationDTO';
import { EventService } from '../../../../shared/services/events/events.service';
import { EventImageService } from '../../../../shared/services/events/event-image.service';
import { RegistrationService } from '../../../../shared/services/events/registrations.service';
import { EventCard, toEventCard } from '../../../../shared/utils/event-presentation';
import { TicketStoreService } from '../../../../mobile/services/ticket-store.service';
import { PublicHeaderComponent } from '../../../components/public-header.component';
import { PublicFooterComponent } from '../../../components/public-footer.component';

/**
 * Billet délivré après la réservation : récapitulatif, code QR, et impression.
 *
 * L'inscription est relue depuis l'API — le billet reste donc valable si le
 * navigateur a été vidé, pourvu que l'on dispose de son identifiant. Le code QR
 * encode cette inscription réelle, celle que le contrôle retrouvera.
 */
@Component({
  selector: 'app-web-ticket',
  standalone: true,
  imports: [CommonModule, RouterModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './web-ticket.component.html',
  styleUrls: ['./web-ticket.component.scss']
})
export class WebTicketComponent implements OnInit {
  card: EventCard | null = null;
  registration: EventRegistrationDTO | null = null;

  loading = true;
  loadError = '';

  cancelling = false;
  cancelled = false;
  qrDataUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private events: EventService,
    private images: EventImageService,
    private registrations: RegistrationService,
    private tickets: TicketStoreService
  ) {}

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.loadError = 'Aucun événement indiqué.';
      this.loading = false;
      return;
    }

    // L'identifiant vient de l'adresse — un billet partagé s'ouvre ainsi sur
    // n'importe quel appareil — ou, à défaut, de l'historique du navigateur.
    const registrationId =
      this.route.snapshot.queryParamMap.get('inscription') || this.tickets.findByEvent(eventId)?.registrationId;

    if (!registrationId) {
      this.loadError = "Aucune réservation n'a été trouvée pour cet événement.";
      this.loading = false;
      return;
    }

    this.registrations
      .get(registrationId)
      .pipe(
        switchMap((registration) => {
          this.registration = registration;
          // La réservation garantit la correspondance ; on garde la trace locale à jour.
          if (registration.id) this.tickets.save(registration.id, eventId);
          return this.events.getEvent(eventId);
        })
      )
      .subscribe({
        next: (event: EventDTO) => {
          this.card = toEventCard(event, event.files?.length ? this.images.getEventImageUrl(event) : null);
          this.buildQrCode();
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loadError =
            error?.status === 404
              ? "Cette réservation n'existe plus : elle a peut-être été annulée."
              : `Le billet n'a pas pu être chargé (${error?.status || 'réseau'}).`;
          this.loading = false;
        }
      });
  }

  /** Numéro lisible, repris des derniers caractères de l'inscription. */
  get passNumber(): string {
    return '#' + (this.registration?.id ?? '').slice(-6).toUpperCase();
  }

  get holderName(): string | null {
    const name = [this.registration?.firstName, this.registration?.lastName].filter(Boolean).join(' ').trim();
    return name || null;
  }

  get seats(): number {
    return this.registration?.seats ?? 1;
  }

  get bookedAt(): Date | null {
    return this.registration?.createdAt ? new Date(this.registration.createdAt) : null;
  }

  get tariffLabel(): string {
    if (!this.card) return '';
    if (this.card.free) return 'Entrée gratuite';
    return this.card.amount ? `${this.card.amount} $ la place` : 'Tarif non communiqué';
  }

  get totalLabel(): string | null {
    if (!this.card?.amount) return null;
    return `${this.card.amount * this.seats} $`;
  }

  /** Adresse qui rouvre ce billet depuis n'importe quel appareil. */
  get shareUrl(): string {
    if (!this.card?.id || !this.registration?.id) return '';
    return `${location.origin}/web/evenements/${this.card.id}/billet?inscription=${this.registration.id}`;
  }

  print(): void {
    window.print();
  }

  /** Enregistre le code QR seul : c'est lui qui sera présenté au contrôle. */
  download(): void {
    if (!this.qrDataUrl) return;
    const link = document.createElement('a');
    link.href = this.qrDataUrl;
    link.download = `billet-${slug(this.card?.name)}-${this.passNumber.replace('#', '')}.png`;
    link.click();
  }

  copyLink(): void {
    if (this.shareUrl) navigator.clipboard?.writeText(this.shareUrl);
  }

  cancel(): void {
    const registrationId = this.registration?.id;
    if (!registrationId || this.cancelling) return;

    this.cancelling = true;
    this.registrations.cancel(registrationId).subscribe({
      next: () => {
        this.tickets.remove(registrationId);
        this.cancelling = false;
        this.cancelled = true;
      },
      error: (error: HttpErrorResponse) => {
        this.cancelling = false;
        this.loadError = `L'annulation a échoué (${error?.status || 'réseau'}).`;
      }
    });
  }

  backHome(): void {
    this.router.navigate(['/web']);
  }

  private buildQrCode(): void {
    const payload = `RDH|${this.registration?.id ?? ''}|${this.card?.id ?? ''}`;
    QRCode.toDataURL(payload, { margin: 0, width: 320, errorCorrectionLevel: 'M' })
      .then((url: string) => (this.qrDataUrl = url))
      .catch((error: unknown) => console.error('Génération du code QR impossible', error));
  }
}

function slug(value?: string): string {
  return (value || 'evenement')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
