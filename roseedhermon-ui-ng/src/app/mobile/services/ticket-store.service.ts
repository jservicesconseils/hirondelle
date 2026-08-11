import { Injectable } from '@angular/core';

/** Une réservation conservée sur l'appareil. */
export interface StoredTicket {
  registrationId: string;
  eventId: string;
  createdAt: string;
}

const STORAGE_KEY = 'rdh.mobile.tickets';

/**
 * Historique des billets de l'appareil.
 *
 * L'API d'inscription ne sait que créer, interroger et annuler une inscription
 * précise : elle n'expose aucune liste par utilisateur, et l'application n'a pas
 * d'authentification. On garde donc la trace des réservations localement, ce qui
 * suffit à reconstituer l'historique sans toucher au contrat des services Java.
 */
@Injectable({ providedIn: 'root' })
export class TicketStoreService {
  all(): StoredTicket[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => item?.registrationId && item?.eventId) : [];
    } catch {
      return [];
    }
  }

  findByEvent(eventId: string): StoredTicket | undefined {
    return this.all().find((ticket) => ticket.eventId === eventId);
  }

  /** Une seule réservation par événement : une seconde visite réutilise la première. */
  save(registrationId: string, eventId: string): StoredTicket {
    const tickets = this.all().filter((ticket) => ticket.eventId !== eventId);
    const entry: StoredTicket = { registrationId, eventId, createdAt: new Date().toISOString() };
    this.write([entry, ...tickets]);
    return entry;
  }

  remove(registrationId: string): void {
    this.write(this.all().filter((ticket) => ticket.registrationId !== registrationId));
  }

  private write(tickets: StoredTicket[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (error) {
      console.warn('Historique des billets non enregistré', error);
    }
  }
}
