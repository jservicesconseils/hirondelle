import { Injectable } from '@angular/core';

/** Ce que le participant a saisi avant de confirmer sa place. */
export interface ReservationDraft {
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  seats: number;
  note: string;
}

const STORAGE_KEY = 'rdh.mobile.reservation';

/**
 * Coordonnées saisies à l'écran de réservation, conservées jusqu'à la création
 * effective de l'inscription.
 *
 * Le parcours passe par le paiement entre les deux : sans ce relais, le nom et
 * le courriel seraient perdus en route, et l'inscription partirait vide — ce
 * qu'elle faisait, et que le serveur refuse désormais.
 *
 * Le brouillon vit dans `sessionStorage` : il ne survit pas à la fermeture de
 * l'application, ce qui est exactement sa durée utile.
 */
@Injectable({ providedIn: 'root' })
export class ReservationDraftService {
  save(draft: ReservationDraft): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn('Brouillon de réservation non conservé', error);
    }
  }

  /** Brouillon de cet événement, ou `null` s'il concerne un autre — ou s'il n'y en a pas. */
  forEvent(eventId: string): ReservationDraft | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ReservationDraft;
      return parsed?.eventId === eventId ? parsed : null;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Rien à nettoyer si le stockage est refusé. */
    }
  }
}
