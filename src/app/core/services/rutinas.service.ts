import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GenerarRutinaIARequest {
  diasPorSemana: number;
  duracionSemanas: number;
  incluirCardio: boolean;
}

export interface AjustarRutinaRequest {
  nombre?: string;
  descripcion?: string;
  detalles?: {
    idDetalle: number;
    series: number;
    repeticionesMin: number;
    repeticionesMax: number;
    pesoSugerido: number;
    descansoSegundos: number;
    notas?: string;
  }[];
}

export interface RutinaDetalle {
  idRutina: number;
  nombre: string;
  descripcion: string;
  version: number;
  generadaPorIA: boolean;
  fechaGeneracion: string;
  explicacionIA: string;
  detalles: RutinaDetalleEjercicio[];
}

export interface RutinaDetalleEjercicio {
  idDetalle: number | null;
  idEjercicio: number;
  orden: number;
  series: number;
  notas: string;
  modificadoPor: string | null;
  nombreEjercicio: string;
  grupoMuscular: string;
  urlImagen: string;
  diaSemana: number;
  repeticionesMin: number;
  repeticionesMax: number;
  pesoSugerido: number;
  descansoSegundos: number;
  equipoRequerido?: string;
  semana?: number;
}

export interface Equipo {
  id: number;
  nombre: string;
  estado: 'disponible' | 'en uso' | 'mantenimiento';
}

@Injectable({
  providedIn: 'root'
})
export class RutinasService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  generarRutinaIA(data: GenerarRutinaIARequest): Observable<RutinaDetalle> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/rutinas/generar`;
    return this.http.post<RutinaDetalle>(url, data, this.getHeaders());
  }

  getMisRutinas(): Observable<RutinaDetalle[]> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/rutinas/mis-rutinas`;
    return this.http.get<RutinaDetalle[]>(url, this.getHeaders());
  }

  getRutinaById(id: number | string): Observable<RutinaDetalle> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/rutinas/${id}`;
    return this.http.get<RutinaDetalle>(url, this.getHeaders());
  }


  /**
   * Ajusta un detalle específico de la rutina
   * PUT /pg-ms-users/api/v1/rutinas/{idRutina}/ajustar
   */
  ajustarDetalle(idRutina: number | string, data: any): Observable<any> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/rutinas/${idRutina}/ajustar`;
    return this.http.put<any>(url, data, this.getHeaders());
  }

  getEquipos(): Observable<Equipo[]> {
    const url = `${this.apiUrl}/pg-ms-operation/api/equipos/todos`;
    return this.http.get<Equipo[]>(url, this.getHeaders());
  }

  getEquiposPorEjercicio(nombreEjercicio: string): Observable<Equipo[]> {
    const url = `${this.apiUrl}/pg-ms-operation/api/equipos/ejercicio/${encodeURIComponent(nombreEjercicio)}`;
    return this.http.get<Equipo[]>(url, this.getHeaders());
  }

  /**
 * Exporta una rutina específica en PDF
 * GET /pg-ms-users/api/v1/seguimiento/rutina/exportar-pdf/62
 */
  exportarRutinaPDF(idRutina: number | string): Observable<Blob> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/seguimiento/rutina/exportar-pdf/${idRutina}`;
    return this.http.get(url, {
      headers: this.getHeaders().headers,
      responseType: 'blob'
    });
  }

  /**
   * Exporta la última rutina generada en PDF
   * GET /pg-ms-users/api/v1/seguimiento/rutina/exportar-pdf
   */
  exportarUltimaRutinaPDF(): Observable<Blob> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/seguimiento/rutina/exportar-pdf`;
    return this.http.get(url, {
      headers: this.getHeaders().headers,
      responseType: 'blob'
    });
  }
}