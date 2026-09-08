// src/app/core/services/ajustes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UpdatePreferenciasPayload {
  preferencia: 'AMBOS' | 'EMAIL' | 'PUSH';
  logrosHabilitado: boolean;
  mantenimientosHabilitado: boolean;
  promocionesHabilitado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AjustesService {
  private apiUrl = `${environment.apiUrl}/pg-ms-notifications/preferencias`;

  constructor(private http: HttpClient) { }

  getMisPreferencias(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mis-preferencias`);
  }

  actualizarPreferencias(payload: UpdatePreferenciasPayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mis-preferencias`, payload);
  }
}