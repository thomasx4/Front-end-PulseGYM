import { Component, OnInit } from '@angular/core';
import { EquipmentService } from '../../../../../core/services/equipment.service';
import { Equipo, EstadoEquipo, ConsultaEquipoRequest } from '../../../models/trainer.model';

@Component({
  selector: 'app-equipment-list',
  templateUrl: './equipment-list.component.html',
  styleUrls: ['./equipment-list.component.scss']
})
export class EquipmentListComponent implements OnInit {

  equipos: Equipo[] = [];
  equiposPaginados: Equipo[] = [];

  cargando: boolean = false;
  errorMensaje: string = '';

  filtroTexto: string = '';
  filtroEstado: string = '';

  totalEquipos: number = 0;
  totalOperativos: number = 0;
  totalMantenimiento: number = 0;
  totalFueraServicio: number = 0;

  currentPage: number = 1;
  pageSize: number = 8;
  totalPages: number = 1;
  pagesArray: number[] = [];

  mostrarModalDetalle: boolean = false;
  equipoSeleccionado: Equipo | null = null;

  // Control de menú lateral (Hamburguesa)
  isSidebarOpen: boolean = false;

  constructor(
    private equipmentService: EquipmentService
  ) { }

  ngOnInit(): void {
    this.consultarEquipos();
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

  consultarEquipos(): void {
    this.errorMensaje = '';
    this.cargando = true;

    const payload: ConsultaEquipoRequest = {};

    if (this.filtroTexto.trim()) {
      payload.nombre = this.filtroTexto.trim();
    }
    if (this.filtroEstado) {
      payload.estado = this.filtroEstado;
    }

    this.equipmentService.consultarEquipos(payload).subscribe({
      next: (data: Equipo[]) => {
        this.equipos = data || [];
        this.calcularMetricas(this.equipos);
        this.currentPage = 1;
        this.actualizarPaginacion();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al consultar equipos:', err);
        this.errorMensaje = 'No se pudo obtener la lista de equipos.';
        this.equipos = [];
        this.actualizarPaginacion();
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroEstado = '';
    this.consultarEquipos();
  }

  calcularMetricas(lista: Equipo[]): void {
    this.totalEquipos = lista.length;
    this.totalOperativos = lista.filter(e => e.estado === 'OPERATIVO').length;
    this.totalMantenimiento = lista.filter(e => e.estado === 'MANTENIMIENTO').length;
    this.totalFueraServicio = lista.filter(e => e.estado === 'FUERA_DE_SERVICIO').length;
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.ceil(this.equipos.length / this.pageSize) || 1;
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.equiposPaginados = this.equipos.slice(start, end);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPages || pagina === this.currentPage) return;
    this.currentPage = pagina;
    this.actualizarPaginacion();
  }

  formatearEstado(estado: EstadoEquipo): string {
    switch (estado) {
      case 'OPERATIVO': return 'OPERATIVO';
      case 'MANTENIMIENTO': return 'MANTENIMIENTO';
      case 'FUERA_DE_SERVICIO': return 'FUERA DE SERVICIO';
      default: return estado;
    }
  }

  abrirModalDetalle(equipo: Equipo): void {
    this.equipoSeleccionado = equipo;
    this.mostrarModalDetalle = true;
  }
}