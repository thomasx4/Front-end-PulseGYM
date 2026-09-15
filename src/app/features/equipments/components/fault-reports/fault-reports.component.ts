import { Component, OnInit } from '@angular/core';
import { EquipmentService } from '../../../../core/services/equipment.service';
import { ReporteFallaItem, FiltrosFalla, EstadoReporteFalla, UrgenciaFalla } from '../../models/equipment-fault.model';
import { RegistrarMantenimientoPayload, TipoMantenimiento } from '../../models/maintenance.model';
import Swal from 'sweetalert2';

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
      tipo: 'CORRECTIVO', // Al provenir de una falla, por defecto proponemos CORRECTIVO
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
      next: (res) => {
        console.log('Respuesta del servidor:', res);

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
            error: (err) => {
              console.error('Error al actualizar estado del reporte:', err);
              this.guardandoMantenimiento = false;
              this.mostrarModalMantenimiento = false;
              this.cargarReportes();

              Swal.fire({
                icon: 'warning',
                title: 'Mantenimiento guardado',
                text: 'Se registró el mantenimiento, pero hubo un detalle al actualizar el estado de la falla.',
                confirmButtonColor: '#1e293b'
              });
            }
          });
        } else {
          this.guardandoMantenimiento = false;
          this.mostrarModalMantenimiento = false;
          this.cargarReportes();
        }
      },
      error: (err) => {
        console.error('Error HTTP al registrar mantenimiento:', err);
        const mensajeError = err?.error?.message || err?.error || 'Ocurrió un error al guardar el registro de mantenimiento.';
        this.guardandoMantenimiento = false;

        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: typeof mensajeError === 'string' ? mensajeError : 'Revisa la consola para más detalles.',
          confirmButtonColor: '#ef4444'
        });
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