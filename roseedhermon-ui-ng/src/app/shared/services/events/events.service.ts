import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { EventDTO } from '../api/model/eventDTO';
import { EventRegistrationDTO } from '../api/model/eventRegistrationDTO';
import { EventFeedbackDTO } from '../api/model/eventFeedbackDTO';

const BASE_PATH = 'http://localhost:8081/api/v1/events';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  apiUrl = BASE_PATH;

  constructor(private httpClient: HttpClient) {}

  // Méthodes CRUD de base pour les événements
  getEvents(): Observable<EventDTO[]> {
    return this.httpClient.get<EventDTO[]>(this.apiUrl).pipe(map((res) => res));
  }

  // Méthode pour récupérer les événements avec leurs fichiers
  getEventsWithFiles(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.apiUrl}/with-files`).pipe(map((res) => res));
  }

  getEvent(id: string): Observable<EventDTO> {
    const eventEndpoint = this.apiUrl + `/${id}`;
    return this.httpClient.get<EventDTO>(eventEndpoint).pipe(map((res) => res));
  }

  createEvent(event: EventDTO): Observable<EventDTO> {
    return this.httpClient.post<EventDTO>(this.apiUrl, event);
  }

  updateEvent(id: string, event: EventDTO): Observable<EventDTO> {
    const updateEndpoint = this.apiUrl + `/${id}`;
    return this.httpClient.put<EventDTO>(updateEndpoint, event);
  }

  deleteEvent(id: string): Observable<any> {
    const deleteEndpoint = this.apiUrl + `/${id}`;
    return this.httpClient.delete(deleteEndpoint);
  }

  // Méthodes pour la gestion des inscriptions
  registerForEvent(registration: EventRegistrationDTO): Observable<EventRegistrationDTO> {
    const registrationEndpoint = this.apiUrl + '/registrations';
    return this.httpClient.post<EventRegistrationDTO>(registrationEndpoint, registration);
  }

  // Méthodes pour la gestion des retours
  getEventFeedback(eventId: string): Observable<EventFeedbackDTO[]> {
    const feedbackEndpoint = this.apiUrl + `/${eventId}/feedback`;
    return this.httpClient.get<EventFeedbackDTO[]>(feedbackEndpoint).pipe(map((res) => res));
  }

  submitFeedback(feedback: EventFeedbackDTO): Observable<EventFeedbackDTO> {
    const feedbackEndpoint = this.apiUrl + '/feedback';
    return this.httpClient.post<EventFeedbackDTO>(feedbackEndpoint, feedback);
  }
} 