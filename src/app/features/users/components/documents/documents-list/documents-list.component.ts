import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DocumentService } from '../../../../../core/services/document.service';
import { Document, DocumentMetric, DocumentFilter, getTipoDocumentoLabel, getEstadoDocumentoLabel } from '../../../../../core/models/document';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-documents-list',
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.scss']
})
export class DocumentsListComponent implements OnInit {
  documentos: Document[] = [];
  documentosFiltrados: Document[] = [];
  metricas: DocumentMetric | null = null;
  tiposDocumento: string[] = [];
  loading: boolean = false;

  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  totalElementos: number = 0;

  filtros: DocumentFilter = {
    search: '',
    tipoDocumento: 'todos',
    estado: 'todos'
  };

  tipoDocumentoLabels = {
    'CONSENTIEMIENTO_INFORMADO': 'Consentimiento Informado',
    'CONTRATO': 'Contrato',
    'EXONERACION': 'Exoneración'
  };

  estadoLabels = {
    'VIGENTE': 'Vigente',
    'VENCIDO': 'Vencido'
  };

  constructor(
    private documentService: DocumentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.cargarTiposDocumento();
    this.cargarMetricas();
    this.cargarDocumentos();
  }

  cargarTiposDocumento(): void {
    this.documentService.obtenerTiposDocumento().subscribe({
      next: (data) => {
        this.tiposDocumento = data;
      },
      error: () => {
        this.tiposDocumento = ['CONSENTIEMIENTO_INFORMADO', 'CONTRATO', 'EXONERACION'];
      }
    });
  }

  cargarMetricas(): void {
    this.documentService.obtenerMetricas().subscribe({
      next: (data) => {
        this.metricas = data;
      },
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
    this.documentService.obtenerDocumentos(this.filtros).subscribe({
      next: (data) => {
        this.documentos = data;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: () => {
        this.documentos = this.getDocumentosEjemplo();
        this.aplicarFiltros();
        this.loading = false;
      }
    });
  }

  private getDocumentosEjemplo(): Document[] {
    return [
      {
        idDocumento: 1,
        idUsuario: 1,
        nombreUsuario: 'Juan Pérez',
        tipoDocumento: 'CONTRATO',
        fechaFirma: '2024-05-12T10:00:00',
        urlArchivoFirmado: 'https://example.com/contrato1.pdf',
        estado: 'VIGENTE'
      },
      {
        idDocumento: 2,
        idUsuario: 2,
        nombreUsuario: 'María Gómez',
        tipoDocumento: 'CONSENTIEMIENTO_INFORMADO',
        fechaFirma: '2024-05-05T10:00:00',
        urlArchivoFirmado: 'https://example.com/consentimiento2.pdf',
        estado: 'VIGENTE'
      },
      {
        idDocumento: 3,
        idUsuario: 3,
        nombreUsuario: 'Carlos López',
        tipoDocumento: 'EXONERACION',
        fechaFirma: '2024-04-20T10:00:00',
        urlArchivoFirmado: 'https://example.com/exoneracion3.pdf',
        estado: 'VIGENTE'
      },
      {
        idDocumento: 4,
        idUsuario: 4,
        nombreUsuario: 'Ana Martínez',
        tipoDocumento: 'CONTRATO',
        fechaFirma: '2024-03-15T10:00:00',
        urlArchivoFirmado: 'https://example.com/contrato4.pdf',
        estado: 'VIGENTE'
      },
      {
        idDocumento: 5,
        idUsuario: 5,
        nombreUsuario: 'Pedro Ramírez',
        tipoDocumento: 'CONSENTIEMIENTO_INFORMADO',
        fechaFirma: '2024-02-10T10:00:00',
        urlArchivoFirmado: 'https://example.com/consentimiento5.pdf',
        estado: 'VENCIDO'
      }
    ];
  }

  aplicarFiltros(): void {
    let filtrados = [...this.documentos];

    if (this.filtros.search && this.filtros.search.trim() !== '') {
      const term = this.filtros.search.toLowerCase().trim();
      filtrados = filtrados.filter(d =>
        d.nombreUsuario.toLowerCase().includes(term) ||
        getTipoDocumentoLabel(d.tipoDocumento).toLowerCase().includes(term)
      );
    }

    if (this.filtros.tipoDocumento && this.filtros.tipoDocumento !== 'todos') {
      filtrados = filtrados.filter(d => d.tipoDocumento === this.filtros.tipoDocumento);
    }

    if (this.filtros.estado && this.filtros.estado !== 'todos') {
      filtrados = filtrados.filter(d => d.estado === this.filtros.estado);
    }

    this.documentosFiltrados = filtrados;
    this.totalElementos = filtrados.length;
    this.paginaActual = 1;
  }

  get documentosPaginados(): Document[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.documentosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.documentosFiltrados.length / this.itemsPorPagina) || 1;
  }

  get paginasVisibles(): number[] {
    const total = this.totalPaginas;
    const maxVisible = 5;
    let start = Math.max(1, this.paginaActual - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get inicio(): number {
    return (this.paginaActual - 1) * this.itemsPorPagina + 1;
  }

  get fin(): number {
    return Math.min(this.paginaActual * this.itemsPorPagina, this.documentosFiltrados.length);
  }

  irPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  limpiarFiltros(): void {
    this.filtros = { search: '', tipoDocumento: 'todos', estado: 'todos' };
    this.aplicarFiltros();
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
      text: `¿Estás seguro de que deseas eliminar el documento de "${documento.nombreUsuario}"? Esta acción no se puede deshacer.`,
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