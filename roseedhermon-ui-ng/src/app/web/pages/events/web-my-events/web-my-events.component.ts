import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventStats } from '../../../../shared/services/api/model/eventStats';
import { EventService } from '../../../../shared/services/events/events.service';
import { EventImageService } from '../../../../shared/services/events/event-image.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { byDate, EventCard, toEventCard } from '../../../../shared/utils/event-presentation';
import { InterestButtonComponent } from '../../../components/interest-button.component';
import { PublicHeaderComponent } from '../../../components/public-header.component';
import { PublicFooterComponent } from '../../../components/public-footer.component';

/** Onglets de la page : ce que le membre choisit de voir. */
type Scope = 'group' | 'public' | 'past' | 'mine';

const PAGE_SIZE = 9;

/** Une carte organisée par la personne connectée, augmentée de ses chiffres. */
interface OrganisedCard {
  card: EventCard;
  stats: EventStats | null;
}

/**
 * Agenda d'un membre connecté, côté web.
 *
 * Le serveur filtre déjà la liste selon la session : elle contient les événements
 * publics **et** ceux réservés au groupe du membre, ces derniers seulement si le
 * module « Événements » est attribué à ce groupe. Cette page ne fait donc que
 * répartir ce qu'elle reçoit — elle ne demande rien de plus et n'invente rien.
 */
@Component({
  selector: 'app-web-my-events',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InterestButtonComponent,
    PublicHeaderComponent,
    PublicFooterComponent
  ],
  templateUrl: './web-my-events.component.html',
  styleUrls: ['./web-my-events.component.scss']
})
export class WebMyEventsComponent implements OnInit {
  cards: EventCard[] = [];
  loading = true;
  failed = false;

  /** Ce que la personne connectée a elle-même créé, avec ses statistiques. */
  organised: OrganisedCard[] = [];
  organisedLoading = true;

  scope: Scope = 'group';
  query = '';
  visible = PAGE_SIZE;

  constructor(
    private events: EventService,
    private images: EventImageService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
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

  private ingest(list: EventDTO[]): void {
    this.cards = (list ?? [])
      .map((event) => toEventCard(event, event.files?.length ? this.images.getEventImageUrl(event) : null))
      .sort(byDate);

    // Un membre sans agenda de groupe arrive directement sur le catalogue plutôt
    // que sur un onglet vide.
    if (!this.reserved.length) this.scope = 'public';
    this.loading = false;

    this.loadOrganised();
  }

  /**
   * Événements créés par cette session (`createdByEmail`), avec leurs chiffres.
   * Une carte s'affiche même si ses statistiques échouent à charger — un seul
   * appel en échec ne doit pas vider tout l'onglet.
   */
  private loadOrganised(): void {
    const email = (this.auth.user().email ?? '').trim().toLowerCase();

    const mine = email
      ? this.cards.filter((card) => (card.event.createdByEmail ?? '').trim().toLowerCase() === email)
      : [];

    if (!mine.length) {
      this.organisedLoading = false;
      return;
    }

    forkJoin(mine.map((card) => this.events.getEventStats(card.id).pipe(catchError(() => of(null))))).subscribe(
      (allStats) => {
        this.organised = mine.map((card, index) => ({ card, stats: allStats[index] }));
        this.organisedLoading = false;
      }
    );
  }

  get groupName(): string {
    return this.auth.user().group?.name || 'votre groupe';
  }

  // --- Répartition -------------------------------------------------------------------

  /** Réservés au groupe : ils ne figurent pas au catalogue public. */
  get reserved(): EventCard[] {
    return this.cards.filter((card) => isReserved(card) && card.upcoming);
  }

  get publicUpcoming(): EventCard[] {
    return this.cards.filter((card) => !isReserved(card) && card.upcoming);
  }

  get past(): EventCard[] {
    // Les plus récents d'abord : on remonte le temps.
    return this.cards.filter((card) => !card.upcoming).reverse();
  }

  private get current(): EventCard[] {
    if (this.scope === 'group') return this.reserved;
    if (this.scope === 'past') return this.past;
    return this.publicUpcoming;
  }

  get filtered(): EventCard[] {
    const needle = this.query.trim().toLowerCase();
    if (!needle) return this.current;

    return this.current.filter((card) =>
      [card.name, card.description, card.city, card.category]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(needle))
    );
  }

  get shown(): EventCard[] {
    return this.filtered.slice(0, this.visible);
  }

  get remaining(): number {
    return Math.max(0, this.filtered.length - this.visible);
  }

  /** Message d'absence, différent selon l'onglet : « vide » n'a pas le même sens. */
  get emptyMessage(): string {
    if (this.query.trim()) return 'Aucun événement ne correspond à votre recherche.';
    if (this.scope === 'group') {
      return this.auth.canSeeEvents()
        ? `Aucun événement réservé à ${this.groupName} n'est prévu pour le moment.`
        : `La gestion des événements n'est pas activée pour ${this.groupName}.`;
    }
    if (this.scope === 'past') return 'Aucun événement passé.';
    return 'Aucun événement public à venir.';
  }

  show(scope: Scope): void {
    this.scope = scope;
    this.visible = PAGE_SIZE;
  }

  loadMore(): void {
    this.visible += PAGE_SIZE;
  }

  isReserved(card: EventCard): boolean {
    return isReserved(card);
  }

  /**
   * Repli en cascade : la photo n'a pas pu être chargée, on essaie l'illustration
   * de la catégorie ; si elle échoue à son tour, le dégradé reste seul.
   */
  onVisualError(card: EventCard): void {
    card.visual = card.visual === card.style.illustration ? null : card.style.illustration;
  }

  trackByCard(_index: number, card: EventCard): string {
    return card.id;
  }

  trackByOrganised(_index: number, item: OrganisedCard): string {
    return item.card.id;
  }
}

/** « PRIVATE » comme « PRIVE » : les deux formes existent en base. */
function isReserved(card: EventCard): boolean {
  const value = String(card.event.visibility ?? '').toUpperCase();
  return value === 'PRIVATE' || value === 'PRIVE';
}
