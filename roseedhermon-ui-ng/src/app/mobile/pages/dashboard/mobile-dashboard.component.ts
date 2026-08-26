import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EventService } from '../../../shared/services/events/events.service';
import { EventImageService } from '../../../shared/services/events/event-image.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import {
  CategoryStyle,
  EventCard,
  byDate,
  startOfToday,
  styleOf,
  toEventCard
} from '../../../shared/utils/event-presentation';
import { AuthService } from '../../../core/auth/auth.service';
import { MemberService } from '../../../shared/services/members/members.service';
import { Member } from '../../../shared/services/api/model/member';
import { TicketStoreService } from '../../services/ticket-store.service';
import { RegistrationService } from '../../../shared/services/events/registrations.service';
import { EventInterestService } from '../../../shared/services/events/event-interest.service';
import { InterestButtonComponent } from '../../../web/components/interest-button.component';

/** Une case de la bande d'agenda : un jour, et ce qui s'y passe. */
interface DayCell {
  key: string;
  date: Date;
  weekday: string;
  day: string;
  count: number;
  /** Points d'occupation, au plus trois. Précalculés : un tableau construit dans
      le gabarit serait neuf à chaque cycle, et `*ngFor` recréerait les points. */
  dots: number[];
  isToday: boolean;
}

/** Une catégorie réellement présente, avec son compte et sa couleur. */
interface CategoryChip {
  name: string;
  count: number;
  style: CategoryStyle;
}

/** Les événements d'un même mois, regroupés sous son nom. */
interface MonthGroup {
  key: string;
  label: string;
  cards: EventCard[];
}

/** Une pastille de la pile d'avatars : une photo réelle, ou des initiales. */
interface Face {
  id: string;
  initials: string;
  color: string;
}

/** Un événement du classement, avec son engouement. */
interface Wanted {
  card: EventCard;
  rank: number;
  interested: number;
  /** Part du plus demandé, pour la largeur de la barre. */
  share: number;
}

/** Une place réservée depuis cet appareil, rapprochée de son événement. */
interface MyTicket {
  registrationId: string;
  card: EventCard;
  /** Six derniers caractères de l'identifiant : le numéro imprimé sur le billet. */
  code: string;
  /** Places retenues, connues seulement une fois l'inscription relue. */
  seats: number | null;
  /** Largeurs des barres du motif, tirées de l'identifiant réel. */
  bars: number[];
}

/** Nombre d'événements mis en avant dans le carrousel. */
const FEATURED = 5;
/** Longueur de la bande d'agenda, en jours. */
const STRIP_DAYS = 14;
/** Événements retenus dans le classement des plus demandés. */
const WANTED_SHOWN = 5;

const WEEKDAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Visages montrés dans la pile ; au-delà, c'est le compte qui parle. */
const FACES = 4;

/** Teintes des initiales, reprises du référentiel des catégories. */
const FACE_COLORS = ['#dc4a22', '#6d3be4', '#0e8f72', '#2360d4', '#c07a06', '#c42e6b'];

@Component({
  selector: 'app-mobile-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, InterestButtonComponent],
  templateUrl: './mobile-dashboard.component.html',
  styleUrls: ['./mobile-dashboard.component.scss']
})
export class MobileDashboardComponent implements OnInit {
  cards: EventCard[] = [];
  loading = true;
  loadError = '';

  // --- Filtres ---
  query = '';
  category = '';
  /** Jour retenu dans la bande d'agenda, au format `AAAA-M-J`. */
  day = '';

  /**
   * Listes dérivées, recalculées à la demande et non à chaque cycle de détection.
   *
   * Un accesseur qui reconstruirait ces objets à chaque lecture ferait recréer
   * toutes les vues de `*ngFor`, qui suivent l'identité des objets : la page se
   * détruirait et se reconstruirait en boucle.
   */
  featured: EventCard[] = [];
  /** Le premier de « à l'affiche », mis en avant dans une grande carte. */
  featuredHero: EventCard | null = null;
  /** Le reste de « à l'affiche », en petite grille sous la grande carte. */
  featuredRest: EventCard[] = [];
  /** Ceux qu'organise la communauté de la personne connectée. */
  forYou: EventCard[] = [];
  monthGroups: MonthGroup[] = [];
  categories: CategoryChip[] = [];
  dayStrip: DayCell[] = [];
  /**
   * Vrai si au moins un jour de la bande porte un événement.
   *
   * Quand tout se joue dans plusieurs mois, une quinzaine entièrement vide
   * n'apprend rien et ressemble à une panne : la bande disparaît alors.
   */
  stripHasEvents = false;
  myTickets: MyTicket[] = [];
  /** Classement par nombre de personnes intéressées. */
  wanted: Wanted[] = [];
  /** Tout événement ayant au moins une personne intéressée — pour le repère « Populaire ». */
  popularEventIds = new Set<string>();

  // --- Communauté ---
  faces: Face[] = [];
  memberCount = 0;
  memberCityCount = 0;

  /** Le tout prochain événement, celui du compte à rebours. */
  next: EventCard | null = null;
  countdownLabel = '';
  countdownDays = 0;

  constructor(
    private eventService: EventService,
    private images: EventImageService,
    private auth: AuthService,
    private memberService: MemberService,
    private tickets: TicketStoreService,
    private registrations: RegistrationService,
    private interest: EventInterestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // `getEventsWithFiles` fournit les visuels ; on retombe sur la liste simple si elle échoue.
    this.eventService.getEventsWithFiles().subscribe({
      next: (events) => this.receive(events),
      error: () => {
        this.eventService.getEvents().subscribe({
          next: (events) => this.receive(events),
          error: (error) => {
            console.error('Erreur lors du chargement des événements', error);
            this.loadError = `Impossible de charger les événements (${error?.status || 'réseau'}).`;
            this.loading = false;
          }
        });
      }
    });
  }

  /**
   * Effectif de la communauté, pour la bande de présentation.
   *
   * Demandé seulement si le module Membres est ouvert au groupe : sans lui, le
   * serveur refuserait, et il n'y a de toute façon pas d'annuaire à résumer. Un
   * échec reste sans conséquence — la bande ne s'affiche simplement pas.
   */
  private loadCommunity(): void {
    if (!this.auth.canSeeMembers()) return;

    this.memberService.getMembers().subscribe({
      next: (members: Member[]) => this.buildCommunity(members || []),
      error: () => undefined
    });
  }

  private buildCommunity(members: Member[]): void {
    this.memberCount = members.length;
    this.memberCityCount = new Set(
      members.map((member) => (member.city || '').trim()).filter(Boolean)
    ).size;

    // Initiales seulement : les photos des fiches ne sont pas affichées ici.
    this.faces = members
      .slice(0, FACES)
      .map((member, index) => ({
        id: member.id ?? `face-${index}`,
        initials:
          `${member.firstName?.charAt(0) ?? ''}${member.lastName?.charAt(0) ?? ''}`.toUpperCase() || '?',
        color: FACE_COLORS[index % FACE_COLORS.length]
      }));
  }

  /** Nombre restant après les visages montrés, ou zéro. */
  get facesOverflow(): number {
    return Math.max(0, this.memberCount - this.faces.length);
  }

  get communityLabel(): string {
    const group = this.auth.user().group?.name?.trim();
    return group ? `${this.memberCount} membres · ${group}` : `${this.memberCount} membres`;
  }

  private receive(events: EventDTO[]): void {
    this.cards = (events || [])
      .map((event) => toEventCard(event, event.files?.length ? this.images.getEventImageUrl(event) : null))
      .sort(byDate);

    this.buildFigures();
    this.buildCategories();
    this.buildDayStrip();
    this.buildMyTickets();
    this.rebuild();
    this.loadCommunity();
    this.loadWanted();
    this.loading = false;
  }

  // --- Identité ---------------------------------------------------------------------

  /**
   * Prénom de la personne connectée, s'il est connu.
   *
   * Rien n'est inventé : sans session, l'accueil salue sans nommer plutôt que
   * d'afficher un prénom d'emprunt.
   */
  get greeting(): string {
    const firstName = this.auth.user().member?.firstName?.trim();
    return firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  }

  /**
   * Nom affiché en gros sous le salut.
   *
   * La fiche membre d'abord, le courriel ensuite, et à défaut le nom de la
   * plateforme — jamais un nom inventé.
   */
  get displayName(): string {
    const member = this.auth.user().member;
    const full = `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim();
    if (full) return full;
    return this.auth.user().email?.split('@')[0] || 'Bienvenue';
  }

  /** Initiales réelles ; vide quand on ne sait pas qui utilise l'appareil. */
  get initials(): string {
    const member = this.auth.user().member;
    const letters = `${member?.firstName?.charAt(0) ?? ''}${member?.lastName?.charAt(0) ?? ''}`.trim();
    if (letters) return letters.toUpperCase();
    return (this.auth.user().email?.charAt(0) ?? '').toUpperCase();
  }

  // --- Construction -----------------------------------------------------------------

  private get upcoming(): EventCard[] {
    return this.cards.filter((card) => card.upcoming);
  }

  /** Le tout prochain événement daté : c'est lui que porte le compte à rebours. */
  private buildFigures(): void {
    this.next = this.upcoming.find((card) => !!card.date) ?? null;
    this.buildCountdown();
  }

  private buildCountdown(): void {
    if (!this.next?.date) {
      this.countdownLabel = '';
      this.countdownDays = 0;
      return;
    }

    const days = Math.round((this.next.date.getTime() - startOfToday()) / DAY_MS);
    this.countdownDays = Math.max(0, days);

    if (days <= 0) this.countdownLabel = "C'est aujourd'hui";
    else if (days === 1) this.countdownLabel = "C'est demain";
    else if (days < 7) this.countdownLabel = `Dans ${days} jours`;
    else if (days < 31) {
      const weeks = Math.round(days / 7);
      this.countdownLabel = `Dans ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else {
      const months = Math.round(days / 30);
      this.countdownLabel = `Dans ${months} mois`;
    }
  }

  private buildCategories(): void {
    const counts = new Map<string, number>();
    this.upcoming.forEach((card) => {
      if (card.category) counts.set(card.category, (counts.get(card.category) ?? 0) + 1);
    });

    this.categories = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
      .map(([name, count]) => ({ name, count, style: styleOf(name) }));
  }

  /** Quinze jours à partir d'aujourd'hui, avec ce qui s'y passe. */
  private buildDayStrip(): void {
    const counts = new Map<string, number>();
    this.upcoming.forEach((card) => {
      if (card.date) {
        const key = dayKey(card.date);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    });

    const today = new Date(startOfToday());
    this.dayStrip = Array.from({ length: STRIP_DAYS }, (_, offset) => {
      const date = new Date(today.getTime() + offset * DAY_MS);
      const key = dayKey(date);
      const count = counts.get(key) ?? 0;
      return {
        key,
        date,
        weekday: WEEKDAY_LETTERS[date.getDay()],
        day: String(date.getDate()),
        count,
        dots: Array.from({ length: Math.min(count, 3) }, (_, index) => index),
        isToday: offset === 0
      };
    });

    this.stripHasEvents = this.dayStrip.some((cell) => cell.count > 0);
  }

  /**
   * Places réservées depuis cet appareil, limitées à ce qui reste à venir.
   *
   * L'API n'expose pas de liste par personne : c'est l'appareil qui garde la
   * trace de ses billets.
   */
  private buildMyTickets(): void {
    const byId = new Map(this.cards.map((card) => [card.id, card]));

    this.myTickets = this.tickets
      .all()
      .map((ticket) => {
        const card = byId.get(ticket.eventId);
        if (!card) return null;
        return {
          registrationId: ticket.registrationId,
          card,
          code: ticket.registrationId.slice(-6).toUpperCase(),
          seats: null,
          bars: barsOf(ticket.registrationId)
        } as MyTicket;
      })
      .filter((entry): entry is MyTicket => entry !== null && entry.card.upcoming)
      .slice(0, 1);

    // Le nombre de places n'est pas gardé sur l'appareil : on relit l'inscription.
    // Bornée à quelques billets, cette série d'appels reste modeste.
    this.myTickets.forEach((ticket) => {
      this.registrations.get(ticket.registrationId).subscribe({
        next: (registration) => {
          ticket.seats = typeof registration?.seats === 'number' ? registration.seats : 1;
        },
        // Billet illisible : la carte s'affiche sans le nombre de places.
        error: () => undefined
      });
    });
  }

  /**
   * Classement des événements par engouement.
   *
   * Un seul appel rapporte tous les compteurs : demander l'intérêt événement par
   * événement serait tenable à quatre, pas à deux cents. Un échec laisse
   * simplement la section absente.
   */
  private loadWanted(): void {
    this.interest.counts().subscribe({
      next: (counts) => this.buildWanted(counts),
      error: () => undefined
    });
  }

  private buildWanted(counts: Record<string, number>): void {
    this.popularEventIds = new Set(Object.keys(counts).filter((id) => counts[id] > 0));

    const ranked = this.upcoming
      .map((card) => ({ card, interested: counts[card.id] ?? 0 }))
      .filter((entry) => entry.interested > 0)
      .sort((a, b) => b.interested - a.interested)
      .slice(0, WANTED_SHOWN);

    const top = ranked.length ? ranked[0].interested : 0;

    this.wanted = ranked.map((entry, index) => ({
      card: entry.card,
      rank: index + 1,
      interested: entry.interested,
      share: top ? Math.round((entry.interested / top) * 100) : 0
    }));
  }

  /** Prochaine place réservée depuis cet appareil, s'il y en a une. */
  get nextTicket(): MyTicket | null {
    return this.myTickets[0] ?? null;
  }

  goToTickets(): void {
    this.router.navigate(['/mobile/tickets']);
  }

  trackByWanted(_index: number, item: Wanted): string {
    return item.card.id;
  }

  /** Recalcule ce qui dépend des filtres. Appelé à chaque changement, pas plus. */
  rebuild(): void {
    const needle = this.query.trim().toLowerCase();

    const matching = this.upcoming.filter((card) => {
      if (this.category && card.category !== this.category) return false;
      if (this.day && (!card.date || dayKey(card.date) !== this.day)) return false;
      if (!needle) return true;
      return [card.name, card.description, card.category, card.place, card.city]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(needle));
    });

    this.featured = matching.slice(0, FEATURED);
    this.featuredHero = this.featured[0] ?? null;
    this.featuredRest = this.featured.slice(1);

    /**
     * « Pour vous » n'est pas une recommandation devinée : ce sont les
     * événements organisés par le groupe de la personne connectée. Sans groupe,
     * la section n'a rien à montrer et disparaît.
     */
    const groupId = this.auth.user().groupId;
    this.forYou = groupId
      ? matching.filter((card) => card.event.groupId === groupId).slice(0, FEATURED)
      : [];

    this.monthGroups = groupByMonth(matching);
  }

  // --- État -------------------------------------------------------------------------

  get filtering(): boolean {
    return !!this.query.trim() || !!this.category || !!this.day;
  }

  get matchCount(): number {
    return this.monthGroups.reduce((total, group) => total + group.cards.length, 0);
  }

  get selectedDayLabel(): string {
    const cell = this.dayStrip.find((item) => item.key === this.day);
    if (!cell) return '';
    return cell.date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  get emptyMessage(): string {
    if (this.filtering) return 'Aucun événement ne correspond à cette recherche.';
    if (!this.cards.length) return 'Aucun événement enregistré pour le moment.';
    return "Aucun événement à venir. Les éditions passées restent consultables dans l'onglet Événements.";
  }

  // --- Actions ----------------------------------------------------------------------

  pickCategory(name: string): void {
    // Un second appui retire le filtre : pas de bouton « tout » à aller chercher.
    this.category = this.category === name ? '' : name;
    this.rebuild();
  }

  pickDay(cell: DayCell): void {
    if (!cell.count) return;
    this.day = this.day === cell.key ? '' : cell.key;
    this.rebuild();
  }

  reset(): void {
    this.query = '';
    this.category = '';
    this.day = '';
    this.rebuild();
  }

  open(card: EventCard): void {
    if (card.id) this.router.navigate(['/mobile/events', card.id]);
  }

  openTicket(ticket: MyTicket): void {
    this.router.navigate(['/mobile/ticket', ticket.card.id]);
  }

  reserve(card: EventCard): void {
    if (card.id) this.router.navigate(['/mobile/reservation', card.id]);
  }

  goToEvents(): void {
    this.router.navigate(['/mobile/events']);
  }

  goToProfile(): void {
    this.router.navigate(['/mobile/profile']);
  }

  /** Une illustration manquante ne doit pas laisser une case vide : on retombe sur le dégradé. */
  onVisualError(card: EventCard): void {
    card.visual = card.visual === card.style.illustration ? null : card.style.illustration;
  }

  trackByCard(_index: number, card: EventCard): string {
    return card.id;
  }

  trackByGroup(_index: number, group: MonthGroup): string {
    return group.key;
  }

  trackByDay(_index: number, cell: DayCell): string {
    return cell.key;
  }

  trackByCategory(_index: number, chip: CategoryChip): string {
    return chip.name;
  }

  trackByTicket(_index: number, ticket: MyTicket): string {
    return ticket.registrationId;
  }

  trackByFace(_index: number, face: Face): string {
    return face.id;
  }
}

/* ---------- Utilitaires ---------- */

/**
 * Motif de barres d'un billet, tiré de son identifiant réel.
 *
 * Purement décoratif : c'est le code à scanner de l'écran du billet qui fait
 * foi. Le motif est stable pour un même billet, ce qui évite qu'il change à
 * chaque affichage.
 */
function barsOf(id: string): number[] {
  return Array.from({ length: 26 }, (_, index) => {
    const code = id.charCodeAt(index % id.length) + index;
    return 1 + (code % 3);
  });
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Regroupe par mois, en conservant l'ordre chronologique déjà établi. */
function groupByMonth(cards: EventCard[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  const index = new Map<string, MonthGroup>();

  cards.forEach((card) => {
    const key = card.date ? `${card.date.getFullYear()}-${card.date.getMonth()}` : 'sans-date';
    let group = index.get(key);

    if (!group) {
      group = {
        key,
        label: card.date
          ? `${MONTH_NAMES[card.date.getMonth()]} ${card.date.getFullYear()}`
          : 'Date à préciser',
        cards: []
      };
      index.set(key, group);
      groups.push(group);
    }

    group.cards.push(card);
  });

  return groups;
}
