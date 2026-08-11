import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventDTO } from '../../services/api/model/eventDTO';
import { EventImageService } from '../../services/events/event-image.service';

@Component({
  selector: 'app-event-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="event-image-container" [class]="containerClass">
      <img 
        [src]="imageUrl" 
        [alt]="altText"
        [class]="imageClass"
        (error)="onImageError($event)"
        (load)="onImageLoad($event)"
        [style]="imageStyle">
      
      <!-- Placeholder pour les images en cours de chargement -->
      <div *ngIf="isLoading" class="image-loading-placeholder">
        <i class="pi pi-spin pi-spinner"></i>
      </div>
      
      <!-- Placeholder pour les images manquantes -->
      <div *ngIf="showPlaceholder" class="image-placeholder">
        <i class="pi pi-image"></i>
        <span class="placeholder-text">{{ placeholderText }}</span>
      </div>
    </div>
  `,
  styles: [`
    .event-image-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border-radius: inherit;
      overflow: hidden;
    }

    .event-image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }

    .image-loading-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #6c757d;
      font-size: 1.5rem;
    }

    .image-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #6c757d;
    }

    .image-placeholder i {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .placeholder-text {
      font-size: 0.8rem;
      font-weight: 500;
    }

    .circular {
      border-radius: 50%;
    }

    .rounded {
      border-radius: 8px;
    }

    .square {
      border-radius: 0;
    }
  `]
})
export class EventImageComponent implements OnInit, OnChanges {
  @Input() event: EventDTO | null = null;
  @Input() altText: string = '';
  @Input() containerClass: string = '';
  @Input() imageClass: string = '';
  @Input() imageStyle: any = {};
  @Input() shape: 'circular' | 'rounded' | 'square' = 'rounded';
  @Input() placeholderText: string = 'Aucune image';
  @Input() showLoading: boolean = true;

  @Output() imageError = new EventEmitter<any>();
  @Output() imageLoad = new EventEmitter<any>();

  imageUrl: string = '';
  isLoading: boolean = false;
  showPlaceholder: boolean = false;
  errorCount: number = 0;
  maxRetries: number = 3;

  constructor(private eventImageService: EventImageService) {}

  ngOnInit(): void {
    this.loadImage();
  }

  ngOnChanges(): void {
    this.loadImage();
  }

  private loadImage(): void {
    if (!this.event) {
      this.showPlaceholder = true;
      return;
    }

    this.isLoading = this.showLoading;
    this.showPlaceholder = false;
    this.imageUrl = this.eventImageService.getEventImageUrl(this.event);
  }

  onImageError(event: any): void {
    this.errorCount++;
    console.log(`❌ Erreur de chargement image (tentative ${this.errorCount}/${this.maxRetries}):`, this.event?.name);
    
    if (this.errorCount < this.maxRetries) {
      // Essayer une image de fallback locale différente
      this.eventImageService.onImageError(this.event, event.target, false);
      this.imageUrl = event.target.src; // Utiliser la nouvelle URL de fallback
    } else if (this.errorCount === this.maxRetries) {
      // Dernière tentative avec une image en ligne
      console.log('🔄 Dernière tentative avec image en ligne');
      this.eventImageService.onImageError(this.event, event.target, true);
      this.imageUrl = event.target.src;
    } else {
      // Afficher le placeholder après toutes les tentatives
      this.isLoading = false;
      this.showPlaceholder = true;
      this.imageUrl = '';
    }
    
    this.imageError.emit(event);
  }

  onImageLoad(event: any): void {
    this.isLoading = false;
    this.showPlaceholder = false;
    this.errorCount = 0; // Reset le compteur d'erreurs en cas de succès
    console.log('✅ Image chargée avec succès:', this.event?.name);
    this.imageLoad.emit(event);
  }

  // Méthode pour forcer le rechargement de l'image
  reloadImage(): void {
    this.errorCount = 0;
    this.loadImage();
  }
}