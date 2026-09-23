import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegistroSesionPayload {
  idRutina: number;
  duracionMinutos: number;
  observaciones: string;
  detalles: DetalleSesionPayload[];
}

export interface DetalleSesionPayload {
  idDetalleRutina: number;
  seriesCompletadas: number;
  repeticionesRealizadas: number;
  pesoUsado: number;
  estado: 'COMPLETADO' | 'PARCIAL' | 'NO_REALIZADO';
  observaciones: string | null;
}

export interface SesionRegistrada {
  idSesion?: number;
  mensaje?: string;
  [key: string]: any;
}

export interface RutinaDelDia {
  idRutina: number;
  nombre: string;
  descripcion?: string;
  detalles: DetalleRutina[];
}

export interface DetalleRutina {
  idDetalle: number;
  idEjercicio: number;
  orden: number;
  series: number;
  repeticionesMin: number;
  repeticionesMax: number;
  pesoSugerido: number;
  descansoSegundos: number;
  notas?: string;
  nombreEjercicio: string;
  grupoMuscular: string;
  urlImagen?: string;
  diaSemana: number;
  semana?: number;
  equipoRequerido?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {

  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/seguimiento`;

  constructor(private http: HttpClient) { }

  registrarSesion(payload: RegistroSesionPayload): Observable<SesionRegistrada> {
    return this.http.post<SesionRegistrada>(`${this.apiUrl}/sesion`, payload);
  }

  getUltimaRutina(): Observable<RutinaDelDia> {
    const url = `${environment.apiUrl}/pg-ms-users/api/v1/rutinas/ultima`;
    return this.http.get<RutinaDelDia>(url);
  }

  getRutinaById(id: number | string): Observable<RutinaDelDia> {
    const url = `${environment.apiUrl}/pg-ms-users/api/v1/rutinas/${id}`;
    return this.http.get<RutinaDelDia>(url);
  }
}