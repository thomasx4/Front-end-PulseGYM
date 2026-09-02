import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CertificateService } from '../../../../../core/services/certificate.service';
import { Certificate, CertificateFilter, CertificateMetric } from '../../../../../core/models/certificate';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-certificates-list',
  templateUrl: './certificates-list.component.html',
  styleUrls: ['./certificates-list.component.scss']
})
export class CertificatesListComponent implements OnInit {
  certificaciones: Certificate[] = [];
  metricas: CertificateMetric | null = null;
  loading: boolean = false;

  paginaActual: number = 0;
  itemsPorPagina: number = 5;
  totalElementos: number = 0;
  totalPaginas: number = 0;

  filtros: CertificateFilter = {
    search: '',
    certificacion: 'todos'
  };

  constructor(
    private certificateService: CertificateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.certificateService.obtenerMetricas().subscribe({
      next: (m) => this.metricas = m,
      error: () => this.metricas = { totalCertificaciones: 0, entrenadoresCertificados: 0 }
    });
  }

  cargarDatos(): void {
    this.loading = true;
    const searchVal = this.filtros.search?.trim();

    const params: CertificateFilter = {
      pagina: this.paginaActual,
      tamanio: this.itemsPorPagina,
      search: searchVal || undefined
    };

    this.certificateService.obtenerCertificacionesPaginadas(params).subscribe({
      next: (response: any) => {
        let arrayCompleto: Certificate[] = [];

        if (Array.isArray(response)) {
          arrayCompleto = response;
        } else {
          const listData = response.data || response.contenido || response.content || [];
          arrayCompleto = Array.isArray(listData) ? listData : [];
        }

        let listaFiltrada = arrayCompleto;

        if (searchVal) {
          const query = searchVal.toLowerCase();
          listaFiltrada = listaFiltrada.filter(c =>
            c.nombreCertificacion?.toLowerCase().includes(query) ||
            c.nombreEntrenador?.toLowerCase().includes(query)
          );
        }

        if (Array.isArray(response) || listaFiltrada.length !== arrayCompleto.length) {
          this.totalElementos = listaFiltrada.length;
          this.totalPaginas = Math.ceil(this.totalElementos / this.itemsPorPagina) || 1;
          const inicioSlice = this.paginaActual * this.itemsPorPagina;
          this.certificaciones = listaFiltrada.slice(inicioSlice, inicioSlice + this.itemsPorPagina);
        } else {
          this.certificaciones = listaFiltrada;
          this.totalElementos = response.totalElementos ?? response.totalElements ?? listaFiltrada.length;
          this.totalPaginas = response.totalPaginas ?? response.totalPages ?? 1;
          this.paginaActual = response.numeroPagina ?? response.currentPage ?? response.number ?? 0;
        }

        this.loading = false;
      },
      error: () => {
        this.certificaciones = [];
        this.totalElementos = 0;
        this.totalPaginas = 0;
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 0;
    this.cargarDatos();
  }

  get inicio(): number {
    if (this.totalElementos === 0) return 0;
    return this.paginaActual * this.itemsPorPagina + 1;
  }

  get fin(): number {
    return Math.min((this.paginaActual + 1) * this.itemsPorPagina, this.totalElementos);
  }

  get paginasVisibles(): number[] {
    const maxVisibles = 5;
    let inicio = Math.max(0, this.paginaActual - 2);
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

  irPagina(pZeroBased: number): void {
    if (pZeroBased !== this.paginaActual && pZeroBased >= 0 && pZeroBased < this.totalPaginas) {
      this.paginaActual = pZeroBased;
      this.cargarDatos();
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 0) {
      this.irPagina(this.paginaActual - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas - 1) {
      this.irPagina(this.paginaActual + 1);
    }
  }

  limpiarFiltros(): void {
    this.filtros = { search: '', certificacion: 'todos' };
    this.aplicarFiltros();
  }

  nuevaCertificacion(): void {
    this.router.navigate(['/dashboard-admin/users/certificates/new']);
  }

  verCertificacion(cert: Certificate): void {
    if (cert && cert.idCertificacion) {
      this.router.navigate(['/dashboard-admin/users/certificates/detail', cert.idCertificacion]);
    }
  }

  editarCertificacion(id: number): void {
    this.router.navigate(['/dashboard-admin/users/certificates/edit', id]);
  }

  eliminarCertificacion(cert: Certificate): void {
    Swal.fire({
      title: '¿Eliminar certificación?',
      text: `¿Estás seguro de eliminar "${cert.nombreCertificacion}" de ${cert.nombreEntrenador}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af'
    }).then((r) => {
      if (r.isConfirmed) {
        this.certificateService.eliminarCertificacion(cert.idCertificacion).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La certificación ha sido eliminada correctamente.',
              confirmButtonColor: '#0f1c3f'
            });
            this.cargarDatos();
            this.cargarMetricas();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo eliminar la certificación.',
              confirmButtonColor: '#0f1c3f'
            });
          }
        });
      }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/D';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}