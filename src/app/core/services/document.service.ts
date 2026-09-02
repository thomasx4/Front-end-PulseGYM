import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Document, DocumentMetric } from '../models/document';

export interface FiltrosDocumentos {
  pagina?: number;
  tamanio?: number;
  search?: string;
  tipoDocumento?: string;
  estado?: string;
}

export interface RespuestaPaginadaDocumentos {
  content?: Document[];
  contenido?: Document[];
  data?: Document[];
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
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/documentos`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener documentos legales paginados con filtros
   */
  obtenerDocumentosPaginados(filtros: FiltrosDocumentos = {}): Observable<RespuestaPaginadaDocumentos> {
    let params = new HttpParams();

    if (filtros.search) {
      params = params.set('search', filtros.search);
      params = params.set('busqueda', filtros.search);
    }
    if (filtros.tipoDocumento && filtros.tipoDocumento !== 'todos') {
      params = params.set('tipoDocumento', filtros.tipoDocumento);
    }
    if (filtros.estado && filtros.estado !== 'todos') {
      params = params.set('estado', filtros.estado.toUpperCase());
    }

    params = params.set('pagina', (filtros.pagina ?? 0).toString());
    params = params.set('page', (filtros.pagina ?? 0).toString());
    params = params.set('tamanio', (filtros.tamanio ?? 5).toString());
    params = params.set('size', (filtros.tamanio ?? 5).toString());

    return this.http.get<RespuestaPaginadaDocumentos>(this.apiUrl, { params });
  }

  obtenerDocumentos(filtros?: any): Observable<Document[]> {
    return this.http.get<Document[]>(this.apiUrl);
  }

  obtenerDocumentosPorSocio(idUsuario: number): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/socio/${idUsuario}`);
  }

  obtenerDocumentoPorId(idDocumento: number): Observable<Document> {
    return this.obtenerDocumentos().pipe(
      map(documentos => {
        const doc = documentos.find(d => d.idDocumento === idDocumento);
        if (!doc) {
          throw new Error(`No se encontró el documento con ID #${idDocumento}`);
        }
        return doc;
      })
    );
  }

  crearDocumento(data: { idUsuario: number; tipoDocumento: string; urlArchivoFirmado?: string }): Observable<Document> {
    return this.http.post<Document>(this.apiUrl, data);
  }

  eliminarDocumento(idDocumento: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idDocumento}`);
  }

  tieneConsentimiento(idUsuario: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/consentimiento/${idUsuario}`);
  }

  obtenerMetricas(): Observable<DocumentMetric> {
    return new Observable(observer => {
      this.obtenerDocumentos().subscribe({
        next: (documentos) => {
          const list = Array.isArray(documentos) ? documentos : [];
          const metricas: DocumentMetric = {
            activos: list.filter(d => d.estado === 'VIGENTE').length,
            nuevosEsteMes: list.filter(d => {
              const fecha = new Date(d.fechaFirma);
              const ahora = new Date();
              return fecha.getMonth() === ahora.getMonth() &&
                fecha.getFullYear() === ahora.getFullYear() &&
                d.estado === 'VIGENTE';
            }).length,
            porVencer: 0,
            vencidos: list.filter(d => d.estado === 'VENCIDO').length,
            categoriasOrganizadas: new Set(list.map(d => d.tipoDocumento)).size
          };
          observer.next(metricas);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  obtenerTiposDocumento(): Observable<string[]> {
    return new Observable(observer => {
      observer.next(['CONSENTIEMIENTO_INFORMADO', 'CONTRATO', 'EXONERACION']);
      observer.complete();
    });
  }
}