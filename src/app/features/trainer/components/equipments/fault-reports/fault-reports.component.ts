import { Component, OnInit } from '@angular/core';
import { EquipmentService } from '../../../../../core/services/equipment.service';
import { ReporteFallaItem, FiltrosFalla, EstadoReporteFalla, UrgenciaFalla } from '../../../models/trainer.model';
import { RegistrarMantenimientoPayload, TipoMantenimiento } from '../../../models/trainer.model';

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

  mostrarModalMantenimiento: boolean = false;
  guardandoMantenimiento: boolean = false;
  equipoSeleccionadoFalla: ReporteFallaItem | null = null;

  // ==========================================
  // Modales de estado
  // ==========================================
  mostrarModalError: boolean = false;
  modalErrorTitulo: string = 'Error';
  modalErrorMensaje: string = '';

  mostrarModalExito: boolean = false;
  modalExitoMensaje: string = '';

  nuevoMantenimiento: RegistrarMantenimientoPayload = {
    idEquipo: 0,
    fechaServicio: new Date().toISOString().slice(0, 10),
    tipo: 'CORRECTIVO',
    descripcion: '',
    costo: 0,
    tecnicoResponsable: '',
    proximoMantenimiento: ''
  };

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

  abrirModalMantenimiento(reporte: ReporteFallaItem): void {
    this.equipoSeleccionadoFalla = reporte;
    this.nuevoMantenimiento = {
      idEquipo: reporte.idEquipo,
      fechaServicio: new Date().toISOString().slice(0, 10),
      tipo: 'CORRECTIVO',
      descripcion: `Atención a falla reportada: ${reporte.descripcionFalla}`,
      costo: 0,
      tecnicoResponsable: '',
      proximoMantenimiento: ''
    };
    this.mostrarModalMantenimiento = true;
  }

  cerrarModalMantenimiento(): void {
    if (!this.guardandoMantenimiento) {
      this.mostrarModalMantenimiento = false;
      this.equipoSeleccionadoFalla = null;
    }
  }

  guardarMantenimiento(): void {
    if (!this.nuevoMantenimiento.tecnicoResponsable.trim() || !this.nuevoMantenimiento.descripcion.trim()) {
      this.mostrarError('Campos incompletos', 'Por favor ingrese el técnico responsable y la descripción del trabajo.');
      return;
    }

    this.guardandoMantenimiento = true;

    const payload: RegistrarMantenimientoPayload = {
      idEquipo: Number(this.nuevoMantenimiento.idEquipo),
      fechaServicio: this.nuevoMantenimiento.fechaServicio,
      tipo: this.nuevoMantenimiento.tipo,
      descripcion: this.nuevoMantenimiento.descripcion.trim(),
      costo: Number(this.nuevoMantenimiento.costo) || 0,
      tecnicoResponsable: this.nuevoMantenimiento.tecnicoResponsable.trim(),
      proximoMantenimiento: this.nuevoMantenimiento.proximoMantenimiento?.trim() || undefined
    };

    this.equipmentService.registrarMantenimiento(payload).subscribe({
      next: (res) => {
        this.guardandoMantenimiento = false;
        this.mostrarModalMantenimiento = false;

        if (this.equipoSeleccionadoFalla) {
          this.cambiarEstado(this.equipoSeleccionadoFalla, 'RESUELTO');
        }

        this.mostrarExito('Mantenimiento registrado correctamente');
        this.cargarReportes();
      },
      error: (err) => {
        console.error('Error HTTP al registrar mantenimiento:', err);
        const mensajeError = err?.error?.message || err?.error || 'Ocurrió un error al guardar el registro de mantenimiento.';
        this.mostrarError('Error al guardar', typeof mensajeError === 'string' ? mensajeError : 'Revisa la consola para más detalles.');
        this.guardandoMantenimiento = false;
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
        this.mostrarError('Error al actualizar', 'No se pudo cambiar el estado del reporte.');
      }
    });
  }

  // ==========================================
  // Modales
  // ==========================================
  mostrarError(titulo: string, mensaje: string): void {
    this.modalErrorTitulo = titulo;
    this.modalErrorMensaje = mensaje;
    this.mostrarModalError = true;
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
  }

  mostrarExito(mensaje: string): void {
    this.modalExitoMensaje = mensaje;
    this.mostrarModalExito = true;
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
  }

  // ==========================================
  // Paginación
  // ==========================================
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