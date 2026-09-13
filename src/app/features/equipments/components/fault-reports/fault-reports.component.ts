import { Component, OnInit } from '@angular/core';
import { EquipmentService } from '../../../../core/services/equipment.service';
import { ReporteFallaItem, FiltrosFalla, EstadoReporteFalla, UrgenciaFalla } from '../../models/equipment-fault.model';

@Component({
  selector: 'app-fault-reports',
  templateUrl: './fault-reports.component.html',
  styleUrls: ['./fault-reports.component.scss']
})
export class FaultReportsComponent implements OnInit {

  reportes: ReporteFallaItem[] = [];
  reportesFiltrados: ReporteFallaItem[] = [];
  cargando: boolean = false;
  busquedaTexto: string = '';

  filtros: FiltrosFalla = {
    idEquipo: undefined,
    estado: '',
    urgencia: ''
  };

  mostrarPopoverFiltros: boolean = false;

  paginaActual: number = 1;
  itemsPorPagina: number = 7;

  estadosOpciones: EstadoReporteFalla[] = ['PENDIENTE', 'EN_REVISION', 'EN_REPARACION', 'RESUELTO'];
  urgenciasOpciones: UrgenciaFalla[] = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA', 'NINGUNA'];

  constructor(private equipmentService: EquipmentService) { }

  ngOnInit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.cargando = true;

    this.equipmentService.obtenerReportesFalla(this.filtros).subscribe({
      next: (res) => {
        this.reportes = res?.data || [];
        this.aplicarBusquedaLocal();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al consultar reportes de falla:', err);
        this.reportes = [];
        this.reportesFiltrados = [];
        this.cargando = false;
      }
    });
  }

  togglePopover(): void {
    this.mostrarPopoverFiltros = !this.mostrarPopoverFiltros;
  }

  aplicarFiltros(): void {
    this.mostrarPopoverFiltros = false;
    this.cargarReportes();
  }

  limpiarFiltros(): void {
    this.filtros = { idEquipo: undefined, estado: '', urgencia: '' };
    this.busquedaTexto = '';
    this.mostrarPopoverFiltros = false;
    this.cargarReportes();
  }

  aplicarBusquedaLocal(): void {
    this.paginaActual = 1;
    if (!this.busquedaTexto.trim()) {
      this.reportesFiltrados = [...this.reportes];
      return;
    }

    const q = this.busquedaTexto.toLowerCase().trim();
    this.reportesFiltrados = this.reportes.filter(item =>
      item.nombre.toLowerCase().includes(q) ||
      item.marca.toLowerCase().includes(q) ||
      item.ubicacion.toLowerCase().includes(q) ||
      item.descripcionFalla.toLowerCase().includes(q)
    );
  }

  cambiarEstado(reporte: ReporteFallaItem, nuevoEstado: EstadoReporteFalla): void {
    if (reporte.estadoReporte === nuevoEstado) return;

    const estadoPrevio = reporte.estadoReporte;
    reporte.estadoReporte = nuevoEstado;

    this.equipmentService.actualizarEstadoReporte(reporte.idEquipo, nuevoEstado).subscribe({
      next: (res) => {
        console.log('Estado actualizado correctamente:', res);
      },
      error: (err) => {
        console.error('Error al cambiar el estado del reporte:', err);
        reporte.estadoReporte = estadoPrevio;
      }
    });
  }

  get totalElementos(): number {
    return this.reportesFiltrados.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalElementos / this.itemsPorPagina) || 1;
  }

  get inicio(): number {
    return this.totalElementos === 0 ? 0 : (this.paginaActual - 1) * this.itemsPorPagina;
  }

  get fin(): number {
    return Math.min(this.paginaActual * this.itemsPorPagina, this.totalElementos);
  }

  get paginas(): number[] {
    const arr: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) arr.push(i);
    return arr;
  }

  get reportesPaginados(): ReporteFallaItem[] {
    return this.reportesFiltrados.slice(this.inicio, this.fin);
  }

  irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p;
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }
}