import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PhysicalHistory, PhysicalHistoryRequest, PhysicalHistoryEvolutionResponse } from '../models/physical-history';
import { environment } from '../../../environments/environment';

export interface FiltrosHistorialFisico {
  pagina?: number;
  tamanio?: number;
  busqueda?: string;
  idSocio?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface PhysicalHistoryPageResponse {
  data?: PhysicalHistory[];
  contenido?: PhysicalHistory[];
  content?: PhysicalHistory[];
  totalElementos?: number;
  totalElements?: number;
  totalPaginas?: number;
  totalPages?: number;
  numeroPagina?: number;
  currentPage?: number;
  number?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PhysicalHistoryService {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/historial-fisico`;

  constructor(private http: HttpClient) {}

  getAll(filtros?: FiltrosHistorialFisico): Observable<PhysicalHistoryPageResponse | PhysicalHistory[]> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.pagina !== undefined && filtros.pagina !== null) {
        params = params.set('page', filtros.pagina.toString());
      }
      if (filtros.tamanio !== undefined && filtros.tamanio !== null) {
        params = params.set('size', filtros.tamanio.toString());
      }
      if (filtros.busqueda) {
        params = params.set('busqueda', filtros.busqueda);
      }
      if (filtros.idSocio) {
        params = params.set('idSocio', filtros.idSocio.toString());
      }
      if (filtros.fechaInicio) {
        params = params.set('fechaInicio', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        params = params.set('fechaFin', filtros.fechaFin);
      }
    }

    return this.http.get<PhysicalHistoryPageResponse | PhysicalHistory[]>(this.apiUrl, { params });
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