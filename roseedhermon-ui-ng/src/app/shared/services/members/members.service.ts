import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment.dev';
import { Member } from '../api/model/member';


const BASE_PATH = '/api/v1/members';

@Injectable({
  providedIn: 'root'
})
export class MemberService {

  apiUrl = environment.memberHost + BASE_PATH;

  constructor(private httpClient:HttpClient) {
   
  }

  getMember(id: any){
    const memberEndpoint = this.apiUrl + `/${id}` 
    return this.httpClient.get(memberEndpoint).pipe(map((res) => res));
  }


  createMember(member : Member):Observable<Member>{
    return this.httpClient.post<Member>(this.apiUrl, member);
  }

  deleteMember(id: any){
    const deleteEndPoint = this.apiUrl + `/${id}` 
    return this.httpClient.delete<Member>(deleteEndPoint);
  }

  updateMember(member:Member):Observable<Member>{
    const updateEndpoint = this.apiUrl + `/${member.id}` 
    return this.httpClient.put<Member>(updateEndpoint, member);
  }

  getMembers():Observable<Array<Member>> {
    const listMembers = this.apiUrl; 
    return this.httpClient.get<Member[]>(listMembers).pipe(map((res) => res));
  }

}

