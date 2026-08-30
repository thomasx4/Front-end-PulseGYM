import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AsistenciaResponseDTO } from '../../features/attendance/models/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/pg-ms-operation/api/asistencias`;

  readonly capacidadDiaria = 4;

  constructor(private http: HttpClient) { }

  obtenerAsistenciasHoy(): Observable<AsistenciaResponseDTO[]> {
    return this.http.get<AsistenciaResponseDTO[]>(`${this.apiUrl}/hoy`);
  }

  getMetaDiaria(idSede: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/meta/${idSede}`)
  }

  actualizarMetaDiaria(idSede: number, nuevaMeta: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/meta/${idSede}`, {meta: nuevaMeta});
  }
}
