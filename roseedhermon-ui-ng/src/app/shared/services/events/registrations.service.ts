import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { EventRegistrationDTO } from '../api/model/eventRegistrationDTO';
import { environment } from '../../../../environments/environment';

const BASE_PATH = `${environment.host}/api/v1/registrations`;

/**
 * Inscriptions aux événements.
 *
 * Le serveur borne lui-même ce que chaque appel renvoie : un super administrateur
 * voit toutes les inscriptions, un administrateur de groupe celles de ses
 * événements, un membre uniquement les siennes.
 */
@Injectable({ providedIn: 'root' })
export class RegistrationService {
  constructor(private http: HttpClient) {}

  /**
   * Réserve une place. Si la personne est déjà inscrite à cet événement, le
   * serveur renvoie l'inscription existante avec `alreadyRegistered` à vrai
   * plutôt que d'en créer une seconde.
   */
  register(registration: EventRegistrationDTO): Observable<EventRegistrationDTO> {
    return this.http.post<EventRegistrationDTO>(BASE_PATH, registration);
  }

  /** Lisible sans session : le porteur de l'identifiant détient le billet. */
  get(registrationId: string): Observable<EventRegistrationDTO> {
    return this.http.get<EventRegistrationDTO>(`${BASE_PATH}/${registrationId}`);
  }

  /** Inscriptions de la personne connectée, rapprochées par courriel. */
  mine(): Observable<EventRegistrationDTO[]> {
    return this.http.get<EventRegistrationDTO[]>(`${BASE_PATH}/mine`);
  }

  /** Liste bornée au périmètre de la session. */
  list(): Observable<EventRegistrationDTO[]> {
    return this.http.get<EventRegistrationDTO[]>(BASE_PATH);
  }

  /** Inscrits à un événement : réservé à son organisateur. */
  byEvent(eventId: string): Observable<EventRegistrationDTO[]> {
    return this.http.get<EventRegistrationDTO[]>(`${environment.host}/api/v1/events/${eventId}/registrations`);
  }

  cancel(registrationId: string): Observable<void> {
    return this.http.delete<void>(`${BASE_PATH}/${registrationId}`);
  }
}
