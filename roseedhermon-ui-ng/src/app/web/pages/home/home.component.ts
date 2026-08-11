import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EventService } from '../../../shared/services/events/events.service';
import { EventImageService } from '../../../shared/services/events/event-image.service';
import { EVENT_CATEGORIES } from '../../../shared/models/model';
import {
  byDate,
  CategoryStyle,
  EventCard,
  styleOf,
  toEventCard
} from '../../../shared/utils/event-presentation';
import { InterestButtonComponent } from '../../components/interest-button.component';
import { PublicHeaderComponent, scrollToAnchor } from '../../components/public-header.component';
import { PublicFooterComponent } from '../../components/public-footer.component';
import { Showcase, SHOWCASES } from '../../components/showcases';

interface CategoryTile extends CategoryStyle {
  label: string;
  count: number;
}

/** Une vue du carrousel des prochains événements : la vidéo, ou un événement. */
export type FeaturedSlide = { kind: 'video' } | { kind: 'event'; card: EventCard };

const PAGE_SIZE = 6;

/** Carrousel des prochains événements : combien, et pendant combien de temps. */
const FEATURED_LIMIT = 6;
const FEATURED_DELAY = 6000;
const VIDEO_DELAY = 20000;

/** Durée d'affichage d'une photo de fond. */
const SHOWCASE_DELAY = 7000;

/**
 * Vidéo de présentation, servie depuis `public/media`. Le fichier n'est pas fourni
 * avec le dépôt : tant qu'il est absent, la balise émet une erreur et la vue est
 * retirée du carrousel — rien ne casse et aucune vidéo d'emprunt n'est affichée.
 */
const VIDEO_SOURCE = 'media/presentation.mp4';
const VIDEO_POSTER = 'media/presentation.jpg';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InterestButtonComponent,
    PublicHeaderComponent,
    PublicFooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  /** Toutes les cartes reçues du serveur, déjà filtrées côté API selon le rôle. */
  cards: EventCard[] = [];
  loading = true;
  failed = false;

  // Recherche
  query = '';
  selectedCity = '';
  selectedCategory = '';

  cities: string[] = [];
  categories: CategoryTile[] = [];

  visible = PAGE_SIZE;

  // --- Fond photographique de la bannière -------------------------------------------

  showcases: Showcase[] = [...SHOWCASES];
  showcaseIndex = 0;
  /** Change à chaque vue pour rejouer l'animation de la barre de progression. */
  showcaseKey = 0;

  private showcaseTimer?: ReturnType<typeof setTimeout>;
  private showcasePaused = false;

  // --- Carrousel des prochains événements -------------------------------------------

  featured: FeaturedSlide[] = [];
  featuredIndex = 0;
  /** Passe à faux si le fichier vidéo est absent : la vue est alors retirée. */
  videoAvailable = true;
  readonly videoSource = VIDEO_SOURCE;
  readonly videoPoster = VIDEO_POSTER;

  private featuredTimer?: ReturnType<typeof setTimeout>;
  private featuredPaused = false;

  constructor(
    private events: EventService,
    private images: EventImageService
  ) {}

  ngOnInit(): void {
    this.scheduleShowcase();

    // `with-files` porte les visuels ; on retombe sur la liste simple s'il manque.
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

  ngOnDestroy(): void {
    this.stopShowcase();
    this.stopFeatured();
  }

  // --- Données ----------------------------------------------------------------------

  private ingest(list: EventDTO[]): void {
    this.cards = (list ?? [])
      .map((event) => toEventCard(event, event.files?.length ? this.images.getEventImageUrl(event) : null))
      .sort(byDate);

    this.cities = unique(this.cards.map((card) => card.city));
    this.categories = EVENT_CATEGORIES.map((entry) => ({
      label: entry.label,
      count: this.cards.filter((card) => card.category === entry.label).length,
      ...styleOf(entry.label)
    }));
    this.buildFeatured();
    this.loading = false;
  }

  /**
   * Repli en cascade : la photo n'a pas pu être chargée, on essaie l'illustration
   * de la catégorie ; si elle échoue à son tour, le dégradé reste seul.
   */
  onVisualError(card: EventCard): void {
    card.visual = card.visual === card.style.illustration ? null : card.style.illustration;
  }

  // --- Filtres ----------------------------------------------------------------------

  get upcoming(): EventCard[] {
    return this.cards.filter((card) => card.upcoming);
  }

  get filtered(): EventCard[] {
    const needle = this.query.trim().toLowerCase();

    return this.cards.filter((card) => {
      if (this.selectedCategory && card.category !== this.selectedCategory) return false;
      if (this.selectedCity && card.city !== this.selectedCity) return false;
      if (!needle) return true;

      return [card.name, card.description, card.city, card.category]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(needle));
    });
  }

  get shown(): EventCard[] {
    return this.filtered.slice(0, this.visible);
  }

  get remaining(): number {
    return Math.max(0, this.filtered.length - this.visible);
  }

  get filtersActive(): boolean {
    return !!(this.query.trim() || this.selectedCity || this.selectedCategory);
  }

  get citiesCount(): number {
    return this.cities.length;
  }

  search(): void {
    this.visible = PAGE_SIZE;
    this.goTo('evenements');
  }

  pickCategory(label: string): void {
    this.selectedCategory = this.selectedCategory === label ? '' : label;
    this.visible = PAGE_SIZE;
    this.goTo('evenements');
  }

  clearFilters(): void {
    this.query = '';
    this.selectedCity = '';
    this.selectedCategory = '';
    this.visible = PAGE_SIZE;
  }

  loadMore(): void {
    this.visible += PAGE_SIZE;
  }

  goTo(anchor: string): void {
    scrollToAnchor(anchor);
  }

  // --- Fond photographique ----------------------------------------------------------

  get showcase(): Showcase | null {
    return this.showcases[this.showcaseIndex] ?? null;
  }

  /** « 03 » plutôt que « 3 » : le compteur ne change pas de largeur. */
  get showcaseCounter(): string {
    return String(this.showcaseIndex + 1).padStart(2, '0');
  }

  get showcaseTotal(): string {
    return String(this.showcases.length).padStart(2, '0');
  }

  goToShowcase(index: number): void {
    if (!this.showcases.length) return;
    this.showcaseIndex = (index + this.showcases.length) % this.showcases.length;
    this.showcaseKey++;
    this.scheduleShowcase();
  }

  nextShowcase(): void {
    this.goToShowcase(this.showcaseIndex + 1);
  }

  previousShowcase(): void {
    this.goToShowcase(this.showcaseIndex - 1);
  }

  pauseShowcase(): void {
    this.showcasePaused = true;
    this.stopShowcase();
  }

  resumeShowcase(): void {
    this.showcasePaused = false;
    this.scheduleShowcase();
  }

  /** Une photo manquante retire sa vue plutôt que de laisser un cadre vide. */
  onShowcaseMissing(showcase: Showcase): void {
    this.showcases = this.showcases.filter((entry) => entry !== showcase);
    if (this.showcaseIndex >= this.showcases.length) this.showcaseIndex = 0;
    this.scheduleShowcase();
  }

  /**
   * Identifie une valeur par elle-même : la barre de progression est donc
   * remplacée à chaque changement de vue, ce qui rejoue son animation.
   */
  trackByValue(_index: number, value: number): number {
    return value;
  }

  private scheduleShowcase(): void {
    this.stopShowcase();
    if (this.showcasePaused || this.showcases.length < 2) return;
    this.showcaseTimer = setTimeout(() => this.nextShowcase(), SHOWCASE_DELAY);
  }

  private stopShowcase(): void {
    if (this.showcaseTimer) clearTimeout(this.showcaseTimer);
    this.showcaseTimer = undefined;
  }

  // --- Carrousel des prochains événements --------------------------------------------

  private buildFeatured(): void {
    const upcoming: FeaturedSlide[] = this.cards
      .filter((card) => card.upcoming)
      .slice(0, FEATURED_LIMIT)
      .map((card) => ({ kind: 'event', card }));

    this.featured = this.videoAvailable ? [{ kind: 'video' }, ...upcoming] : upcoming;
    this.featuredIndex = Math.min(this.featuredIndex, Math.max(0, this.featured.length - 1));
    this.scheduleFeatured();
  }

  /** Appelé quand la balise vidéo ne trouve pas son fichier : la vue disparaît. */
  onVideoMissing(): void {
    this.videoAvailable = false;
    this.buildFeatured();
  }

  featuredLabel(slide: FeaturedSlide): string {
    return slide.kind === 'video' ? 'Voir la vidéo de présentation' : `Voir ${slide.card.name}`;
  }

  goToFeatured(index: number): void {
    if (!this.featured.length) return;
    this.featuredIndex = (index + this.featured.length) % this.featured.length;
    this.scheduleFeatured();
  }

  nextFeatured(): void {
    this.goToFeatured(this.featuredIndex + 1);
  }

  pauseFeatured(): void {
    this.featuredPaused = true;
    this.stopFeatured();
  }

  resumeFeatured(): void {
    this.featuredPaused = false;
    this.scheduleFeatured();
  }

  /**
   * Programme la vue suivante. La vidéo reste affichée plus longtemps que les
   * cartes : six secondes ne suffiraient pas à la regarder.
   */
  private scheduleFeatured(): void {
    this.stopFeatured();
    if (this.featuredPaused || this.featured.length < 2) return;

    const delay = this.featured[this.featuredIndex]?.kind === 'video' ? VIDEO_DELAY : FEATURED_DELAY;
    this.featuredTimer = setTimeout(() => this.nextFeatured(), delay);
  }

  private stopFeatured(): void {
    if (this.featuredTimer) clearTimeout(this.featuredTimer);
    this.featuredTimer = undefined;
  }
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b, 'fr'));
}
