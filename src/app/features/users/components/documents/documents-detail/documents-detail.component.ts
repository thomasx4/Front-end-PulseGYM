import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentService } from '../../../../../core/services/document.service';
import { Document, getTipoDocumentoLabel, getEstadoDocumentoLabel } from '../../../../../core/models/document';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-documents-detail',
  templateUrl: './documents-detail.component.html',
  styleUrls: ['./documents-detail.component.scss']
})
export class DocumentsDetailComponent implements OnInit {
  document: Document | null = null;
  loading: boolean = false;
  downloading: boolean = false;
  errorMensaje: string = '';
  pdfUrlSafe: SafeResourceUrl | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.cargarDocumento(parseInt(id, 10));
      }
    });
  }

  cargarDocumento(idDocumento: number): void {
    this.loading = true;
    this.errorMensaje = '';

    this.documentService.obtenerDocumentoPorId(idDocumento).subscribe({
      next: (data) => {
        this.document = data;

        if (this.document && this.document.urlArchivoFirmado) {
          let rawUrl = this.document.urlArchivoFirmado;

          if (rawUrl.includes('cloudinary.com')) {
            if (!rawUrl.toLowerCase().endsWith('.pdf')) {
              rawUrl = `${rawUrl}.pdf`;
            }
          }

          const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
          this.pdfUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(googleViewerUrl);
        } else {
          this.pdfUrlSafe = null;
        }

        this.loading = false;
      },
      error: (error) => {
        this.errorMensaje = error.message || error.error?.message || 'No se pudo cargar la información del documento.';
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMensaje,
          confirmButtonColor: '#0f1c3f'
        });
      }
    });
  }

  async descargarDocumento(): Promise<void> {
    if (!this.document?.urlArchivoFirmado) return;

    this.downloading = true;
    let url = this.document.urlArchivoFirmado;

    try {
      if (url.includes('cloudinary.com')) {
        const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.setAttribute('download', `${this.document.tipoDocumento}_${this.document.nombreUsuario.replace(/\s+/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const fileName = `${this.document.tipoDocumento}_${this.document.nombreUsuario.replace(/\s+/g, '_')}.pdf`;
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch {
      window.open(url, '_blank');
    } finally {
      this.downloading = false;
    }
  }

  volver(): void {
    this.router.navigate(['/dashboard-admin/users/documents']);
  }

  eliminar(): void {
    if (!this.document) return;

    Swal.fire({
      title: '¿Eliminar documento?',
      text: `¿Estás seguro de que deseas eliminar el documento de "${this.document.nombreUsuario}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af'
    }).then((result) => {
      if (result.isConfirmed) {
        this.documentService.eliminarDocumento(this.document!.idDocumento).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Documento eliminado',
              text: 'El documento ha sido eliminado correctamente.',
              confirmButtonColor: '#0f1c3f'
            });
            this.volver();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo eliminar el documento.',
              confirmButtonColor: '#0f1c3f'
            });
          }
        });
      }
    });
  }

  getTipoDocumentoLabel(tipo?: string): string {
    return tipo ? getTipoDocumentoLabel(tipo) : 'Documento';
  }

  getEstadoClass(estado?: string): string {
    switch (estado?.toUpperCase()) {
      case 'VIGENTE':
      case 'ACTIVO':
        return 'estado-activo';
      case 'VENCIDO':
        return 'estado-vencido';
      default:
        return 'estado-default';
    }
  }

  getEstadoLabel(estado?: string): string {
    return estado ? getEstadoDocumentoLabel(estado) : 'Desconocido';
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return 'N/D';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'N/D';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}