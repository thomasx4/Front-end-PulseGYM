import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';
import { Sede, ApiResponseSedes } from '../../features/headquarters/models/sede.model';

@Injectable({
  providedIn: 'root'
})
export class HeadquarterService {
  private apiUrl = `${environment.apiUrl}/pg-ms-operation/api/sedes`;

  constructor(private http: HttpClient) { }

  obtenerTodas(): Observable<Sede[]> {
    return this.http.get<ApiResponseSedes<Sede[]>>(this.apiUrl).pipe(
      map(res => res.data || [])
    );
  }

  buscarPorNombre(nombre: string): Observable<Sede[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<ApiResponseSedes<Sede[]>>(`${this.apiUrl}/buscar/nombre`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  buscarPorCiudad(ciudad: string): Observable<Sede[]> {
    const params = new HttpParams().set('ciudad', ciudad);
    return this.http.get<ApiResponseSedes<Sede[]>>(`${this.apiUrl}/buscar/ciudad`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  registrarSede(sede: Sede): Observable<ApiResponseSedes<Sede>> {
    return this.http.post<ApiResponseSedes<Sede>>(this.apiUrl, sede);
  }

  actualizarSede(idSede: number, sede: Sede): Observable<ApiResponseSedes<Sede>> {
    return this.http.put<ApiResponseSedes<Sede>>(`${this.apiUrl}/${idSede}`, sede);
  }

  eliminarSede(idSede: number): Observable<ApiResponseSedes<void>> {
    return this.http.delete<ApiResponseSedes<void>>(`${this.apiUrl}/${idSede}`);
  }
}
