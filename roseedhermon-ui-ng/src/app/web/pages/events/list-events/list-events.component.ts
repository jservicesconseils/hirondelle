import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ClientSideRowModelModule, ColDef, ICellRendererParams, ModuleRegistry, GridOptions, DomLayoutType } from 'ag-grid-community';
import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventService } from '../../../../shared/services/events/events.service';
import { DetailEventComponent } from '../detail-event/detail-event.component';
import { CreateEventComponent } from '../create-event/create-event.component';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

@Component({
  selector: 'app-list-events',
  standalone: true,
  templateUrl: './list-events.component.html',
  styleUrls: ['./list-events.component.scss'],
  imports: [
    CommonModule,
    HttpClientModule,
    AgGridModule,
    ButtonModule,
    AutoCompleteModule,
    FormsModule,
    DetailEventComponent,
    CreateEventComponent
  ]
})
export class ListEventsComponent implements OnInit {
  @ViewChild('createEvent') createEventComponent!: CreateEventComponent;

  eventList: EventDTO[] = [];
  filteredEventList: EventDTO[] = [];
  selectedEvent: EventDTO | null = null;
  paginationPageSize = 10;

  // Filtres et suggestions
  eventNameFilter: string = '';
  placeFilter: string = '';
  cityFilter: string = '';
  eventNameSuggestions: string[] = [];
  placeSuggestions: string[] = [];
  citySuggestions: string[] = [];

  private filterSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  editEventVisible = false;
  eventToEdit: EventDTO | null = null;

  columnDefs: ColDef<EventDTO>[] = [
    {
      headerName: 'Numéro',
      width: 80,
      cellRenderer: (params: any) => {
        const page = params.api.paginationGetCurrentPage?.() || 0;
        const pageSize = params.api.paginationGetPageSize?.() || 15;
        const displayNumber = (page * pageSize) + (params.node.rowIndex ?? 0) + 1;
        return `
          <span class="icon-cell">
            <i class="pi pi-hashtag" style="color:#6c757d; margin-right:6px;"></i>${displayNumber}
          </span>
        `;
      }
    },
    { 
      field: 'name', 
      headerName: 'Événement',
      cellRenderer: (params: ICellRendererParams) => `
        <span class="icon-cell">
          <i class="pi pi-calendar" style="color:#2e31a4; margin-right:6px;"></i>${params.value}
        </span>
      `
    },
    { 
      field: 'date', 
      headerName: 'Date',
      cellClass: 'text-center',
      cellRenderer: (params: ICellRendererParams) => {
        const date = new Date(params.value);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    },
    { 
      field: 'location.placeName', 
      headerName: 'Lieu',
      cellRenderer: (params: ICellRendererParams) => `
        <span class="icon-cell">
          <i class="pi pi-map-marker" style="color:#3f51b5; margin-right:6px;"></i>${params.value}
        </span>
      `
    },
    { 
      field: 'location.city', 
      headerName: 'Ville',
      cellRenderer: (params: ICellRendererParams) => `
        <span class="icon-cell">
          <i class="pi pi-building" style="color:#4caf50; margin-right:6px;"></i>${params.value}
        </span>
      `
    },
    { 
      field: 'description', 
      headerName: 'Description',
      cellRenderer: (params: ICellRendererParams) => `
        <span class="icon-cell">
          <i class="pi pi-info-circle" style="color:#ff9800; margin-right:6px;"></i>${params.value}
        </span>
      `
    }
  ];
  
  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressAutoSize: true,
    suppressSizeToFit: false,
    minWidth: 100,
    flex: 1
  };

  gridOptions: GridOptions<EventDTO> = {
    suppressColumnVirtualisation: true,
    suppressRowVirtualisation: false,
    suppressHorizontalScroll: true,
    domLayout: 'normal' as DomLayoutType
  };

  constructor(private eventService: EventService, private router: Router) {
    this.filterSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEvents() {
    this.eventService.getEvents().subscribe({
      next: (data) => {
        this.eventList = data;
        this.filteredEventList = [...data];
        this.updateSuggestions();
      },
      error: (err) => console.error('Erreur lors du chargement des événements', err)
    });
  }

  // Filtres avec debounce
  onEventNameChange() { this.filterSubject.next(); }
  onPlaceChange() { this.filterSubject.next(); }
  onCityChange() { this.filterSubject.next(); }

  // Suggestions
  updateSuggestions() {
    this.eventNameSuggestions = [...new Set(this.eventList.map(e => e.name).filter((v): v is string => !!v))];
    this.placeSuggestions = [...new Set(this.eventList.map(e => e.location?.placeName).filter((v): v is string => !!v))];
    this.citySuggestions = [...new Set(this.eventList.map(e => e.location?.city).filter((v): v is string => !!v))];
  }
  filterEventName(event: any) {
    const query = event.query.toLowerCase();
    this.eventNameSuggestions = this.eventList
      .map(e => e.name)
      .filter((v): v is string => !!v)
      .filter(name => name.toLowerCase().includes(query));
  }
  filterPlace(event: any) {
    const query = event.query.toLowerCase();
    this.placeSuggestions = this.eventList
      .map(e => e.location?.placeName)
      .filter((v): v is string => !!v)
      .filter(place => place.toLowerCase().includes(query));
  }
  filterCity(event: any) {
    const query = event.query.toLowerCase();
    this.citySuggestions = this.eventList
      .map(e => e.location?.city)
      .filter((v): v is string => !!v)
      .filter(city => city.toLowerCase().includes(query));
  }

  // Sélection et clear
  onEventNameSelect(event: any) { this.eventNameFilter = event.value || event; this.applyFilters(); }
  onPlaceSelect(event: any) { this.placeFilter = event.value || event; this.applyFilters(); }
  onCitySelect(event: any) { this.cityFilter = event.value || event; this.applyFilters(); }
  onEventNameClear() { this.eventNameFilter = ''; this.applyFilters(); }
  onPlaceClear() { this.placeFilter = ''; this.applyFilters(); }
  onCityClear() { this.cityFilter = ''; this.applyFilters(); }

  applyFilters() {
    this.filteredEventList = this.eventList.filter(event => {
      const nameMatch = !this.eventNameFilter || (event.name && event.name.toLowerCase().includes(this.eventNameFilter.toLowerCase()));
      const placeMatch = !this.placeFilter || (event.location?.placeName && event.location.placeName.toLowerCase().includes(this.placeFilter.toLowerCase()));
      const cityMatch = !this.cityFilter || (event.location?.city && event.location.city.toLowerCase().includes(this.cityFilter.toLowerCase()));
      return nameMatch && placeMatch && cityMatch;
    });
  }

  onRowClicked(event: any) {
    this.selectedEvent = event.data;
  }

  onCloseDetail() {
    this.selectedEvent = null;
  }

  onCreateEvent() {
    // TODO: Implémenter la logique de création d'événement
    console.log('Création d\'un nouvel événement');
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
  }

  goToHome() {
    this.router.navigate(['/web']);
  }
} 