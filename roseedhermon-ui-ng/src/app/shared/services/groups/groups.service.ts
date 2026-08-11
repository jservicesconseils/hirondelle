import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { GroupEntity } from '../api/model/groupEntity';
import { Member } from '../api/model/member';

/** Un groupe accompagné de son effectif, tel que le renvoie `/groups/overview`. */
export interface GroupWithCount extends GroupEntity {
  memberCount: number;
}

/** Vue d'ensemble destinée au super administrateur. */
export interface GroupsOverview {
  totalGroups: number;
  totalMembers: number;
  membersWithoutGroup: number;
  groups: GroupWithCount[];
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly baseUrl = `${environment.host}/api/v1/groups`;

  constructor(private http: HttpClient) {}

  /** Le backend limite déjà la liste au groupe de l'appelant. */
  getGroups(): Observable<GroupEntity[]> {
    return this.http.get<GroupEntity[]>(this.baseUrl);
  }

  getGroup(id: string): Observable<GroupEntity> {
    return this.http.get<GroupEntity>(`${this.baseUrl}/${id}`);
  }

  createGroup(group: GroupEntity): Observable<GroupEntity> {
    return this.http.post<GroupEntity>(this.baseUrl, group);
  }

  updateGroup(id: string, group: GroupEntity): Observable<GroupEntity> {
    return this.http.put<GroupEntity>(`${this.baseUrl}/${id}`, group);
  }

  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Annuaire d'un groupe précis. */
  getGroupMembers(id: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.baseUrl}/${id}/members`);
  }

  /** Réservé au super administrateur. */
  getOverview(): Observable<GroupsOverview> {
    return this.http.get<GroupsOverview>(`${this.baseUrl}/overview`);
  }
}
