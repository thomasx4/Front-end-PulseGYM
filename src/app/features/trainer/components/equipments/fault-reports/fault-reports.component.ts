import { Component, OnInit } from '@angular/core';
import { EquipmentService } from '../../../../../core/services/equipment.service';
import { ReporteFallaItem, FiltrosFalla, EstadoReporteFalla, UrgenciaFalla } from '../../../models/trainer.model';
import { RegistrarMantenimientoPayload } from '../../../models/trainer.model';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-fault-reports',
  templateUrl: './fault-reports.component.html',
  styleUrls: ['./fault-reports.component.scss']
})
export class FaultReportsComponent implements OnInit {

  reportes: (ReporteFallaItem & { selected?: boolean })[] = [];
  reportesFiltrados: (ReporteFallaItem & { selected?: boolean })[] = [];
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

  nuevoMantenimiento: RegistrarMantenimientoPayload = {
    idEquipo: 0,
    fechaServicio: new Date().toISOString().slice(0, 10),
    tipo: 'CORRECTIVO',
    descripcion: '',
    costo: 0,
    tecnicoResponsable: '',
    proximoMantenimiento: ''
  };

  // Control de menú lateral (Hamburguesa)
  isSidebarOpen: boolean = false;

  constructor(private equipmentService: EquipmentService) { }

  ngOnInit(): void {
    this.cargarReportes();
  }

  // ==========================================
  // MÉTODOS DE MENÚ LATERAL (HAMBURGUESA)
  // ==========================================
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  cargarReportes(): void {
    this.cargando = true;

    this.equipmentService.obtenerReportesFalla(this.filtros).subscribe({
      next: (res) => {
        const lista = res?.data || [];
        this.reportes = lista.map(r => ({ ...r, selected: false }));
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

  get reportesSeleccionadosCount(): number {
    return this.reportes.filter(r => r.selected).length;
  }

  get todosSeleccionadosPagina(): boolean {
    if (this.reportesPaginados.length === 0) return false;
    return this.reportesPaginados.every(r => r.selected);
  }

  toggleSeleccionarTodos(event: any): void {
    const checked = event.target.checked;
    this.reportesPaginados.forEach(r => r.selected = checked);
  }

  limpiarSeleccionReportes(): void {
    this.reportes.forEach(r => r.selected = false);
  }

  async cambiarEstadoEnLote(nuevoEstado: EstadoReporteFalla): Promise<void> {
    const seleccionados = this.reportes.filter(r => r.selected);
    if (seleccionados.length === 0) return;

    const result = await Swal.fire({
      title: '¿Actualizar reportes en lote?',
      text: `Estás a punto de cambiar el estado de ${seleccionados.length} reporte(s) a ${nuevoEstado}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.cargando = true;
      const peticiones = seleccionados.map(r => 
        this.equipmentService.actualizarEstadoReporte(r.idEquipo, nuevoEstado)
      );

      forkJoin(peticiones).subscribe({
        next: () => {
          this.cargando = false;
          Swal.fire('¡Actualizado!', 'Los reportes seleccionados han cambiado de estado correctamente.', 'success');
          this.cargarReportes();
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error al actualizar reportes en lote:', err);
          Swal.fire('Error', 'No se pudieron actualizar algunos de los reportes seleccionados.', 'error');
          this.cargarReportes();
        }
      });
    }
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
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor ingrese el técnico responsable y la descripción del trabajo.',
        confirmButtonColor: '#1e293b'
      });
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
      next: () => {
        if (this.equipoSeleccionadoFalla) {
          const idEquipoProcesado = this.equipoSeleccionadoFalla.idEquipo;

          this.equipmentService.actualizarEstadoReporte(idEquipoProcesado, 'RESUELTO').subscribe({
            next: () => {
              this.reportes = this.reportes.filter(r => r.idEquipo !== idEquipoProcesado);
              this.aplicarBusquedaLocal();

              this.guardandoMantenimiento = false;
              this.mostrarModalMantenimiento = false;
              this.equipoSeleccionadoFalla = null;

              Swal.fire({
                icon: 'success',
                title: '¡Mantenimiento registrado!',
                text: 'La falla ha sido resuelta y el equipo fue removido de la lista de incidencias.',
                timer: 2500,
                showConfirmButton: false
              });
            },
            error: () => {
              this.guardandoMantenimiento = false;
              this.mostrarModalMantenimiento = false;
              this.cargarReportes();
            }
          });
        } else {
          this.guardandoMantenimiento = false;
          this.mostrarModalMantenimiento = false;
          this.cargarReportes();
        }
      },
      error: (err) => {
        const mensajeError = err?.error?.message || err?.error || 'Ocurrió un error al guardar el registro.';
        this.guardandoMantenimiento = false;
        Swal.fire('Error', typeof mensajeError === 'string' ? mensajeError : 'Error al guardar.', 'error');
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
      error: () => {
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

  get reportesPaginados(): (ReporteFallaItem & { selected?: boolean })[] {
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