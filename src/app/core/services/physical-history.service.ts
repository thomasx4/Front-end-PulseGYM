import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PhysicalHistory, PhysicalHistoryRequest, PhysicalHistoryEvolutionResponse, HistorialResumenDTO } from '../models/physical-history';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PhysicalHistoryService {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/historial-fisico`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<PhysicalHistory[]> {
    return this.http.get<PhysicalHistory[]>(this.apiUrl).pipe(
      map((items: any[]) => {
        if (items) {
          items.forEach(item => {
            const normalizedId = item.idHistorialFisico || item.id || item.idHistorial;
            item.idHistorialFisico = normalizedId;
            item.id = normalizedId;
            item.idHistorial = normalizedId;
          });
        }
        return items || [];
      })
    );
  }

  getBySocio(idSocio: number): Observable<PhysicalHistory[]> {
    return this.http.get<PhysicalHistory[]>(`${this.apiUrl}/socio/${idSocio}`).pipe(
      map((items: any[]) => {
        if (items) {
          items.forEach(item => {
            const normalizedId = item.idHistorialFisico || item.id || item.idHistorial;
            item.idHistorialFisico = normalizedId;
            item.id = normalizedId;
            item.idHistorial = normalizedId;
          });
        }
        return items || [];
      })
    );
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

  getPaginados(
    page: number = 0,
    size: number = 6,
    idSocio?: number | string,
    fechaInicio?: string,
    fechaFin?: string,
    search?: string,
    sortBy: string = 'fechaMedicion',
    direction: string = 'desc'
  ): Observable<any> {
    let params: any = {
      pagina: page,
      tamanio: size,
      sortBy: sortBy,
      direction: direction
    };

    if (idSocio && idSocio !== 'ALL') {
      params.idSocio = idSocio;
    }
    if (fechaInicio) {
      params.fechaInicio = `${fechaInicio}T00:00:00`;
    }
    if (fechaFin) {
      params.fechaFin = `${fechaFin}T23:59:59`;
    }
    if (search && search.trim() !== '') {
      params.search = search.trim();
    }

    return this.http.get<any>(`${this.apiUrl}/paginados`, { params }).pipe(
      map((response: any) => {
        const items = response.content || response;
        if (Array.isArray(items)) {
          items.forEach(item => {
            const normalizedId = item.idHistorialFisico || item.id || item.idHistorial;
            item.idHistorialFisico = normalizedId;
            item.id = normalizedId;
            item.idHistorial = normalizedId;
          });
        }
        return response;
      })
    );
  }

  getResumenMetricas(): Observable<HistorialResumenDTO> {
    return this.http.get<HistorialResumenDTO>(`${this.apiUrl}/resumen`);
  }
}