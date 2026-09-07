import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Equipo, ConsultaEquipoRequest, ApiResponseEquipos, ApiResponseSimple, EstadoEquipo } from '../../features/equipments/models/equipment.model';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = `${environment.apiUrl}/pg-ms-operation/api/equipos`;

  constructor(private http: HttpClient) {}

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
}