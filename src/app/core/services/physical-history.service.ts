import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PhysicalHistory, PhysicalHistoryRequest, PhysicalHistoryEvolutionResponse } from '../models/physical-history';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PhysicalHistoryService {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/historial-fisico`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PhysicalHistory[]> {
    return this.http.get<PhysicalHistory[]>(this.apiUrl);
  }

  getBySocio(idSocio: number): Observable<PhysicalHistory[]> {
    return this.http.get<PhysicalHistory[]>(`${this.apiUrl}/socio/${idSocio}`);
  }

  getEvolucionBySocio(idSocio: number): Observable<PhysicalHistoryEvolutionResponse> {
    return this.http.get<PhysicalHistoryEvolutionResponse>(`${this.apiUrl}/evolucion/${idSocio}`);
  }

  create(request: PhysicalHistoryRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  update(idHistorial: number, request: PhysicalHistoryRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${idHistorial}`, request);
  }
}