// src/app/features/users/components/documents/documents-list/documents-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DocumentService, FiltrosDocumentos } from '../../../../../core/services/document.service';
import { Document, DocumentMetric, getTipoDocumentoLabel, getEstadoDocumentoLabel } from '../../../../../core/models/document';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-documents-list',
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.scss']
})
export class DocumentsListComponent implements OnInit {
  documentos: Document[] = [];
  metricas: DocumentMetric | null = null;
  tiposDocumento: string[] = [];
  loading: boolean = false;
  errorMensaje: string = '';

  numeroPagina: number = 0;
  tamanioPagina: number = 5;
  totalElementos: number = 0;
  totalPaginas: number = 0;

  searchTerm: string = '';
  filtroTipo: string = 'todos';
  filtroEstado: string = 'todos';

  constructor(
    private documentService: DocumentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTiposDocumento();
    this.cargarMetricas();
    this.cargarDocumentos();
  }

  cargarTiposDocumento(): void {
    this.documentService.obtenerTiposDocumento().subscribe({
      next: (data) => this.tiposDocumento = data,
      error: () => this.tiposDocumento = ['CONSENTIEMIENTO_INFORMADO', 'CONTRATO', 'EXONERACION']
    });
  }

  cargarMetricas(): void {
    this.documentService.obtenerMetricas().subscribe({
      next: (data) => this.metricas = data,
      error: () => {
        this.metricas = {
          activos: 12,
          nuevosEsteMes: 2,
          porVencer: 3,
          vencidos: 2,
          categoriasOrganizadas: 3
        };
      }
    });
  }

  cargarDocumentos(): void {
    this.loading = true;
    this.errorMensaje = '';

    const filtros: FiltrosDocumentos = {
      pagina: this.numeroPagina,
      tamanio: this.tamanioPagina,
      search: this.searchTerm.trim() || undefined,
      tipoDocumento: this.filtroTipo !== 'todos' ? this.filtroTipo : undefined,
      estado: this.filtroEstado !== 'todos' ? this.filtroEstado.toUpperCase() : undefined
    };

    this.documentService.obtenerDocumentosPaginados(filtros).subscribe({
      next: (response) => {
        this.documentos = response.content || [];
        this.totalElementos = response.totalElements || 0;
        this.totalPaginas = response.totalPages || 0;
        this.numeroPagina = response.number || 0;
        this.tamanioPagina = response.size || 5;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar documentos paginados:', error);
        this.errorMensaje = 'No se pudieron cargar los documentos del servidor.';
        this.documentos = [];
        this.totalElementos = 0;
        this.totalPaginas = 0;
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.numeroPagina = 0;
    this.cargarDocumentos();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroTipo = 'todos';
    this.filtroEstado = 'todos';
    this.numeroPagina = 0;
    this.cargarDocumentos();
  }

  irPagina(pZeroBased: number): void {
    if (pZeroBased !== this.numeroPagina && pZeroBased >= 0 && pZeroBased < this.totalPaginas) {
      this.numeroPagina = pZeroBased;
      this.cargarDocumentos();
    }
  }

  paginaAnterior(): void {
    if (this.numeroPagina > 0) {
      this.irPagina(this.numeroPagina - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.numeroPagina < this.totalPaginas - 1) {
      this.irPagina(this.numeroPagina + 1);
    }
  }

  get paginasVisibles(): number[] {
    const maxVisibles = 4;
    let inicio = Math.max(0, this.numeroPagina - 1);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPaginas) {
      fin = this.totalPaginas;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  get inicio(): number {
    return this.totalElementos === 0 ? 0 : this.numeroPagina * this.tamanioPagina + 1;
  }

  get fin(): number {
    return Math.min((this.numeroPagina + 1) * this.tamanioPagina, this.totalElementos);
  }

  nuevoDocumento(): void {
    this.router.navigate(['/dashboard-admin/users/documents/new']);
  }

  verDocumento(id: number): void {
    this.router.navigate(['/dashboard-admin/users/documents/detail', id]);
  }

  eliminarDocumento(documento: Document): void {
    Swal.fire({
      title: '¿Eliminar documento?',
      text: `¿Estás seguro de que deseas eliminar el documento de "${documento.nombreUsuario}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af'
    }).then((result) => {
      if (result.isConfirmed) {
        this.documentService.eliminarDocumento(documento.idDocumento).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Documento eliminado',
              text: 'El documento ha sido eliminado correctamente.',
              confirmButtonColor: '#0f1c3f'
            });
            this.cargarDocumentos();
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