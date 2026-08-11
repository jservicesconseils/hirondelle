import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventService } from '../../../../shared/services/events/events.service';
import { EVENT_CATEGORIES } from '../../../../shared/models/model';
import { CategoryStyle, styleOf } from '../../../../shared/utils/event-presentation';
import { AuthService } from '../../../../core/auth/auth.service';
import { PublicHeaderComponent } from '../../../components/public-header.component';
import { PublicFooterComponent } from '../../../components/public-footer.component';

type Visibility = 'PUBLIC' | 'PRIVATE';

/**
 * Création d'un événement depuis le site.
 *
 * Un événement **public** peut être créé sans compte. Un événement **réservé au
 * groupe** exige une session d'administration : c'est le serveur qui le refuse,
 * l'écran ne fait que l'annoncer à l'avance.
 */
@Component({
  selector: 'app-web-create-event',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './web-create-event.component.html',
  styleUrls: ['./web-create-event.component.scss']
})
export class WebCreateEventComponent implements OnInit {
  readonly categories = EVENT_CATEGORIES;

  // Le formulaire, à plat : chaque champ correspond à une propriété de l'EventDTO.
  name = '';
  category = '';
  date = '';
  time = '';
  numberOfDays: number | null = null;
  placeName = '';
  address = '';
  city = '';
  postalCode = '';
  country = 'Canada';
  description = '';
  free = true;
  amount: number | null = null;
  availableSeats: number | null = null;
  lastRegistrationDate = '';
  visibility: Visibility = 'PUBLIC';

  submitting = false;
  touched = false;
  submitError = '';

  constructor(
    public auth: AuthService,
    private events: EventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Un administrateur arrive le plus souvent pour créer un événement de son groupe.
    if (this.auth.canAdminister()) this.visibility = 'PRIVATE';
  }

  // --- Aperçu -----------------------------------------------------------------------

  get style(): CategoryStyle {
    return styleOf(this.category);
  }

  get dayLabel(): string {
    const parsed = this.parsedDate;
    return parsed ? String(parsed.getDate()).padStart(2, '0') : '--';
  }

  get monthLabel(): string {
    const parsed = this.parsedDate;
    return parsed ? MONTHS[parsed.getMonth()] : '';
  }

  get placeLabel(): string | null {
    return [this.placeName.trim(), this.city.trim()].filter(Boolean).join(', ') || null;
  }

  get priceLabel(): string {
    if (this.free) return 'Gratuit';
    return this.amount ? `${this.amount} $` : 'Tarif à préciser';
  }

  // --- Validation -------------------------------------------------------------------

  /** Attendu par l'API : « JJ/MM/AAAA ». */
  private get parsedDate(): Date | null {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(this.date.trim());
    if (!match) return null;
    const parsed = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  get nameValid(): boolean {
    return this.name.trim().length >= 3;
  }

  get categoryValid(): boolean {
    return !!this.category;
  }

  get dateValid(): boolean {
    return this.parsedDate !== null;
  }

  get amountValid(): boolean {
    return this.free || (this.amount !== null && this.amount > 0);
  }

  /** Un événement privé n'est proposé qu'aux comptes qui peuvent en créer. */
  get canCreatePrivate(): boolean {
    return this.auth.canAdminister();
  }

  get formValid(): boolean {
    return this.nameValid && this.categoryValid && this.dateValid && this.amountValid;
  }

  onDateInput(value: string): void {
    // Insère les barres obliques au fil de la frappe : 12122026 → 12/12/2026.
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)];
    this.date = parts.filter(Boolean).join('/');
  }

  onDeadlineInput(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)];
    this.lastRegistrationDate = parts.filter(Boolean).join('/');
  }

  chooseVisibility(value: Visibility): void {
    if (value === 'PRIVATE' && !this.canCreatePrivate) return;
    this.visibility = value;
  }

  // --- Envoi ------------------------------------------------------------------------

  submit(): void {
    this.touched = true;
    this.submitError = '';

    if (!this.formValid || this.submitting) return;

    this.submitting = true;

    const payload: EventDTO = {
      name: this.name.trim(),
      category: this.category,
      date: this.date.trim(),
      description: this.description.trim() || undefined,
      free: this.free,
      visibility: this.canCreatePrivate ? this.visibility : 'PUBLIC'
    };

    if (this.time.trim()) payload.time = this.time.trim();
    if (!this.free && this.amount) payload.amount = this.amount;
    if (this.availableSeats) payload.availableSeats = this.availableSeats;
    if (this.numberOfDays) payload.numberOfDays = this.numberOfDays;
    if (this.lastRegistrationDate.trim()) payload.lastRegistrationDate = this.lastRegistrationDate.trim();

    const location = {
      placeName: this.placeName.trim(),
      address: this.address.trim(),
      city: this.city.trim(),
      postalCode: this.postalCode.trim(),
      country: this.country.trim()
    };
    // Une adresse entièrement vide n'est pas envoyée : mieux vaut rien qu'un objet creux.
    if (Object.values(location).some((value) => value)) payload.location = location;

    this.events.createEvent(payload).subscribe({
      next: (created) => {
        if (created?.id) {
          this.router.navigate(['/web/evenements', created.id]);
        } else {
          this.router.navigate(['/web']);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.submitError = describeError(error);
      }
    });
  }
}

const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];

/** Le serveur explique lui-même ses refus ; on les relaie tels quels. */
function describeError(error: HttpErrorResponse): string {
  const message = typeof error?.error?.error === 'string' ? error.error.error : null;
  if (message) return message;
  if (error?.status === 401) return 'Connectez-vous pour créer un événement réservé à un groupe.';
  return `L'événement n'a pas pu être créé (${error?.status || 'réseau'}).`;
}
