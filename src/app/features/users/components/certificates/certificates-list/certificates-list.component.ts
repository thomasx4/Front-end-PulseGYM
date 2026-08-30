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
  certificacionesFiltradas: Certificate[] = [];
  metricas: CertificateMetric | null = null;
  loading: boolean = false;

  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  totalElementos: number = 0;

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
  }

  cargarDatos(): void {
    this.loading = true;
    this.certificateService.obtenerTodasLasCertificaciones().subscribe({
      next: (data) => {
        this.certificaciones = data;
        this.calcularMetricas(data);
        this.aplicarFiltros();
        this.loading = false;
      },
      error: () => {
        this.certificaciones = [];
        this.metricas = { totalCertificaciones: 0, entrenadoresCertificados: 0 };
        this.aplicarFiltros();
        this.loading = false;
      }
    });
  }

  private calcularMetricas(data: Certificate[]): void {
    this.metricas = {
      totalCertificaciones: data.length,
      entrenadoresCertificados: new Set(data.map(c => c.idEntrenador)).size
    };
  }

  aplicarFiltros(): void {
    let result = [...this.certificaciones];

    if (this.filtros.search?.trim()) {
      const term = this.filtros.search.toLowerCase().trim();
      result = result.filter(c =>
        c.nombreCertificacion?.toLowerCase().includes(term) ||
        c.nombreEntrenador?.toLowerCase().includes(term)
      );
    }

    this.certificacionesFiltradas = result;
    this.totalElementos = result.length;
    this.paginaActual = 1;
  }

  get certificacionesPaginadas(): Certificate[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.certificacionesFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.certificacionesFiltradas.length / this.itemsPorPagina) || 1;
  }

  get paginasVisibles(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get inicio(): number { return (this.paginaActual - 1) * this.itemsPorPagina + 1; }
  get fin(): number { return Math.min(this.paginaActual * this.itemsPorPagina, this.certificacionesFiltradas.length); }

  irPagina(p: number): void { this.paginaActual = p; }
  paginaAnterior(): void { if (this.paginaActual > 1) this.paginaActual--; }
  paginaSiguiente(): void { if (this.paginaActual < this.totalPaginas) this.paginaActual++; }

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