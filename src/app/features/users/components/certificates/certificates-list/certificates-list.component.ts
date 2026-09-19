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
class CertificatesListComponent implements OnInit {
  certificacionesOriginales: Certificate[] = []; 
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

  // ⭐ Propiedades para selección múltiple
  idsSeleccionados: Set<number> = new Set<number>();

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
    this.limpiarSeleccion();
    
    this.certificateService.obtenerCertificacionesPaginadas({ pagina: 0, tamanio: 1000 }).subscribe({
      next: (response: any) => {
        let arrayCompleto: Certificate[] = [];

        if (Array.isArray(response)) {
          arrayCompleto = response;
        } else {
          const listData = response.data || response.contenido || response.content || [];
          arrayCompleto = Array.isArray(listData) ? listData : [];
        }

        this.certificacionesOriginales = arrayCompleto;
        this.aplicarFiltrosYPaginacion();
        this.loading = false;
      },
      error: () => {
        this.certificacionesOriginales = [];
        this.certificaciones = [];
        this.totalElementos = 0;
        this.totalPaginas = 0;
        this.loading = false;
      }
    });
  }

  isSeleccionado(id: number): boolean {
    return this.idsSeleccionados.has(id);
  }

  toggleSeleccionItem(id: number): void {
    if (this.idsSeleccionados.has(id)) {
      this.idsSeleccionados.delete(id);
    } else {
      this.idsSeleccionados.add(id);
    }
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.certificaciones.forEach(item => {
        if (item.idCertificacion !== undefined && item.idCertificacion !== null) {
          this.idsSeleccionados.add(item.idCertificacion);
        }
      });
    } else {
      this.limpiarSeleccion();
    }
  }

  limpiarSeleccion(): void {
    this.idsSeleccionados.clear();
  }

  get isAllSelected(): boolean {
    if (this.certificaciones.length === 0) return false;
    return this.certificaciones.every(item => item.idCertificacion !== undefined && item.idCertificacion !== null && this.idsSeleccionados.has(item.idCertificacion));
  }

  get isSomeSelected(): boolean {
    if (this.certificaciones.length === 0) return false;
    const count = this.certificaciones.filter(item => item.idCertificacion !== undefined && item.idCertificacion !== null && this.idsSeleccionados.has(item.idCertificacion)).length;
    return count > 0 && !this.isAllSelected;
  }

  eliminarSeleccionados(): void {
    const ids: number[] = Array.from(this.idsSeleccionados);
    if (ids.length === 0) return;

    Swal.fire({
      title: '¿Eliminar certificaciones?',
      text: `¿Estás seguro de que deseas eliminar las ${ids.length} certificación(es) seleccionada(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af'
    }).then((result) => {
      if (result.isConfirmed) {
        let completados = 0;
        ids.forEach(id => {
          this.certificateService.eliminarCertificacion(id).subscribe({
            next: () => {
              completados++;
              if (completados === ids.length) {
                this.limpiarSeleccion();
                this.cargarDatos();
                this.cargarMetricas();
                Swal.fire({
                  icon: 'success',
                  title: 'Certificaciones eliminadas',
                  text: 'Las certificaciones seleccionadas han sido eliminadas correctamente.',
                  confirmButtonColor: '#0f1c3f'
                });
              }
            },
            error: (err) => {
              console.error(`Error al eliminar certificación ID ${id}:`, err);
            }
          });
        });
      }
    });
  }

  aplicarFiltrosYPaginacion(): void {
    const searchVal = this.filtros.search?.trim().toLowerCase() || '';

    let listaFiltrada = this.certificacionesOriginales.filter(c => {
      const matchSearch = !searchVal || 
        c.nombreCertificacion?.toLowerCase().includes(searchVal) ||
        c.nombreEntrenador?.toLowerCase().includes(searchVal);
      return matchSearch;
    });

    this.totalElementos = listaFiltrada.length;
    this.totalPaginas = Math.ceil(this.totalElementos / this.itemsPorPagina) || 1;

    if (this.paginaActual >= this.totalPaginas) {
      this.paginaActual = Math.max(0, this.totalPaginas - 1);
    }

    const inicioSlice = this.paginaActual * this.itemsPorPagina;
    this.certificaciones = listaFiltrada.slice(inicioSlice, inicioSlice + this.itemsPorPagina);
  }

  aplicarFiltros(): void {
    this.paginaActual = 0;
    this.aplicarFiltrosYPaginacion();
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
      this.aplicarFiltrosYPaginacion();
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
    this.paginaActual = 0;
    this.aplicarFiltrosYPaginacion();
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

export { CertificatesListComponent };