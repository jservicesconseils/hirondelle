import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Member } from '../../../shared/services/api/model/member';
import { MemberService } from '../../../shared/services/members/members.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EventService } from '../../../shared/services/events/events.service';
import { EventRegistrationDTO } from '../../../shared/services/api/model/eventRegistrationDTO';
import { RegistrationService } from '../../../shared/services/events/registrations.service';
import { AuthService } from '../../../core/auth/auth.service';

/* ---------- Formes affichées ---------- */

interface RecentMember {
  member: Member;
  initials: string;
  fullName: string;
  subtitle: string;
  addedAt: Date | null;
  sinceLabel: string;
  isNew: boolean;
}

interface UpcomingEvent {
  event: EventDTO;
  day: string;
  month: string;
  name: string;
  meta: string;
  category: string;
  upcoming: boolean;
}

interface CityShare {
  city: string;
  count: number;
  percentage: number;
}

/** Un point de la courbe de croissance : fin de mois et effectif cumulé. */
interface GrowthPoint {
  label: string;
  total: number;
  x: number;
  y: number;
}

/** Une barre d'un histogramme, déjà positionnée dans le repère du SVG. */
interface Bar {
  label: string;
  value: number;
  display: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Abscisse du centre : sert au libellé du mois et à la valeur. */
  center: number;
}

interface Tick {
  value: number;
  label: string;
  y: number;
}

interface BarChart {
  bars: Bar[];
  ticks: Tick[];
  baseline: number;
  max: number;
  /** Vrai quand toutes les barres valent zéro : on affiche alors un état vide. */
  empty: boolean;
}

/** Une part d'un graphe en disque, prête pour `stroke-dasharray`. */
interface DonutSlice {
  label: string;
  value: number;
  percent: number;
  color: string;
  dash: string;
  offset: number;
}

interface Donut {
  total: number;
  slices: DonutSlice[];
}

/** Un événement classé par affluence. */
interface EventLoad {
  id: string;
  name: string;
  seats: number;
  registrations: number;
  revenue: number;
  capacity: number;
  /** Taux de remplissage réel, qui peut dépasser 100 % si la jauge a été forcée. */
  fillRate: number | null;
  /** Largeur de la barre, relative au plus fréquenté. */
  percentage: number;
}

/* ---------- Géométrie des graphiques ---------- */

const CHART_WIDTH = 640;
const CHART_HEIGHT = 240;
const CHART_PADDING = { top: 16, right: 14, bottom: 30, left: 46 };

const BAR_WIDTH = 640;
const BAR_HEIGHT = 230;
const BAR_PADDING = { top: 24, right: 14, bottom: 32, left: 52 };

const DONUT_SIZE = 180;
const DONUT_RADIUS = 66;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/** Teintes des parts : bleu de la marque en tête, orange d'accent ensuite. */
const PALETTE = ['#2b5fb8', '#f4551d', '#1f9d76', '#f5a623', '#6b4fd6', '#0ea5b7', '#3d78d6', '#94a3b8'];

const MONTHS_SHOWN = 6;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  loading = true;
  loadError = '';

  members: Member[] = [];
  events: EventDTO[] = [];
  registrations: EventRegistrationDTO[] = [];

  recentMembers: RecentMember[] = [];
  upcomingEvents: UpcomingEvent[] = [];
  topCities: CityShare[] = [];
  topEvents: EventLoad[] = [];

  // Courbe de croissance des effectifs
  growthPoints: GrowthPoint[] = [];
  linePath = '';
  areaPath = '';
  yTicks: Tick[] = [];
  readonly chartWidth = CHART_WIDTH;
  readonly chartHeight = CHART_HEIGHT;

  // Histogrammes
  registrationChart: BarChart = emptyChart();
  revenueChart: BarChart = emptyChart();
  readonly barWidth = BAR_WIDTH;
  readonly barHeight = BAR_HEIGHT;

  // Graphes en disque
  categoryDonut: Donut = { total: 0, slices: [] };
  accessDonut: Donut = { total: 0, slices: [] };
  genderDonut: Donut = { total: 0, slices: [] };
  readonly donutSize = DONUT_SIZE;
  readonly donutRadius = DONUT_RADIUS;
  readonly donutCircumference = DONUT_CIRCUMFERENCE;

  // Montants
  totalRevenue = 0;
  potentialRevenue = 0;
  averageBasket = 0;
  paidEventsCount = 0;
  paidRegistrations = 0;

  // Inscriptions
  reservedSeats = 0;
  activeRegistrations = 0;
  registrationsThisMonth = 0;
  totalCapacity = 0;

  constructor(
    private memberService: MemberService,
    private eventService: EventService,
    private registrationService: RegistrationService,
    public auth: AuthService
  ) {}

  /**
   * On ne demande que ce que le groupe possède, et l'échec de l'un ne doit pas
   * emporter les autres : chaque flux retombe sur une liste vide. Un tableau de
   * bord amputé d'un module vaut mieux qu'un tableau de bord blanc.
   */
  ngOnInit(): void {
    const members$ = this.auth.canSeeMembers()
      ? this.memberService.getMembers().pipe(catchError(() => of([] as Member[])))
      : of([] as Member[]);

    const events$ = this.auth.canSeeEvents()
      ? this.eventService.getEvents().pipe(catchError(() => of([] as EventDTO[])))
      : of([] as EventDTO[]);

    const registrations$ = this.auth.canSeeEvents()
      ? this.registrationService.list().pipe(catchError(() => of([] as EventRegistrationDTO[])))
      : of([] as EventRegistrationDTO[]);

    forkJoin({ members: members$, events: events$, registrations: registrations$ }).subscribe({
      next: ({ members, events, registrations }) => {
        this.members = members || [];
        this.events = events || [];
        this.registrations = (registrations || []).filter(
          (registration) => (registration.status || '').toUpperCase() !== 'CANCELLED'
        );
        this.buildDashboard();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du tableau de bord', err);
        this.loadError = `Impossible de charger les données (${err.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  // --- Indicateurs ---------------------------------------------------------------

  get totalMembers(): number {
    return this.members.length;
  }

  get newMembersThisMonth(): number {
    const now = new Date();
    return this.members.filter((member) => {
      const date = creationDate(member.id);
      return !!date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;
  }

  get citiesCount(): number {
    return new Set(this.members.map((member) => (member.city || '').trim()).filter(Boolean)).size;
  }

  get totalEvents(): number {
    return this.events.length;
  }

  get upcomingEventsCount(): number {
    return this.upcomingEvents.filter((item) => item.upcoming).length;
  }

  get currentMonthLabel(): string {
    return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  /** Progression du mois en cours par rapport au mois précédent, en pourcentage. */
  get monthlyGrowth(): number {
    if (this.growthPoints.length < 2) return 0;
    const previous = this.growthPoints[this.growthPoints.length - 2].total;
    const current = this.growthPoints[this.growthPoints.length - 1].total;
    if (!previous) return current ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /** Places réservées rapportées aux jauges déclarées ; nul si aucune jauge. */
  get occupancyRate(): number | null {
    if (!this.totalCapacity) return null;
    return Math.round((this.reservedSeats / this.totalCapacity) * 100);
  }

  /**
   * Plus de places réservées que de places déclarées. Le chiffre reste affiché
   * tel quel — c'est un fait, pas une anomalie de calcul — mais signalé, sans
   * quoi un taux au-delà de cent se lit comme une panne.
   */
  get occupancyExceeded(): boolean {
    return this.occupancyRate !== null && this.occupancyRate > 100;
  }

  /** Places par inscription, la taille moyenne d'un groupe qui réserve. */
  get seatsPerRegistration(): number {
    if (!this.activeRegistrations) return 0;
    return Math.round((this.reservedSeats / this.activeRegistrations) * 10) / 10;
  }

  /** Aucun événement n'a de prix : les panneaux de montants le disent au lieu d'afficher zéro. */
  get hasPricing(): boolean {
    return this.paidEventsCount > 0;
  }

  // --- Mise en forme -------------------------------------------------------------

  /** Montant en dollars, comme sur la page de réservation. */
  money(value: number): string {
    return `${value.toLocaleString('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} $`;
  }

  trackBySlice(_index: number, slice: DonutSlice): string {
    return slice.label;
  }

  trackByBar(_index: number, bar: Bar): string {
    return bar.label;
  }

  trackByEventLoad(_index: number, item: EventLoad): string {
    return item.id;
  }

  // --- Construction ---------------------------------------------------------------

  private buildDashboard() {
    this.buildRecentMembers();
    this.buildUpcomingEvents();
    this.buildTopCities();
    this.buildGrowthChart();
    this.buildRegistrationFigures();
    this.buildRevenue();
    this.buildTopEvents();
    this.buildDonuts();
  }

  private buildRecentMembers() {
    this.recentMembers = this.members
      .map((member) => {
        const addedAt = creationDate(member.id);
        const days = addedAt ? daysSince(addedAt) : null;
        return {
          member,
          initials: initialsOf(member.firstName, member.lastName),
          fullName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Sans nom',
          subtitle: member.city || member.email || '—',
          addedAt,
          sinceLabel: days === null ? 'Date inconnue' : relativeLabel(days),
          // « Nouveau » = ajouté dans les 7 derniers jours.
          isNew: days !== null && days <= 7
        };
      })
      .sort((a, b) => (b.addedAt?.getTime() ?? 0) - (a.addedAt?.getTime() ?? 0))
      .slice(0, 5);
  }

  private buildUpcomingEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = this.events
      .map((event) => {
        const date = parseFrDate(event.date);
        const place = [event.location?.placeName, event.location?.city].filter(Boolean).join(' • ');
        return {
          event,
          date,
          day: date ? `${date.getDate()}`.padStart(2, '0') : '--',
          month: date ? date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase() : '',
          name: event.name || 'Sans titre',
          meta: [date ? capitalize(date.toLocaleDateString('fr-FR', { weekday: 'short' })) : null, event.time, place]
            .filter(Boolean)
            .join(' • '),
          category: event.category || event.eventType || 'Événement',
          upcoming: !!date && date.getTime() >= today.getTime()
        };
      })
      .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));

    const next = rows.filter((row) => row.upcoming);
    // Aucun événement à venir : on montre les plus récents plutôt qu'une liste vide.
    this.upcomingEvents = (next.length ? next : rows.reverse()).slice(0, 5);
  }

  private buildTopCities() {
    const counts = countBy(this.members, (member) => (member.city || '').trim());
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = sorted.length ? sorted[0][1] : 0;

    this.topCities = sorted.map(([city, count]) => ({
      city,
      count,
      percentage: max ? Math.round((count / max) * 100) : 0
    }));
  }

  /**
   * Effectif cumulé à la fin de chacun des 6 derniers mois, reconstruit depuis
   * l'horodatage de création porté par l'`ObjectId` de chaque membre.
   */
  private buildGrowthChart() {
    const dates = this.members
      .map((member) => creationDate(member.id))
      .filter((date): date is Date => !!date)
      .sort((a, b) => a.getTime() - b.getTime());

    const months = lastMonths(MONTHS_SHOWN);
    const totals = months.map((month) => dates.filter((date) => date.getTime() <= month.end.getTime()).length);

    const max = Math.max(...totals, 1);
    const min = Math.min(...totals, 0);
    const span = Math.max(max - min, 1);

    const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

    this.growthPoints = months.map((month, index) => {
      const total = totals[index];
      return {
        label: month.label,
        total,
        x: CHART_PADDING.left + (innerWidth * index) / Math.max(months.length - 1, 1),
        y: CHART_PADDING.top + innerHeight - ((total - min) / span) * innerHeight
      };
    });

    this.linePath = smoothPath(this.growthPoints);
    const first = this.growthPoints[0];
    const last = this.growthPoints[this.growthPoints.length - 1];
    const baseline = CHART_PADDING.top + innerHeight;
    this.areaPath = `${this.linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;

    // Trois repères horizontaux : minimum, milieu, maximum.
    this.yTicks = uniqueTicks([min, Math.round(min + span / 2), max]).map((value) => ({
      value,
      label: `${value}`,
      y: CHART_PADDING.top + innerHeight - ((value - min) / span) * innerHeight
    }));
  }

  /** Volumes d'inscription : total, places, mois courant, et jauge cumulée. */
  private buildRegistrationFigures() {
    this.activeRegistrations = this.registrations.length;
    this.reservedSeats = this.registrations.reduce((sum, item) => sum + seatsOf(item), 0);

    const now = new Date();
    this.registrationsThisMonth = this.registrations.filter((item) => {
      const date = registrationDate(item);
      return !!date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;

    // Seules les jauges renseignées comptent : un `availableSeats` à zéro veut
    // dire « non plafonné », pas « complet ».
    this.totalCapacity = this.events.reduce((sum, event) => sum + Math.max(0, event.availableSeats || 0), 0);

    const months = lastMonths(MONTHS_SHOWN);
    const perMonth = new Map<string, number>();
    this.registrations.forEach((item) => {
      const date = registrationDate(item);
      if (!date) return;
      const key = monthKey(date);
      perMonth.set(key, (perMonth.get(key) || 0) + seatsOf(item));
    });

    this.registrationChart = buildBarChart(
      months.map((month) => ({
        label: month.label,
        value: perMonth.get(month.key) || 0,
        display: `${perMonth.get(month.key) || 0}`
      }))
    );
  }

  /**
   * Recettes de billetterie : places réservées × prix de l'événement.
   *
   * Un événement gratuit ou sans prix saisi ne rapporte rien — il n'entre ni au
   * numérateur ni au dénominateur du panier moyen.
   */
  private buildRevenue() {
    const byId = new Map(this.events.filter((event) => event.id).map((event) => [event.id as string, event]));

    const months = lastMonths(MONTHS_SHOWN);
    const perMonth = new Map<string, number>();

    let revenue = 0;
    let payingRegistrations = 0;

    this.registrations.forEach((item) => {
      const event = item.eventId ? byId.get(item.eventId) : undefined;
      const price = priceOf(event);
      if (!price) return;

      const line = seatsOf(item) * price;
      revenue += line;
      payingRegistrations += 1;

      const date = registrationDate(item);
      if (date) {
        const key = monthKey(date);
        perMonth.set(key, (perMonth.get(key) || 0) + line);
      }
    });

    this.totalRevenue = revenue;
    this.paidRegistrations = payingRegistrations;
    this.averageBasket = payingRegistrations ? revenue / payingRegistrations : 0;
    this.paidEventsCount = this.events.filter((event) => priceOf(event) > 0).length;

    // Reste à encaisser : places encore libres des événements payants à venir.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const seatsSold = new Map<string, number>();
    this.registrations.forEach((item) => {
      if (!item.eventId) return;
      seatsSold.set(item.eventId, (seatsSold.get(item.eventId) || 0) + seatsOf(item));
    });

    this.potentialRevenue = this.events.reduce((sum, event) => {
      const price = priceOf(event);
      const capacity = Math.max(0, event.availableSeats || 0);
      const date = parseFrDate(event.date);
      if (!price || !capacity || !date || date.getTime() < today.getTime()) return sum;
      const remaining = Math.max(0, capacity - (seatsSold.get(event.id || '') || 0));
      return sum + remaining * price;
    }, 0);

    this.revenueChart = buildBarChart(
      months.map((month) => {
        const value = perMonth.get(month.key) || 0;
        return { label: month.label, value, display: this.money(value) };
      })
    );
  }

  /** Les cinq événements qui remplissent le plus, mesurés en places réservées. */
  private buildTopEvents() {
    const byId = new Map(this.events.filter((event) => event.id).map((event) => [event.id as string, event]));

    const aggregate = new Map<string, { seats: number; registrations: number; revenue: number }>();
    this.registrations.forEach((item) => {
      if (!item.eventId) return;
      const event = byId.get(item.eventId);
      const entry = aggregate.get(item.eventId) || { seats: 0, registrations: 0, revenue: 0 };
      entry.seats += seatsOf(item);
      entry.registrations += 1;
      entry.revenue += seatsOf(item) * priceOf(event);
      aggregate.set(item.eventId, entry);
    });

    const rows = [...aggregate.entries()]
      .map(([id, entry]) => {
        const event = byId.get(id);
        const capacity = Math.max(0, event?.availableSeats || 0);
        return {
          id,
          name: event?.name || 'Événement supprimé',
          seats: entry.seats,
          registrations: entry.registrations,
          revenue: entry.revenue,
          capacity,
          fillRate: capacity ? Math.round((entry.seats / capacity) * 100) : null,
          percentage: 0
        };
      })
      .sort((a, b) => b.seats - a.seats)
      .slice(0, 5);

    const max = rows.length ? rows[0].seats : 0;
    rows.forEach((row) => {
      row.percentage = max ? Math.round((row.seats / max) * 100) : 0;
    });

    this.topEvents = rows;
  }

  private buildDonuts() {
    this.categoryDonut = buildDonut(countBy(this.events, (event) => (event.category || '').trim()), 5);

    this.accessDonut = buildDonut(
      countBy(this.events, (event) =>
        (event.visibility || '').toUpperCase() === 'PRIVATE' ? 'Réservé au groupe' : 'Ouvert au public'
      )
    );

    this.genderDonut = buildDonut(countBy(this.members, (member) => normalizeGender(member.gender)));
  }
}

/* ---------- Utilitaires ---------- */

/** Les 8 premiers caractères d'un `ObjectId` sont l'horodatage de création. */
function creationDate(id?: string): Date | null {
  if (!id || !/^[0-9a-f]{24}$/i.test(id)) return null;
  return new Date(parseInt(id.substring(0, 8), 16) * 1000);
}

/**
 * Date d'une inscription : `createdAt` quand le serveur l'a posé, sinon
 * l'horodatage de l'`ObjectId`. Les inscriptions les plus anciennes précèdent
 * l'ajout du champ et seraient autrement absentes des histogrammes.
 */
function registrationDate(registration: EventRegistrationDTO): Date | null {
  if (registration.createdAt) {
    const parsed = new Date(registration.createdAt);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return creationDate(registration.id);
}

/** Au moins une place : une inscription sans nombre reste une personne. */
function seatsOf(registration: EventRegistrationDTO): number {
  return Math.max(1, registration.seats || 1);
}

/** Prix unitaire retenu : zéro pour un événement gratuit ou sans tarif saisi. */
function priceOf(event?: EventDTO): number {
  if (!event || event.free) return 0;
  const amount = Number(event.amount);
  return isFinite(amount) && amount > 0 ? amount : 0;
}

function parseFrDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function initialsOf(firstName?: string, lastName?: string): string {
  const initials = `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  return initials || '?';
}

function daysSince(date: Date): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / day));
}

function relativeLabel(days: number): string {
  if (days === 0) return "Ajouté aujourd'hui";
  if (days === 1) return 'Ajouté hier';
  if (days < 7) return `Ajouté il y a ${days} jours`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Ajouté il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.floor(days / 30);
  return `Ajouté il y a ${months} mois`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/** Les `count` derniers mois, du plus ancien au mois courant. */
function lastMonths(count: number): { key: string; label: string; end: Date }[] {
  const now = new Date();
  const months: { key: string; label: string; end: Date }[] = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    // Jour 0 du mois suivant : le dernier instant du mois visé.
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59);
    months.push({
      key: monthKey(start),
      label: capitalize(start.toLocaleDateString('fr-FR', { month: 'short' })),
      end
    });
  }
  return months;
}

/**
 * Comptage par clé, les valeurs vides regroupées sous un libellé explicite
 * plutôt que passées sous silence.
 */
function countBy<T>(items: T[], keyOf: (item: T) => string, fallback = 'Non renseigné'): Map<string, number> {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = (keyOf(item) || '').trim() || fallback;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

/**
 * Le genre est saisi librement selon l'origine de la fiche — « MALE », « Homme »,
 * « M »… On regroupe sur trois valeurs, et tout ce qui n'est pas reconnu part en
 * « Autre » plutôt que de créer une part par orthographe.
 */
function normalizeGender(value?: string): string {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return 'Non renseigné';
  if (['male', 'homme', 'h', 'm'].includes(raw)) return 'Hommes';
  if (['female', 'femme', 'f'].includes(raw)) return 'Femmes';
  return 'Autre';
}

function uniqueTicks(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function emptyChart(): BarChart {
  return { bars: [], ticks: [], baseline: BAR_HEIGHT - BAR_PADDING.bottom, max: 0, empty: true };
}

/**
 * Histogramme vertical calculé une fois pour toutes : le gabarit ne fait que
 * poser des rectangles déjà positionnés.
 */
function buildBarChart(points: { label: string; value: number; display: string }[]): BarChart {
  const innerWidth = BAR_WIDTH - BAR_PADDING.left - BAR_PADDING.right;
  const innerHeight = BAR_HEIGHT - BAR_PADDING.top - BAR_PADDING.bottom;
  const baseline = BAR_PADDING.top + innerHeight;

  const rawMax = Math.max(...points.map((point) => point.value), 0);
  const max = rawMax || 1;
  const slot = innerWidth / Math.max(points.length, 1);
  const width = Math.min(slot * 0.5, 52);

  const bars = points.map((point, index) => {
    const height = (point.value / max) * innerHeight;
    const x = BAR_PADDING.left + slot * index + (slot - width) / 2;
    return {
      label: point.label,
      value: point.value,
      display: point.display,
      x,
      y: baseline - height,
      width,
      height,
      center: x + width / 2
    };
  });

  const ticks = uniqueTicks([0, Math.round(max / 2), Math.round(max)]).map((value) => ({
    value,
    label: `${value}`,
    y: baseline - (value / max) * innerHeight
  }));

  return { bars, ticks, baseline, max: rawMax, empty: rawMax === 0 };
}

/**
 * Parts d'un disque, exprimées en `stroke-dasharray` sur un cercle unique : pas
 * d'arcs à calculer, et les transitions CSS restent possibles.
 */
function buildDonut(counts: Map<string, number>, maxSlices = 6): Donut {
  const sorted = [...counts.entries()].filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);

  const kept = sorted.slice(0, maxSlices);
  const rest = sorted.slice(maxSlices);
  if (rest.length) {
    kept.push(['Autres', rest.reduce((sum, [, value]) => sum + value, 0)]);
  }

  const total = kept.reduce((sum, [, value]) => sum + value, 0);

  let consumed = 0;
  const slices = kept.map(([label, value], index) => {
    const fraction = total ? value / total : 0;
    const slice: DonutSlice = {
      label,
      value,
      percent: Math.round(fraction * 100),
      color: PALETTE[index % PALETTE.length],
      dash: `${fraction * DONUT_CIRCUMFERENCE} ${DONUT_CIRCUMFERENCE}`,
      offset: -consumed * DONUT_CIRCUMFERENCE
    };
    consumed += fraction;
    return slice;
  });

  return { total, slices };
}

/**
 * Courbe lissée passant par tous les points (Catmull-Rom converti en cubiques),
 * pour l'allure arrondie de la maquette sans dépendre d'une librairie de graphiques.
 */
function smoothPath(points: GrowthPoint[]): string {
  if (!points.length) return '';
  if (points.length < 3) {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}
