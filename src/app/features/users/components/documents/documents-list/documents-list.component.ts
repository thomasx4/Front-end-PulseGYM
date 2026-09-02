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

    const tipoFiltro = this.filtroTipo !== 'todos' ? this.filtroTipo : undefined;
    const estadoFiltro = this.filtroEstado !== 'todos' ? this.filtroEstado.toUpperCase() : undefined;
    const busquedaFiltro = this.searchTerm.trim();

    const filtros: FiltrosDocumentos = {
      pagina: this.numeroPagina,
      tamanio: this.tamanioPagina,
      search: busquedaFiltro || undefined,
      tipoDocumento: tipoFiltro,
      estado: estadoFiltro
    };

    this.documentService.obtenerDocumentosPaginados(filtros).subscribe({
      next: (response: any) => {
        let arrayCompleto: Document[] = [];

        if (Array.isArray(response)) {
          arrayCompleto = response;
        } else {
          const listData = response.data || response.contenido || response.content || [];
          arrayCompleto = Array.isArray(listData) ? listData : [];
        }

        // Filtrado fallback local
        let listaFiltrada = arrayCompleto;

        if (busquedaFiltro) {
          const query = busquedaFiltro.toLowerCase();
          listaFiltrada = listaFiltrada.filter(d =>
            (d.nombreUsuario && d.nombreUsuario.toLowerCase().includes(query)) ||
            (d.tipoDocumento && getTipoDocumentoLabel(d.tipoDocumento).toLowerCase().includes(query))
          );
        }

        if (tipoFiltro) {
          listaFiltrada = listaFiltrada.filter(d => d.tipoDocumento === tipoFiltro);
        }

        if (estadoFiltro) {
          listaFiltrada = listaFiltrada.filter(d => d.estado && d.estado.toUpperCase() === estadoFiltro);
        }

        this.totalElementos = response.totalElementos ?? response.totalElements ?? listaFiltrada.length;

        if (Array.isArray(response) || listaFiltrada.length !== arrayCompleto.length) {
          this.totalElementos = listaFiltrada.length;
          this.totalPaginas = Math.ceil(this.totalElementos / this.tamanioPagina) || 1;
          const inicioSlice = this.numeroPagina * this.tamanioPagina;
          const finSlice = inicioSlice + this.tamanioPagina;
          this.documentos = listaFiltrada.slice(inicioSlice, finSlice);
        } else {
          this.documentos = listaFiltrada;
          this.totalPaginas = response.totalPaginas ?? response.totalPages ?? 1;
          this.numeroPagina = response.numeroPagina ?? response.currentPage ?? response.number ?? 0;
          this.tamanioPagina = response.tamanioPagina ?? response.size ?? 5;
        }

        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar documentos:', error);
        // Fallback a datos de ejemplo si falla la API
        let listaEjemplo = this.getDocumentosEjemplo();
        if (busquedaFiltro) {
          const q = busquedaFiltro.toLowerCase();
          listaEjemplo = listaEjemplo.filter(d => d.nombreUsuario.toLowerCase().includes(q));
        }
        if (tipoFiltro) {
          listaEjemplo = listaEjemplo.filter(d => d.tipoDocumento === tipoFiltro);
        }
        if (estadoFiltro) {
          listaEjemplo = listaEjemplo.filter(d => d.estado === estadoFiltro);
        }

        this.totalElementos = listaEjemplo.length;
        this.totalPaginas = Math.ceil(this.totalElementos / this.tamanioPagina) || 1;
        const inicioSlice = this.numeroPagina * this.tamanioPagina;
        this.documentos = listaEjemplo.slice(inicioSlice, inicioSlice + this.tamanioPagina);
        this.loading = false;
      }
    });
  }

  private getDocumentosEjemplo(): Document[] {
    return [
      { idDocumento: 1, idUsuario: 1, nombreUsuario: 'Juan Pérez', tipoDocumento: 'CONTRATO', fechaFirma: '2024-05-12T10:00:00', urlArchivoFirmado: '', estado: 'VIGENTE' },
      { idDocumento: 2, idUsuario: 2, nombreUsuario: 'María Gómez', tipoDocumento: 'CONSENTIEMIENTO_INFORMADO', fechaFirma: '2024-05-05T10:00:00', urlArchivoFirmado: '', estado: 'VIGENTE' },
      { idDocumento: 3, idUsuario: 3, nombreUsuario: 'Carlos López', tipoDocumento: 'EXONERACION', fechaFirma: '2024-04-20T10:00:00', urlArchivoFirmado: '', estado: 'VIGENTE' },
      { idDocumento: 4, idUsuario: 4, nombreUsuario: 'Ana Martínez', tipoDocumento: 'CONTRATO', fechaFirma: '2024-03-15T10:00:00', urlArchivoFirmado: '', estado: 'VIGENTE' },
      { idDocumento: 5, idUsuario: 5, nombreUsuario: 'Pedro Ramírez', tipoDocumento: 'CONSENTIEMIENTO_INFORMADO', fechaFirma: '2024-02-10T10:00:00', urlArchivoFirmado: '', estado: 'VENCIDO' }
    ];
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