import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { HistorialAccesoItem, HistorialAccesoResponse, FiltrosHistorial } from '../../models/attendance.model';
import { FileDownloadService } from '../../../../core/services/file-download.service';

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

  mostrarModalExport: boolean = false;
  tipoReporteExport: 'SEMANAL' | 'MENSUAL' = 'SEMANAL';
  fechaReferenciaExport: string = new Date().toISOString().slice(0, 10);

  constructor(
    private attendanceService: AttendanceService,
    private fileDownloadService: FileDownloadService
  ) { }

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const params: FiltrosHistorial = {
      ...this.filtrosActivos,
      page: this.currentPage,
      size: this.pageSize
    };

    this.attendanceService.obtenerHistorialAccesos(params).subscribe({
      next: (response: HistorialAccesoResponse) => {
        let registros = response.content || [];

        const busquedaTexto = this.filtrosActivos.nombreUsuario?.trim().toLowerCase();

        if (busquedaTexto && isNaN(Number(busquedaTexto))) {
          registros = registros.filter(item =>
            item.nombreUsuario?.toLowerCase().includes(busquedaTexto)
          );
        }

        this.logs = registros;
        this.totalElements = response.totalElements ?? 0;
        this.totalPages = response.totalPages ?? 1;

        if (response.currentPage !== undefined) {
          this.currentPage = response.currentPage;
        }

        this.calcularKpis();
        this.isLoading = false;
      },
      error: (err: any) => {
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
    this.filtrosActivos = { ...filtrosEmitidos };
    this.currentPage = 0;
    this.cargarHistorial();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPages) {
      this.currentPage = nuevaPagina;
      this.cargarHistorial();
    }
  }


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
      next: async (blob: Blob) => {
        const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
        const nombreArchivo = `Reporte_Tendencia_${this.tipoReporteExport}_${this.fechaReferenciaExport}.${ext}`;

        await this.fileDownloadService.saveAndShare(blob, nombreArchivo, {
          title: 'Reporte de Tendencia Pulse Gym',
          dialogTitle: 'Abrir o compartir reporte'
        });

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