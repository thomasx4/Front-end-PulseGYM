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

  constructor(private attendanceService: AttendanceService) {}

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
        this.logs = response.content || [];
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.currentPage = response.currentPage || 0;

        this.calcularKpis();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el Historial de Accesos: ', err);
        this.errorMessage = 'No se pudo obtener el Historial de Acesos, Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  private calcularKpis(): void {
    this.totalExitosos = this.logs.filter(log => log.resultado === 'EXITOSO').length;
    this.totalFallidos = this.logs.filter(log => log.resultado !== 'EXITOSO').length;

    if (this.logs.length > 0) {
      this.tasaExito = Math.round((this.totalExitosos /this.logs.length) * 100);
    } else {
      this.tasaExito = 0;
    }
  }

  onFiltrar(event: FiltrosHistorial | any): void {
    const filtros: FiltrosHistorial = (event && typeof event === 'object' && !('target' in event)) ? event: {};
    
    this.currentPage = 0;
    this.cargarHistorial(filtros);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPages) {
      this.currentPage = nuevaPagina;
      this.cargarHistorial();
    }
  }

  exportarReporte(): void {
    window.print();
  }
}
