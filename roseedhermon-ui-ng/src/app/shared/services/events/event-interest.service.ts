import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Signal, signal, WritableSignal, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  EventInterestDTO,
  EventInterestState,
  EventStats
} from '../api/model/eventStats';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

const BASE_PATH = `${environment.host}/api/v1/events`;

/**
 * Courriel du visiteur qui s'est déclaré intéressé sans ouvrir de session.
 *
 * Sans lui, revenir sur la page proposerait de nouveau « Je suis intéressé » à
 * quelqu'un qui l'est déjà. Il ne quitte pas ce navigateur, et ne sert qu'à
 * reconnaître la personne auprès du serveur.
 */
const ANONYMOUS_EMAIL_KEY = 'rdh.interest.email';

/**
 * « Je suis intéressé » et chiffres de participation.
 *
 * L'état de chaque événement est **partagé** : une grille de neuf cartes ne
 * déclenche qu'un appel par événement, et le bouton de la fiche détaillée montre
 * aussitôt ce que celui de la carte a changé. Le serveur borne de son côté chaque
 * appel — le compteur est public, la liste nominative et les chiffres
 * d'inscription sont réservés à l'organisateur.
 */
@Injectable({ providedIn: 'root' })
export class EventInterestService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly states = new Map<string, WritableSignal<EventInterestState>>();
  /** Événements déjà demandés au serveur : on ne redemande pas à chaque affichage. */
  private readonly loaded = new Set<string>();

  /** Courriel identifiant : celui de la session, sinon le dernier saisi ici. */
  knownEmail(): string | null {
    const session = this.auth.user().email;
    if (session) return session;
    try {
      return localStorage.getItem(ANONYMOUS_EMAIL_KEY);
    } catch {
      // Stockage refusé par le navigateur : on continue sans mémoire.
      return null;
    }
  }

  private rememberEmail(email: string): void {
    if (this.auth.user().email) return;
    try {
      localStorage.setItem(ANONYMOUS_EMAIL_KEY, email);
    } catch {
      /* Sans mémoire, le compteur reste juste ; seul l'état du bouton se perd. */
    }
  }

  /**
   * État partagé d'un événement. Le premier appelant déclenche la lecture ; les
   * suivants reçoivent le même signal, déjà renseigné.
   */
  state(eventId: string): Signal<EventInterestState> {
    const state = this.slot(eventId);
    if (!this.loaded.has(eventId)) {
      this.loaded.add(eventId);
      this.refresh(eventId);
    }
    return state.asReadonly();
  }

  /** Relit le compteur depuis le serveur. */
  refresh(eventId: string): void {
    const email = this.knownEmail();
    let params = new HttpParams();
    if (email) params = params.set('email', email);

    this.http.get<EventInterestState>(`${BASE_PATH}/${eventId}/interest`, { params }).subscribe({
      next: (state) => this.slot(eventId).set(state),
      // Un compteur indisponible ne doit pas abîmer la page : il reste à zéro.
      error: () => undefined
    });
  }

  /** Marque l'intérêt. Un second appel ne compte pas deux fois. */
  mark(
    eventId: string,
    email: string,
    person: { firstName?: string | null; lastName?: string | null } = {}
  ): Observable<EventInterestDTO & { alreadyInterested: boolean; count: number }> {
    return this.http
      .post<EventInterestDTO & { alreadyInterested: boolean; count: number }>(
        `${BASE_PATH}/${eventId}/interest`,
        { ...person, email }
      )
      .pipe(
        tap((response) => {
          this.slot(eventId).set({ eventId, count: response.count, interested: true });
          this.rememberEmail(email);
        })
      );
  }

  /** Retire l'intérêt. */
  remove(eventId: string, email: string): Observable<EventInterestState & { removed: boolean }> {
    const params = new HttpParams().set('email', email);
    return this.http
      .delete<EventInterestState & { removed: boolean }>(`${BASE_PATH}/${eventId}/interest`, { params })
      .pipe(
        tap((response) => {
          this.slot(eventId).set({ eventId, count: response.count, interested: false });
        })
      );
  }

  /**
   * Compteurs d'intérêt de tous les événements visibles, en un seul appel.
   *
   * Classer les événements par engouement demanderait sinon un appel par ligne.
   * Les états déjà connus sont mis à jour au passage, pour que les cœurs
   * affichés ailleurs restent d'accord avec ce classement.
   */
  counts(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${BASE_PATH}/interest-counts`).pipe(
      tap((counts) => {
        Object.entries(counts).forEach(([eventId, count]) => {
          const slot = this.states.get(eventId);
          if (slot) slot.set({ ...slot(), count });
        });
      })
    );
  }

  /** Liste nominative des intéressés : réservée à l'organisateur. */
  list(eventId: string): Observable<EventInterestDTO[]> {
    return this.http.get<EventInterestDTO[]>(`${BASE_PATH}/${eventId}/interests`);
  }

  /** Inscrits, total encaissé et intéressés : réservé à l'organisateur. */
  stats(eventId: string): Observable<EventStats> {
    return this.http.get<EventStats>(`${BASE_PATH}/${eventId}/stats`);
  }

  private slot(eventId: string): WritableSignal<EventInterestState> {
    let state = this.states.get(eventId);
    if (!state) {
      state = signal<EventInterestState>({ eventId, count: 0, interested: false });
      this.states.set(eventId, state);
    }
    return state;
  }
}
