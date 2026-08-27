import { Injectable } from '@angular/core';
import { EventDTO } from '../api/model/eventDTO';
import { EventFileDTO } from '../api/model/eventFileDTO';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventImageService {
  // Les fichiers passent par la passerelle, comme tous les autres appels de l'application.
  private baseUrl = `${environment.host}/api/v1/files/events`;
  private localFallbackImages = [
    'assets/images/placeholder-event-1.jpg',
    'assets/images/placeholder-event-2.jpg',
    'assets/images/placeholder-event-3.jpg'
  ];
  private onlineFallbackImages = [
    'https://picsum.photos/400/300?random=1',
    'https://picsum.photos/400/300?random=2',
    'https://picsum.photos/400/300?random=3'
  ];

  getEventImageUrl(event: EventDTO | null, useOnlineFallback: boolean = false): string {
    if (!event || !event.files || event.files.length === 0) {
      return useOnlineFallback ? this.getOnlineFallbackImage() : this.getLocalFallbackImage();
    }

    // Priorité 1: la photo marquée « Principale » dans l'assistant de création —
    // c'est ce drapeau que `setMainPhoto` met à jour, pas `event.mainPhotoId`
    // (qui ne sert qu'à l'ancien flux de création avec photos groupées).
    const flaggedMain = event.files.find((file: EventFileDTO) => file.isMainPhoto === true);
    if (flaggedMain?.fileName) {
      return `${this.baseUrl}/${event.id}/${flaggedMain.fileName}`;
    }

    // Priorité 2: mainPhotoId, pour les événements créés par l'ancien flux groupé.
    if (event.mainPhotoId) {
      const mainPhoto = event.files.find((file: EventFileDTO) => file.id === event.mainPhotoId);
      if (mainPhoto) {
        return `${this.baseUrl}/${event.id}/${mainPhoto.fileName}`;
      }
    }

    // Priorité 3: aucune photo marquée principale — la première image disponible.
    const firstImage = event.files.find((file: EventFileDTO) =>
      file.fileName && this.isImageFile(file.fileName)
    );
    if (firstImage) {
      return `${this.baseUrl}/${event.id}/${firstImage.fileName}`;
    }

    // Priorité 4: Fallback local ou en ligne
    return useOnlineFallback ? this.getOnlineFallbackImage() : this.getLocalFallbackImage();
  }

  onImageError(event: any, imgElement: HTMLImageElement, useOnlineFallback: boolean = false): void {
    console.log('Erreur de chargement d\'image, utilisation du fallback');
    
    if (!useOnlineFallback) {
      // Essayer le fallback en ligne
      imgElement.src = this.getOnlineFallbackImage();
      imgElement.onerror = () => {
        // Si même le fallback en ligne échoue, utiliser l'image locale
        imgElement.src = this.getLocalFallbackImage();
      };
    } else {
      // Utiliser l'image locale
      imgElement.src = this.getLocalFallbackImage();
    }
  }

  onImageLoad(event: any, imgElement: HTMLImageElement): void {
    console.log('Image chargée avec succès');
  }

  getLocalFallbackImage(): string {
    const randomIndex = Math.floor(Math.random() * this.localFallbackImages.length);
    return this.localFallbackImages[randomIndex];
  }

  getOnlineFallbackImage(): string {
    const randomIndex = Math.floor(Math.random() * this.onlineFallbackImages.length);
    return this.onlineFallbackImages[randomIndex];
  }

  getCategoryFallbackImage(category: string, useOnlineFallback: boolean = false): string {
    if (useOnlineFallback) {
      // Images spécifiques par catégorie
      const categoryImages: { [key: string]: string } = {
        'CONFERENCE': 'https://picsum.photos/400/300?random=10',
        'ATELIER': 'https://picsum.photos/400/300?random=11',
        'SEMINAIRE': 'https://picsum.photos/400/300?random=12',
        'FORMATION': 'https://picsum.photos/400/300?random=13',
        'RETRAITE': 'https://picsum.photos/400/300?random=14',
        'AUTRE': 'https://picsum.photos/400/300?random=15'
      };
      return categoryImages[category] || this.getOnlineFallbackImage();
    }
    return this.getLocalFallbackImage();
  }

  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }
}