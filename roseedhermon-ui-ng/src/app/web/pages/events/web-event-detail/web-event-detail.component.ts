import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventFileDTO } from '../../../../shared/services/api/model/eventFileDTO';
import { EventFileControllerService } from '../../../../shared/services/api/api/eventFileController.service';
import { EventService } from '../../../../shared/services/events/events.service';
import { EventCard, toEventCard } from '../../../../shared/utils/event-presentation';
import { InterestButtonComponent } from '../../../components/interest-button.component';
import { PublicHeaderComponent } from '../../../components/public-header.component';
import { PublicFooterComponent } from '../../../components/public-footer.component';
import { environment } from '../../../../../environments/environment';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

function isImage(fileName?: string | null): boolean {
  const name = (fileName || '').toLowerCase();
  return IMAGE_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatUploadDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Un document téléchargeable de l'événement. */
interface DocumentView {
  name: string;
  meta: string;
  url: string;
}

/** Fiche publique d'un événement, avec sa marque d'intérêt et sa réservation. */
@Component({
  selector: 'app-web-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    InterestButtonComponent,
    PublicHeaderComponent,
    PublicFooterComponent
  ],
  templateUrl: './web-event-detail.component.html',
  styleUrls: ['./web-event-detail.component.scss']
})
export class WebEventDetailComponent implements OnInit {
  card: EventCard | null = null;
  loading = true;
  loadError = '';

  /** Photos jointes, hors celle déjà affichée en bandeau. */
  gallery: string[] = [];
  documents: DocumentView[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private events: EventService,
    private eventFiles: EventFileControllerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError = 'Aucun événement indiqué.';
      this.loading = false;
      return;
    }

    this.events.getEvent(id).subscribe({
      next: (event: EventDTO) => {
        this.card = toEventCard(event, null);
        this.loading = false;
        // `getEvent` ne renvoie pas les fichiers : il faut les demander à part,
        // comme sur mobile, pour afficher la vraie photo et les documents joints.
        this.loadFiles(id);
      },
      error: (error: { status?: number }) => {
        // Un événement privé d'un autre groupe répond 404 : son existence n'est pas révélée.
        this.loadError =
          error?.status === 404
            ? "Cet événement n'existe pas, ou n'est pas ouvert à votre groupe."
            : `L'événement n'a pas pu être chargé (${error?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  private loadFiles(eventId: string): void {
    this.eventFiles.getEventFiles(eventId).subscribe({
      next: (files: EventFileDTO[]) => {
        if (!this.card) return;
        const list = files || [];
        const photos = list.filter((file) => isImage(file.fileName));

        // La photo marquée « Principale » dans l'assistant de création ; sinon
        // la première image disponible — jamais de photo d'emprunt ici, une
        // fiche sans photo jointe garde l'illustration de sa catégorie.
        const main = photos.find((file) => file.isMainPhoto) || photos[0];
        if (main) {
          this.card.visual = this.fileUrl(eventId, main);
          this.card.image = this.card.visual;
        }
        this.gallery = photos.filter((file) => file.id !== main?.id).map((file) => this.fileUrl(eventId, file));

        this.documents = list
          .filter((file) => !isImage(file.fileName))
          .map((file) => ({
            name: file.fileName || 'Document',
            meta: [formatSize(file.fileSize), formatUploadDate(file.uploadDate)].filter(Boolean).join(' · '),
            url: this.fileUrl(eventId, file)
          }));
      },
      error: (error: unknown) => {
        // Un événement sans fichiers reste parfaitement consultable.
        console.warn("Fichiers de l'événement indisponibles", error);
      }
    });
  }

  private fileUrl(eventId: string, file: EventFileDTO): string {
    return `${environment.host}/api/v1/files/events/${eventId}/${encodeURIComponent(file.fileName || '')}`;
  }

  /** Intervenants annoncés par l'organisateur. Vide si aucun n'est saisi. */
  get presenters(): NonNullable<EventDTO['presenters']> {
    return this.card?.event.presenters?.filter((person) => person.firstName || person.lastName) ?? [];
  }

  get bookable(): boolean {
    return !!this.card?.upcoming;
  }

  onVisualError(): void {
    if (!this.card) return;
    this.card.visual = this.card.visual === this.card.style.illustration ? null : this.card.style.illustration;
  }

  book(): void {
    if (!this.card?.id) return;
    this.router.navigate(['/web/evenements', this.card.id, 'reservation']);
  }
}
