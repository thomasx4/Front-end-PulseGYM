import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Equipo, ConsultaEquipoRequest, ApiResponseEquipos, ApiResponseSimple, EstadoEquipo, RegistrarFallaPayload } from '../../features/equipments/models/equipment.model';
import { ReportesFallaResponse, FiltrosFalla, ActualizarEstadoFallaRequest } from '../../features/equipments/models/equipment-fault.model';
import { RegistrarMantenimientoPayload, HistorialMantenimientoResponse } from '../../features/equipments/models/maintenance.model';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = `${environment.apiUrl}/pg-ms-operation/api/equipos`;
  private maintenanceUrl = `${environment.apiUrl}/pg-ms-operation/api/mantenimientos`;

  constructor(private http: HttpClient) { }

  consultarEquipos(filtros: ConsultaEquipoRequest = {}): Observable<Equipo[]> {
    return this.http.post<ApiResponseEquipos<Equipo[]>>(`${this.apiUrl}/consultar`, filtros).pipe(
      map(res => {
        const lista = res.data || [];
        return lista.map(eq => ({
          ...eq,
          id: eq.idEquipo || eq.id
        }));
      })
    );
  }

  registrarEquipo(equipo: Equipo): Observable<ApiResponseSimple> {
    return this.http.post<ApiResponseSimple>(this.apiUrl, equipo);
  }

  actualizarEquipo(id: number, equipo: Equipo): Observable<ApiResponseSimple> {
    return this.http.put<ApiResponseSimple>(`${this.apiUrl}/${id}`, equipo);
  }

  cambiarEstado(id: number, estado: EstadoEquipo): Observable<ApiResponseSimple> {
    return this.http.patch<ApiResponseSimple>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  registrarFalla(idEquipo: number, payload: RegistrarFallaPayload): Observable<ApiResponseSimple> {
    return this.http.post<ApiResponseSimple>(`${this.apiUrl}/${idEquipo}/reportar-falla`, payload);
  }

  obtenerReportesFalla(filtros: FiltrosFalla = {}): Observable<ReportesFallaResponse> {
    let params = new HttpParams();

    if (filtros.idEquipo) {
      params = params.set('idEquipo', filtros.idEquipo.toString());
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.urgencia) {
      params = params.set('urgencia', filtros.urgencia);
    }

    return this.http.get<ReportesFallaResponse>(`${this.apiUrl}/reportes-falla`, { params });
  }

  actualizarEstadoReporte(idEquipo: number, nuevoEstado: string): Observable<any> {
    const body: ActualizarEstadoFallaRequest = { estado: nuevoEstado as any };
    return this.http.patch<any>(`${this.apiUrl}/${idEquipo}/estado-reporte`, body);
  }

  registrarMantenimiento(payload: RegistrarMantenimientoPayload): Observable<any> {
    return this.http.post<any>(this.maintenanceUrl, payload);
  }

  obtenerHistorialMantenimiento(idEquipo: number): Observable<HistorialMantenimientoResponse> {
    return this.http.get<HistorialMantenimientoResponse>(`${this.maintenanceUrl}/historial/equipo/${idEquipo}`);
  }
}