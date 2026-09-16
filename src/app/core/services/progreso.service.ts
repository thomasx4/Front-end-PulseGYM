import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface EvolucionEjercicio {
  nombreEjercicio: string;
  progreso: number;
  estado: string;
}

export interface EstadisticasSocio {
  totalSesiones: number;
  promedioDuracion: number;
}

export interface DashboardSocio {
  idSocio: number;
  nombreSocio: string;
  rachaDiasEntrenando: number;
  porcentajeCumplimientoSemanal: number;
  porcentajeCumplimientoSemanaAnterior: number;
  evolucionEjercicios: EvolucionEjercicio[];
  estadisticas: EstadisticasSocio;
}

export interface DetalleSesionItem {
  idDetalleSesion: number;
  idDetalleRutina: number;
  nombreEjercicio: string;
  grupoMuscular: string;
  seriesCompletadas: number;
  repeticionesRealizadas: number;
  pesoUsado: number;
  estado: string;
  observaciones: string | null;
}

export interface SesionHistorial {
  idSesion: number;
  idSocio: number;
  nombreSocio: string;
  idRutina: number;
  nombreRutina: string;
  fechaSesion: string;
  duracionMinutos: number;
  estado: string;
  detalles: DetalleSesionItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ProgresoService {

  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/seguimiento`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Dashboard de progreso de un socio
   * GET /seguimiento/dashboard/socio/{idSocio}
   */
  getDashboardSocio(idSocio: number): Observable<DashboardSocio | null> {
    const url = `${this.apiUrl}/dashboard/socio/${idSocio}`;
    return this.http.get<DashboardSocio>(url, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getDashboardSocio:', error);
        return of(null);
      })
    );
  }

  /**
   * Historial de sesiones de un socio
   * GET /seguimiento/historial/{idSocio}
   */
  getHistorialSocio(idSocio: number): Observable<SesionHistorial[]> {
    const url = `${this.apiUrl}/historial/${idSocio}`;
    return this.http.get<SesionHistorial[]>(url, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getHistorialSocio:', error);
        return of([]);
      })
    );
  }
}