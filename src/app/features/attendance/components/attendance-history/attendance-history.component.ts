import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { HistorialAccesoItem, HistorialAccesoResponse, FiltrosHistorial } from '../../models/attendance.model';

@Component({
  selector: 'app-attendance-history',
  templateUrl: './attendance-history.component.html',
  styleUrl: './attendance-history.component.scss'
})
export class AttendanceHistoryComponent implements OnInit {

  logs: HistorialAccesoItem[] = [];
  isLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;

  totalElements: number = 0;
  totalExitosos: number = 0;
  totalFallidos: number = 0;
  tasaExito: number = 0;

  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;

  filtrosActivos: FiltrosHistorial = {
    page: 0,
    size: 10
  };

  // --- ESTADOS PARA EL MODAL DE EXPORTACIÓN ---
  mostrarModalExport: boolean = false;
  tipoReporteExport: 'SEMANAL' | 'MENSUAL' = 'SEMANAL';
  fechaReferenciaExport: string = new Date().toISOString().slice(0, 10);

  constructor(private attendanceService: AttendanceService) { }

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(filtros: FiltrosHistorial = {}): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.filtrosActivos = {
      ...this.filtrosActivos,
      ...filtros,
      page: this.currentPage,
      size: this.pageSize
    };

    this.attendanceService.obtenerHistorialAccesos(this.filtrosActivos).subscribe({
      next: (response: HistorialAccesoResponse) => {
        let datos: HistorialAccesoItem[] = response.content || [];

        if (this.filtrosActivos.nombreUsuario && this.filtrosActivos.nombreUsuario.trim() !== '') {
          const busqueda = this.filtrosActivos.nombreUsuario.trim().toLowerCase();

          datos = datos.filter((item: HistorialAccesoItem) => {
            const itemAny = item as any;
            const nombreDirecto = item.nombreUsuario || itemAny.nombre || itemAny.usuario || itemAny.usuarioNombre || '';
            const nombreAnidado = itemAny.usuario?.nombre || itemAny.usuario?.nombreCompleto || '';
            const textoCompleto = `${nombreDirecto} ${nombreAnidado}`.toLowerCase();

            return textoCompleto.includes(busqueda);
          });
        }

        if (this.filtrosActivos.fechaDesde) {
          const desde = new Date(`${this.filtrosActivos.fechaDesde}T00:00:00`);
          datos = datos.filter(item => new Date(item.fechaHora) >= desde);
        }

        if (this.filtrosActivos.fechaHasta) {
          const hasta = new Date(`${this.filtrosActivos.fechaHasta}T23:59:59`);
          datos = datos.filter(item => new Date(item.fechaHora) <= hasta);
        }

        if (this.filtrosActivos.tipoAcceso) {
          datos = datos.filter(item =>
            item.tipoAcceso?.toUpperCase() === this.filtrosActivos.tipoAcceso?.toUpperCase()
          );
        }

        if (this.filtrosActivos.resultado) {
          datos = datos.filter(item =>
            item.resultado?.toUpperCase() === this.filtrosActivos.resultado?.toUpperCase()
          );
        }

        this.logs = datos;

        const seAplicoFiltroLocal = !!(
          this.filtrosActivos.nombreUsuario ||
          this.filtrosActivos.fechaDesde ||
          this.filtrosActivos.fechaHasta ||
          this.filtrosActivos.tipoAcceso ||
          this.filtrosActivos.resultado
        );

        this.totalElements = seAplicoFiltroLocal ? datos.length : (response.totalElements || datos.length);
        this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;

        if (this.currentPage >= this.totalPages) {
          this.currentPage = 0;
        }

        this.calcularKpis();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar historial de accesos:', err);
        this.errorMessage = 'No se pudo obtener el historial de accesos. Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  get paginasVisibles(): number[] {
    const maxVisibles = 4;
    let inicio = Math.max(0, this.currentPage - 1);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPages) {
      fin = this.totalPages;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  get mostrarUltimaPagina(): boolean {
    const paginas = this.paginasVisibles;
    if (paginas.length === 0) return false;
    return paginas[paginas.length - 1] < this.totalPages - 1;
  }

  get esUltimaPagina(): boolean {
    return this.currentPage >= this.totalPages - 1;
  }

  obtenerRangoInicio(): number {
    return this.totalElements === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  obtenerRangoFin(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  irAPagina(p: number): void {
    if (p !== this.currentPage && p >= 0 && p < this.totalPages) {
      this.currentPage = p;
      this.cargarHistorial();
    }
  }

  paginaSiguiente(): void {
    if (!this.esUltimaPagina) {
      this.irAPagina(this.currentPage + 1);
    }
  }

  paginaAnterior(): void {
    if (this.currentPage > 0) {
      this.irAPagina(this.currentPage - 1);
    }
  }

  private calcularKpis(): void {
    this.totalExitosos = this.logs.filter(log => log.resultado === 'EXITOSO').length;
    this.totalFallidos = this.logs.filter(log => log.resultado !== 'EXITOSO').length;

    if (this.logs.length > 0) {
      this.tasaExito = Math.round((this.totalExitosos / this.logs.length) * 100);
    } else {
      this.tasaExito = 0;
    }
  }

  onFiltrar(filtrosEmitidos: FiltrosHistorial): void {
    this.filtrosActivos = {
      ...filtrosEmitidos
    };

    this.currentPage = 0;
    this.cargarHistorial(this.filtrosActivos);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPages) {
      this.currentPage = nuevaPagina;
      this.cargarHistorial();
    }
  }

  // --- MÉTODOS DEL MODAL DE EXPORTACIÓN ---

  abrirModalExportar(): void {
    this.fechaReferenciaExport = this.filtrosActivos.fechaDesde || new Date().toISOString().slice(0, 10);
    this.mostrarModalExport = true;
  }

  cerrarModalExportar(): void {
    if (!this.isExporting) {
      this.mostrarModalExport = false;
    }
  }

  exportarTendencia(formato: 'pdf' | 'excel'): void {
    if (!this.fechaReferenciaExport) return;

    this.isExporting = true;

    const peticion = formato === 'pdf'
      ? this.attendanceService.exportarTendenciaPdf(this.tipoReporteExport, this.fechaReferenciaExport)
      : this.attendanceService.exportarTendenciaExcel(this.tipoReporteExport, this.fechaReferenciaExport);

    peticion.subscribe({
      next: (blob: Blob) => {
        const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
        const nombreArchivo = `Reporte_Tendencia_${this.tipoReporteExport}_${this.fechaReferenciaExport}.${ext}`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        a.click();
        window.URL.revokeObjectURL(url);

        this.isExporting = false;
        this.mostrarModalExport = false;
      },
      error: (err) => {
        console.error(`Error al exportar reporte de tendencia (${formato}):`, err);
        this.isExporting = false;
      }
    });
  }
}