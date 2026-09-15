import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';
import { AsistenciaResponseDTO } from '../../features/attendance/models/attendance.model';
import { HistorialAccesoResponse, FiltrosHistorial } from '../../features/attendance/models/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private baseUrl = `${environment.apiUrl}/pg-ms-operation/api`;
  private reportsApiUrl = `${environment.apiUrl}/pg-ms-reports/api/reportes`;
  private apiUrl = `${this.baseUrl}/asistencias`;

  private historialApiUrl = `${this.baseUrl}/historial-accesos`;

  readonly capacidadDiaria = 4;

  constructor(private http: HttpClient) { }

  obtenerAsistenciasHoy(): Observable<AsistenciaResponseDTO[]> {
    return this.http.get<AsistenciaResponseDTO[]>(`${this.apiUrl}/hoy`);
  }

  getMetaDiaria(idSede: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/meta/${idSede}`)
  }

  actualizarMetaDiaria(idSede: number, nuevaMeta: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/meta/${idSede}`, { meta: nuevaMeta });
  }

  obtenerHistorialAccesos(filtros: FiltrosHistorial): Observable<HistorialAccesoResponse> {
    let params = new HttpParams();

    if (filtros.usuarioId) {
      params = params.set('usuarioId', filtros.usuarioId.toString());
    } else if (filtros.nombreUsuario && !isNaN(Number(filtros.nombreUsuario.trim()))) {
      params = params.set('usuarioId', filtros.nombreUsuario.trim());
    }

    if (filtros.fechaDesde && filtros.fechaDesde.trim() !== '') {
      params = params.set('fechaInicio', `${filtros.fechaDesde.split('T')[0]}T00:00:00`);
    }

    if (filtros.fechaHasta && filtros.fechaHasta.trim() !== '') {
      params = params.set('fechaFin', `${filtros.fechaHasta.split('T')[0]}T23:59:59`);
    }

    if (filtros.tipoAcceso && filtros.tipoAcceso.trim() !== '') {
      params = params.set('tipoAcceso', filtros.tipoAcceso.trim().toUpperCase());
    }

    if (filtros.resultado && filtros.resultado.trim() !== '') {
      params = params.set('resultado', filtros.resultado.trim().toUpperCase());
    }

    params = params.set('page', (filtros.page ?? 0).toString());
    params = params.set('size', (filtros.size ?? 10).toString());

    return this.http.get<HistorialAccesoResponse>(this.historialApiUrl, { params });
  }

  exportarExcelAfluencia(fecha: string): Observable<Blob> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get(`${this.reportsApiUrl}/afluencia/exportar/excel`, {
      params,
      responseType: 'blob'
    });
  }

  exportarPdfAfluencia(fecha: string): Observable<Blob> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get(`${this.reportsApiUrl}/afluencia/exportar/pdf`, {
      params,
      responseType: 'blob'
    });
  }


  exportarTendenciaPdf(tipoReporte: 'SEMANAL' | 'MENSUAL', fechaReferencia: string): Observable<Blob> {
    const params = new HttpParams()
      .set('tipoReporte', tipoReporte)
      .set('fechaReferencia', fechaReferencia);

    return this.http.get(`${this.reportsApiUrl}/tendencia/exportar/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  exportarTendenciaExcel(tipoReporte: 'SEMANAL' | 'MENSUAL', fechaReferencia: string): Observable<Blob> {
    const params = new HttpParams()
      .set('tipoReporte', tipoReporte)
      .set('fechaReferencia', fechaReferencia);

    return this.http.get(`${this.reportsApiUrl}/tendencia/exportar/excel`, {
      params,
      responseType: 'blob'
    });
  }
}