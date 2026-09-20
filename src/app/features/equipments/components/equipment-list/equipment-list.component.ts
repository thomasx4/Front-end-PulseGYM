import { Component, OnInit } from '@angular/core';
import { EquipmentService } from '../../../../core/services/equipment.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { SedeService } from '../../../../core/services/sede.service';
import { Equipo, EstadoEquipo, ConsultaEquipoRequest } from '../../models/equipment.model';
import { Supplier } from '../../../suppliers/models/suppliers.model';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-equipment-list',
  templateUrl: './equipment-list.component.html',
  styleUrls: ['./equipment-list.component.scss']
})
export class EquipmentListComponent implements OnInit {

  equipos: Equipo[] = [];
  equiposPaginados: (Equipo & { selected?: boolean })[] = [];
  sedes: any[] = [];
  proveedores: Supplier[] = [];

  cargando: boolean = false;
  errorMensaje: string = '';

  filtroTexto: string = '';
  filtroEstado: string = '';
  filtroSedeId: number = 0;

  totalEquipos: number = 0;
  totalOperativos: number = 0;
  totalMantenimiento: number = 0;
  totalFueraServicio: number = 0;

  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 1;
  pagesArray: number[] = [];

  mostrarModalRegistro: boolean = false;
  mostrarModalDetalle: boolean = false;
  equipoSeleccionado: Equipo | null = null;

  constructor(
    private equipmentService: EquipmentService,
    private sedeService: SedeService,
    private supplierService: SupplierService
  ) { }

  ngOnInit(): void {
    this.cargarSedes();
    this.consultarEquipos();
    this.cargarProveedores();
  }

  cargarSedes(): void {
    this.sedeService.obtenerSedes().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) this.sedes = res;
        else if (res && Array.isArray(res.data)) this.sedes = res.data;
        else this.sedes = [];
      },
      error: () => this.sedes = []
    });
  }

  consultarEquipos(): void {
    this.errorMensaje = '';

    const payload: ConsultaEquipoRequest = {};

    if (this.filtroTexto.trim()) {
      payload.nombre = this.filtroTexto.trim();
    }
    if (this.filtroEstado) {
      payload.estado = this.filtroEstado;
    }
    if (this.filtroSedeId && Number(this.filtroSedeId) > 0) {
      payload.idSede = Number(this.filtroSedeId);
    }

    this.equipmentService.consultarEquipos(payload).subscribe({
      next: (data: Equipo[]) => {
        this.equipos = (data || []).map(e => ({ ...e, selected: false }));
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
    this.filtroSedeId = 0;
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

  get equiposSeleccionadosCount(): number {
    return this.equipos.filter(e => e.selected).length;
  }

  get todosSeleccionadosPagina(): boolean {
    if (this.equiposPaginados.length === 0) return false;
    return this.equiposPaginados.every(e => e.selected);
  }

  toggleSeleccionarTodos(event: any): void {
    const checked = event.target.checked;
    this.equiposPaginados.forEach(e => e.selected = checked);
  }

  limpiarSeleccionEquipos(): void {
    this.equipos.forEach(e => e.selected = false);
  }

  async cambiarEstadoEnLote(nuevoEstado: EstadoEquipo): Promise<void> {
    const seleccionados = this.equipos.filter(e => e.selected);
    if (seleccionados.length === 0) return;

    const result = await Swal.fire({
      title: '¿Actualizar estado en lote?',
      text: `Estás a punto de cambiar el estado de ${seleccionados.length} equipo(s) a ${this.formatearEstado(nuevoEstado)}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, cambiar todos',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.cargando = true;
      const peticiones = seleccionados.map(e => {
        const id = e.idEquipo || e.id;
        return this.equipmentService.cambiarEstado(id!, nuevoEstado);
      });

      forkJoin(peticiones).subscribe({
        next: () => {
          this.cargando = false;
          Swal.fire('¡Actualizado!', 'Los equipos seleccionados han cambiado de estado correctamente.', 'success');
          this.consultarEquipos();
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error al actualizar equipos en lote:', err);
          Swal.fire('Error', 'No se pudieron actualizar algunos de los equipos seleccionados.', 'error');
          this.consultarEquipos();
        }
      });
    }
  }

  cambiarEstadoRapido(equipo: Equipo, nuevoEstado: EstadoEquipo): void {
    const id = equipo.idEquipo || equipo.id;
    if (!id || equipo.estado === nuevoEstado) return;

    this.equipmentService.cambiarEstado(id, nuevoEstado).subscribe({
      next: () => {
        equipo.estado = nuevoEstado;
        this.calcularMetricas(this.equipos);
        Swal.fire({
          icon: 'success',
          title: 'Estado Actualizado',
          text: `El equipo cambió a ${this.formatearEstado(nuevoEstado)}.`,
          timer: 1600,
          showConfirmButton: false
        });
      },
      error: () => Swal.fire('Error', 'No se pudo cambiar el estado.', 'error')
    });
  }

  formatearEstado(estado: EstadoEquipo): string {
    switch (estado) {
      case 'OPERATIVO': return 'OPERATIVO';
      case 'MANTENIMIENTO': return 'MANTENIMIENTO';
      case 'FUERA_DE_SERVICIO': return 'FUERA DE SERVICIO';
      case 'RETIRADO': return 'RETIRADO';
      default: return estado;
    }
  }

  cargarProveedores(): void {
    this.supplierService.obtenerTodos().subscribe({
      next: (data: Supplier[]) => this.proveedores = data || [],
      error: (err: any) => console.error('Error al cargar proveedores:', err)
    });
  }

  abrirModalRegistro(): void { this.equipoSeleccionado = null; this.mostrarModalRegistro = true; }
  abrirModalEditar(equipo: Equipo): void { this.equipoSeleccionado = equipo; this.mostrarModalRegistro = true; }
  abrirModalDetalle(equipo: Equipo): void { this.equipoSeleccionado = equipo; this.mostrarModalDetalle = true; }
}