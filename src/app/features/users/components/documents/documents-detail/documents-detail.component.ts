import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
  errorMensaje: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.cargarDocumento(parseInt(id));
      }
    });
  }

  cargarDocumento(id: number): void {
    this.loading = true;
    this.documentService.obtenerDocumentoPorId(id).subscribe({
      next: (data) => {
        this.document = data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMensaje = error.error?.message || 'No se pudo cargar el documento.';
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

  volver(): void {
    this.router.navigate(['/dashboard-admin/users/documents']);
  }

  eliminar(): void {
    if (!this.document) return;

    Swal.fire({
      title: '¿Eliminar documento?',
      text: `¿Estás seguro de que deseas eliminar el documento de "${this.document.nombreUsuario}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
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

  getTipoDocumentoLabel(tipo: string): string {
    return getTipoDocumentoLabel(tipo);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'VIGENTE': return 'estado-activo';
      case 'VENCIDO': return 'estado-vencido';
      default: return 'estado-default';
    }
  }

  getEstadoLabel(estado: string): string {
    return getEstadoDocumentoLabel(estado);
  }

  formatearFecha(fecha: string): string {
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