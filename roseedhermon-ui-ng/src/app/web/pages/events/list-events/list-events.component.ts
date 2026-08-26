import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventService } from '../../../../shared/services/events/events.service';
import { GroupEntity } from '../../../../shared/services/api/model/groupEntity';
import { GroupService } from '../../../../shared/services/groups/groups.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { DetailEventComponent } from '../detail-event/detail-event.component';
import { CreateEventComponent } from '../create-event/create-event.component';

/** Valeur du filtre pour les événements qui n'appartiennent à aucun groupe. */
const NO_GROUP = '__none__';

/** Colonnes affichées, précalculées à partir de l'`EventDTO`. */
interface EventRow {
  event: EventDTO;
  initials: string;
  name: string;
  category: string;
  placeName: string;
  cityLabel: string;
  date: Date | null;
  /** Un événement est « à venir » tant que sa date n'est pas passée. */
  upcoming: boolean;
}

type SortKey = 'name' | 'date' | 'city';
const PAGE_SIZE = 6;

@Component({
  selector: 'app-list-events',
  standalone: true,
  templateUrl: './list-events.component.html',
  styleUrls: ['./list-events.component.scss'],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DetailEventComponent,
    CreateEventComponent
  ]
})
export class ListEventsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('createEvent') createEventComponent!: CreateEventComponent;

  eventList: EventDTO[] = [];
  rows: EventRow[] = [];
  filteredRows: EventRow[] = [];

  selectedEvent: EventDTO | null = null;

  // Barre d'outils
  globalSearch = '';

  /** Groupes proposés au filtre : tous pour le super administrateur, le sien sinon. */
  groups: GroupEntity[] = [];
  /** `''` = tous les groupes ; `NO_GROUP` = les événements sans groupe. */
  groupFilter = '';
  readonly noGroup = NO_GROUP;

  sortKey: SortKey = 'date';
  sortDescending = false;
  viewMode: 'grid' | 'table' = 'table';

  readonly pageSize = PAGE_SIZE;
  currentPage = 0;

  editEventVisible = false;
  eventToEdit: EventDTO | null = null;

  private filterSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private groupService: GroupService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.filterSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
  }

  ngOnInit(): void {
    this.loadEvents();
    this.loadGroups();
  }

  /**
   * Un lien « Créer un événement » d'une autre page arrive ici avec `?create` :
   * ouvre l'assistant directement, sans faire deviner où cliquer. Le paramètre
   * est aussitôt retiré de l'URL pour qu'un rechargement ne le rouvre pas.
   */
  ngAfterViewInit(): void {
    if (this.route.snapshot.queryParamMap.has('create')) {
      Promise.resolve().then(() => this.showCreateEventDialog());
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Statistiques de l'entête -------------------------------------------------

  get totalEvents(): number {
    return this.rows.length;
  }

  get upcomingEvents(): number {
    return this.rows.filter((row) => row.upcoming).length;
  }

  /** Villes distinctes réellement renseignées sur les événements. */
  get citiesCount(): number {
    return this.cityCounts().size;
  }

  get topCity(): string {
    const counts = [...this.cityCounts().entries()].sort((a, b) => b[1] - a[1]);
    return counts.length ? `${counts[0][0]} (${counts[0][1]})` : '—';
  }

  private cityCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    this.rows.forEach((row) => {
      const city = (row.event.location?.city || '').trim();
      if (city) counts.set(city, (counts.get(city) || 0) + 1);
    });
    return counts;
  }

  /** Prochain événement à venir, le plus proche dans le temps. */
  get nextEventLabel(): string {
    const next = this.rows
      .filter((row) => row.upcoming && row.date)
      .sort((a, b) => (a.date!.getTime() - b.date!.getTime()))[0];
    return next ? next.name : 'Aucun à venir';
  }

  // --- Chargement ---------------------------------------------------------------

  loadEvents() {
    this.eventService.getEvents().subscribe({
      next: (data) => {
        this.eventList = data;
        this.rows = data.map((event) => this.toRow(event));
        this.applyFilters();
      },
      error: (err) => console.error('Erreur lors du chargement des événements', err)
    });
  }

  /**
   * Groupes proposés au filtre.
   *
   * Le serveur ne rend que ceux que l'appelant a le droit de voir : un
   * administrateur de groupe n'en reçoit qu'un, et le filtre s'efface alors de
   * lui-même — il n'y aurait rien à choisir.
   */
  private loadGroups(): void {
    this.groupService.getGroups().subscribe({
      next: (groups) => (this.groups = groups),
      error: () => (this.groups = [])
    });
  }

  /** Vrai quand il y a réellement un choix à faire. */
  get showGroupFilter(): boolean {
    return this.groups.length > 1 || this.hasUngrouped;
  }

  /** Vrai si des événements publics sans groupe figurent dans la liste. */
  get hasUngrouped(): boolean {
    return this.rows.some((row) => !row.event.groupId);
  }

  /** Nom du groupe organisateur, ou une mention explicite s'il n'y en a pas. */
  groupNameOf(row: EventRow): string {
    if (!row.event.groupId) return 'Sans groupe';
    return this.groups.find((group) => group.id === row.event.groupId)?.name || 'Groupe inconnu';
  }

  onGroupFilterChange(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  private toRow(event: EventDTO): EventRow {
    const name = (event.name || '').trim();
    const date = this.parseDate(event.date);
    const city = (event.location?.city || '').trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      event,
      initials: name.split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase() || '?',
      name: name || 'Sans titre',
      category: (event.category || event.eventType || 'Événement').trim(),
      placeName: (event.location?.placeName || '').trim() || '—',
      cityLabel: city || '—',
      date,
      upcoming: !!date && date.getTime() >= today.getTime()
    };
  }

  /**
   * Les dates sont enregistrées en `jj/MM/aaaa` : `new Date()` lirait « 10/01/2025 »
   * comme le 1er octobre à l'américaine. On traite ce format explicitement, et on
   * retombe sur l'analyse standard (ISO) pour les autres.
   */
  private parseDate(value?: string): Date | null {
    if (!value) return null;

    const french = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (french) {
      return new Date(Number(french[3]), Number(french[2]) - 1, Number(french[1]));
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // --- Recherche, tri, pagination -----------------------------------------------

  onGlobalSearchChange() {
    this.filterSubject.next();
  }

  setSortKey(key: SortKey) {
    if (this.sortKey === key) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortKey = key;
      this.sortDescending = key === 'date';
    }
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'table') {
    this.viewMode = mode;
  }

  applyFilters() {
    const query = this.globalSearch?.toLowerCase().trim() || '';

    const filtered = this.rows.filter((row) => {
      // Filtre par groupe organisateur, appliqué avant la recherche textuelle.
      if (this.groupFilter === NO_GROUP) {
        if (row.event.groupId) return false;
      } else if (this.groupFilter && row.event.groupId !== this.groupFilter) {
        return false;
      }

      if (!query) return true;
      const haystack = [row.name, row.placeName, row.cityLabel, row.category, row.event.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    this.filteredRows = filtered.sort((a, b) => this.compareRows(a, b));
    this.currentPage = Math.min(this.currentPage, Math.max(0, this.totalPages - 1));
  }

  private compareRows(a: EventRow, b: EventRow): number {
    const direction = this.sortDescending ? -1 : 1;

    if (this.sortKey === 'date') {
      return direction * ((a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
    }

    const value = (row: EventRow) => (this.sortKey === 'name' ? row.name : row.cityLabel) || '';
    return direction * value(a).localeCompare(value(b), 'fr', { sensitivity: 'base' });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  get pagedRows(): EventRow[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  /** Fenêtre de 5 numéros de page, comme sur la liste des membres. */
  get pageNumbers(): number[] {
    const total = this.totalPages;
    const start = Math.max(0, Math.min(this.currentPage - 2, total - 5));
    return Array.from({ length: Math.min(5, total) }, (_, index) => start + index);
  }

  get rangeStart(): number {
    return this.filteredRows.length === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.filteredRows.length);
  }

  goToPage(page: number) {
    this.currentPage = Math.max(0, Math.min(page, this.totalPages - 1));
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  // --- Actions -------------------------------------------------------------------

  openEvent(row: EventRow) {
    this.selectedEvent = row.event;
  }

  onCloseDetail() {
    this.selectedEvent = null;
  }

  showCreateEventDialog(): void {
    this.createEventComponent.showDialog();
  }

  onEditEvent(event: EventDTO) {
    this.eventToEdit = event;
    this.editEventVisible = true;
  }

  closeEditEvent() {
    this.editEventVisible = false;
    this.eventToEdit = null;
    this.loadEvents();
  }

  exportCsv() {
    const header = ['Nom', 'Date', 'Lieu', 'Ville', 'Catégorie', 'Description'];
    const lines = this.filteredRows.map((row) => [
      row.event.name,
      row.event.date,
      row.event.location?.placeName,
      row.event.location?.city,
      row.category,
      row.event.description
    ]);

    // Le point-virgule et le BOM sont ce qu'Excel en français attend.
    const csv = [header, ...lines]
      .map((cells) => cells.map((cell) => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'evenements.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  trackByRow = (_: number, row: EventRow) => row.event.id ?? row.name;
}
