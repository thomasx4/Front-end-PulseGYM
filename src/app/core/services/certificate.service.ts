import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment.prod';
import { Certificate, CertificateRequest, CertificateUpdate, CertificateFilter, CertificateMetric } from '../models/certificate';

export interface RespuestaPaginadaCertificaciones {
  content?: Certificate[];
  contenido?: Certificate[];
  data?: Certificate[];
  currentPage?: number;
  number?: number;
  numeroPagina?: number;
  size?: number;
  tamanioPagina?: number;
  totalElements?: number;
  totalElementos?: number;
  totalPages?: number;
  totalPaginas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/certificaciones`;

  constructor(private http: HttpClient) { }

  /** GET: Obtener certificaciones paginadas */
  obtenerCertificacionesPaginadas(filtros: CertificateFilter = {}): Observable<RespuestaPaginadaCertificaciones> {
    let params = new HttpParams();

    if (filtros.search) {
      params = params.set('search', filtros.search);
      params = params.set('busqueda', filtros.search);
    }

    params = params.set('pagina', (filtros.pagina ?? 0).toString());
    params = params.set('page', (filtros.pagina ?? 0).toString());
    params = params.set('tamanio', (filtros.tamanio ?? 5).toString());
    params = params.set('size', (filtros.tamanio ?? 5).toString());

    return this.http.get<RespuestaPaginadaCertificaciones>(this.apiUrl, { params });
  }

  /** GET: Obtener todas las certificaciones */
  obtenerTodasLasCertificaciones(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(this.apiUrl);
  }

  /** GET: Obtener certificaciones por idEntrenador */
  obtenerCertificacionesPorEntrenador(idEntrenador: number): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/entrenador/${idEntrenador}`);
  }

  /** POST: Registrar certificación */
  registrarCertificacion(data: CertificateRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  /** PUT: Actualizar certificación */
  actualizarCertificacion(idCertificacion: number, data: CertificateUpdate): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${idCertificacion}`, data);
  }

  /** DELETE: Eliminar certificación */
  eliminarCertificacion(idCertificacion: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idCertificacion}`);
  }

  /** Métrica calculada en el frontend */
  obtenerMetricas(): Observable<CertificateMetric> {
    return this.obtenerTodasLasCertificaciones().pipe(
      map(items => ({
        totalCertificaciones: items.length,
        entrenadoresCertificados: new Set(items.map(c => c.idEntrenador)).size
      }))
    );
  }

  getTodasSociosMembresiasActivas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/socios-membresias/activas`);
}
} 