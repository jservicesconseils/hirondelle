import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EventService } from '../../../shared/services/events/events.service';
import { EventImageService } from '../../../shared/services/events/event-image.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EventCard, byDate, toEventCard } from '../../../shared/utils/event-presentation';

/** Onglets de la liste : ce qui vient, ce qui est passé, tout. */
type Scope = 'upcoming' | 'past';

@Component({
  selector: 'app-mobile-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mobile-events.component.html',
  styleUrls: ['./mobile-events.component.scss']
})
export class MobileEventsComponent implements OnInit {
  cards: EventCard[] = [];
  loading = true;
  failed = false;

  scope: Scope = 'upcoming';
  query = '';
  category = '';

  constructor(
    private eventService: EventService,
    private images: EventImageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.eventService.getEvents().subscribe({
      next: (events: EventDTO[]) => {
        this.cards = (events || [])
          .map((event) => toEventCard(event, event.files?.length ? this.images.getEventImageUrl(event) : null))
          .sort(byDate);
        this.loading = false;
      },
      error: (error) => {
        console.error('Chargement des événements', error);
        this.failed = true;
        this.loading = false;
      }
    });
  }

  // --- Répartition ------------------------------------------------------------------

  get upcoming(): EventCard[] {
    return this.cards.filter((card) => card.upcoming);
  }

  get past(): EventCard[] {
    return this.cards.filter((card) => !card.upcoming);
  }

  /**
   * Catégories réellement portées par les événements chargés, et non le
   * référentiel complet : proposer un filtre qui ne rend rien n'aide personne.
   */
  get categories(): string[] {
    const found = new Set<string>();
    this.cards.forEach((card) => {
      if (card.category) found.add(card.category);
    });
    return [...found].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  get shown(): EventCard[] {
    const base = this.scope === 'upcoming' ? this.upcoming : this.past;
    const needle = this.query.trim().toLowerCase();

    return base.filter((card) => {
      if (this.category && card.category !== this.category) return false;
      if (!needle) return true;
      return [card.name, card.description, card.category, card.place, card.city]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(needle));
    });
  }

  get emptyMessage(): string {
    if (this.query.trim() || this.category) return 'Aucun événement ne correspond à votre recherche.';
    return this.scope === 'upcoming'
      ? "Aucun événement à venir pour l'instant."
      : 'Aucun événement passé.';
  }

  // --- Actions ----------------------------------------------------------------------

  show(scope: Scope): void {
    this.scope = scope;
  }

  pickCategory(value: string): void {
    // Un second appui sur la même catégorie la retire : pas de bouton « tout » à chercher.
    this.category = this.category === value ? '' : value;
  }

  open(card: EventCard): void {
    if (card.id) this.router.navigate(['/mobile/events', card.id]);
  }

  /** Une illustration manquante ne doit pas laisser une case vide : on retombe sur le dégradé. */
  onVisualError(card: EventCard): void {
    card.visual = card.visual === card.style.illustration ? null : card.style.illustration;
  }

  trackByCard(_index: number, card: EventCard): string {
    return card.id;
  }
}
