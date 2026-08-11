import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { GroupEntity } from '../../shared/services/api/model/groupEntity';
import { environment } from '../../../environments/environment';
import { ROLES } from './auth.model';

/**
 * Alimente l'écran de connexion simulée en groupes réels.
 *
 * La liste des groupes exige des droits — normal — mais l'écran de connexion en a
 * besoin **avant** toute session, pour proposer un groupe à rattacher. On envoie
 * donc explicitement l'en-tête de rôle simulé, que le serveur n'écoute que lorsque
 * Cognito est absent. Ce service n'a donc aucun effet en production, où l'écran
 * de connexion n'affiche pas de sélecteur de groupe.
 */
@Injectable({ providedIn: 'root' })
export class MockDirectoryService {
  constructor(private http: HttpClient) {}

  groups(): Observable<GroupEntity[]> {
    return this.http
      .get<GroupEntity[]>(`${environment.host}/api/v1/groups`, {
        headers: { 'X-Dev-Role': ROLES.SUPER_ADMIN }
      })
      .pipe(catchError(() => of<GroupEntity[]>([])));
  }
}
