import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AsistenciaResponseDTO } from '../../features/attendance/models/attendance.model';
import { HistorialAccesoResponse, FiltrosHistorial } from '../../features/attendance/models/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/pg-ms-operation/api/asistencias`;

  private historialApiUrl = `${this.apiUrl}/historial-accesos`;

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


  obtenerHistorialAccesos(filtros: FiltrosHistorial): Observable<HistorialAccesoResponse> {
    let params = new HttpParams();

    if (filtros.usuarioId !== undefined && filtros.usuarioId !== null) {
      params = params.set('usuarioId', filtros.usuarioId.toString());
    }
    if (filtros.fechaDesde) {
      params = params.set('fechaDesde', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      params = params.set('fechaHasta', filtros.fechaHasta);
    }
    if (filtros.tipoAcceso) {
      params = params.set('tipoAcceso', filtros.tipoAcceso);
    }
    if (filtros.resultado) {
      params = params.set('resultado', filtros.resultado);
    }

    params = params.set('page', (filtros.page ?? 0).toString());
    params = params.set('size', (filtros.size ?? 10).toString());

    return this.http.get<HistorialAccesoResponse>(this.historialApiUrl, { params });
  }
}
