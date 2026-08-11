import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventInterestDTO, EventStats } from '../../../../shared/services/api/model/eventStats';
import { EventInterestService } from '../../../../shared/services/events/event-interest.service';
import { CommonModule } from '@angular/common';
import { OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
  selector: 'app-detail-event',
  standalone: true,
  imports: [CommonModule, OverlayPanelModule],
  templateUrl: './detail-event.component.html',
  styleUrl: './detail-event.component.scss'
})
export class DetailEventComponent implements OnChanges {
  @Input() event!: EventDTO;
  @Output() close = new EventEmitter<void>();
  @Output() editEvent = new EventEmitter<EventDTO>();

  selectedPresenter: any = null;

  /** Chiffres de participation, chargés à l'ouverture du tiroir. */
  stats: EventStats | null = null;
  statsLoading = false;
  statsError = '';

  /** Liste nominative des intéressés, dépliée à la demande. */
  interested: EventInterestDTO[] = [];
  interestedOpen = false;
  interestedLoading = false;

  constructor(private interestService: EventInterestService) {}

  /**
   * Le tiroir est réutilisé d'un événement à l'autre sans être recréé : c'est le
   * changement d'entrée qui déclenche le rechargement, pas `ngOnInit`.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['event']) return;

    const previous = changes['event'].previousValue as EventDTO | undefined;
    if (previous?.id === this.event?.id) return;

    this.stats = null;
    this.statsError = '';
    this.interested = [];
    this.interestedOpen = false;
    this.loadStats();
  }

  private loadStats(): void {
    const id = this.event?.id;
    if (!id) return;

    this.statsLoading = true;
    this.interestService.stats(id).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.statsLoading = false;
      },
      error: (error: { status?: number }) => {
        // 403 : la page est ouverte par quelqu'un qui n'organise pas cet
        // événement. Ce n'est pas une panne, il n'y a simplement rien à montrer.
        this.statsError =
          error?.status === 403
            ? ''
            : `Les chiffres n'ont pas pu être chargés (${error?.status || 'réseau'}).`;
        this.statsLoading = false;
      }
    });
  }

  /** Déplie la liste des intéressés, et ne la charge qu'à ce moment-là. */
  toggleInterested(): void {
    this.interestedOpen = !this.interestedOpen;
    if (!this.interestedOpen || this.interested.length || !this.event?.id) return;

    this.interestedLoading = true;
    this.interestService.list(this.event.id).subscribe({
      next: (rows) => {
        this.interested = rows;
        this.interestedLoading = false;
      },
      error: () => {
        this.interestedLoading = false;
      }
    });
  }

  /** Nom affichable d'un intéressé ; le courriel à défaut de nom saisi. */
  nameOf(person: EventInterestDTO): string {
    const name = `${person.firstName || ''} ${person.lastName || ''}`.trim();
    return name || person.email || 'Anonyme';
  }

  /** Montant en dollars, comme sur la page de réservation. */
  money(value: number): string {
    return `${value.toLocaleString('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} $`;
  }

  get initials(): string {
    return (this.event?.name || '')
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase() || '?';
  }

  /** Statut réel, déduit de la date : aucun champ de statut n'est stocké. */
  get isUpcoming(): boolean {
    const date = parseFrDate(this.event?.date);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() >= today.getTime();
  }

  /**
   * Les dates arrivent déjà en « JJ/MM/AAAA » : les passer au pipe `date` les
   * ferait relire à l'américaine (10/01 devient le 1er octobre).
   */
  displayDate(value?: string): string {
    return (value || '').trim() || '—';
  }

  closePanel() {
    this.close.emit();
  }

  onClose() {
    this.closePanel();
  }

  onEdit() {
    this.editEvent.emit(this.event);
  }
}

function parseFrDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (match) {
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}
