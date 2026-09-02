import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment.prod';
import { Document, DocumentFilter, DocumentMetric } from '../models/document';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/documentos`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los documentos legales vigentes
   * GET /api/v1/usuarios/documentos
   */
  obtenerDocumentos(filtros?: DocumentFilter): Observable<Document[]> {
    let params: any = {};
    if (filtros) {
      if (filtros.search) params.search = filtros.search;
      if (filtros.tipoDocumento) params.tipoDocumento = filtros.tipoDocumento;
      if (filtros.estado) params.estado = filtros.estado;
    }
    return this.http.get<Document[]>(this.apiUrl, { params });
  }

  /**
   * Obtener documentos legales de un socio específico por su idUsuario
   * GET /api/v1/usuarios/documentos/socio/{idUsuario}
   */
  obtenerDocumentosPorSocio(idUsuario: number): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/socio/${idUsuario}`);
  }

  /**
   * Obtener un documento por idDocumento buscando en la lista general
   */
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

  /**
   * Crear un nuevo documento legal
   * POST /api/v1/usuarios/documentos
   */
  crearDocumento(data: { idUsuario: number; tipoDocumento: string; urlArchivoFirmado?: string }): Observable<Document> {
    return this.http.post<Document>(this.apiUrl, data);
  }

  /**
   * Eliminar un documento legal (cambia estado a VENCIDO)
   * DELETE /api/v1/usuarios/documentos/{idDocumento}
   */
  eliminarDocumento(idDocumento: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idDocumento}`);
  }

  /**
   * Verificar si un usuario tiene consentimiento informado vigente
   * GET /api/v1/usuarios/documentos/consentimiento/{idUsuario}
   */
  tieneConsentimiento(idUsuario: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/consentimiento/${idUsuario}`);
  }

  /**
   * Obtener métricas de documentos
   */
  obtenerMetricas(): Observable<DocumentMetric> {
    return new Observable(observer => {
      this.obtenerDocumentos().subscribe({
        next: (documentos) => {
          const metricas: DocumentMetric = {
            activos: documentos.filter(d => d.estado === 'VIGENTE').length,
            nuevosEsteMes: documentos.filter(d => {
              const fecha = new Date(d.fechaFirma);
              const ahora = new Date();
              return fecha.getMonth() === ahora.getMonth() &&
                fecha.getFullYear() === ahora.getFullYear() &&
                d.estado === 'VIGENTE';
            }).length,
            porVencer: 0,
            vencidos: documentos.filter(d => d.estado === 'VENCIDO').length,
            categoriasOrganizadas: new Set(documentos.map(d => d.tipoDocumento)).size
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

  /**
   * Obtener tipos de documento disponibles
   */
  obtenerTiposDocumento(): Observable<string[]> {
    return new Observable(observer => {
      observer.next(['CONSENTIEMIENTO_INFORMADO', 'CONTRATO', 'EXONERACION']);
      observer.complete();
    });
  }
}