import { Component, OnInit } from '@angular/core';
import { Sede } from '../../models/sede.model';
import { HeadquarterService } from '../../../../core/services/headquarter.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-headquarters-list',
  templateUrl: './headquarters-list.component.html',
  styleUrls: ['./headquarters-list.component.scss']
})
export class HeadquartersListComponent implements OnInit {
  sedes: Sede[] = [];
  cargando: boolean = false;
  errorMensaje: string = '';

  filtroNombre: string = '';
  filtroCiudad: string = '';

  mostrarModal: boolean = false;
  sedeSeleccionada: Sede | null = null;

  // ⭐ Propiedades para selección múltiple
  idsSeleccionados: Set<number> = new Set<number>();

  // 🔥 Sidebar móvil (por si en el futuro se usa dentro de UserLayout)
  public isSidebarOpen: boolean = false;

  constructor(private headquarterService: HeadquarterService) {}

  ngOnInit(): void {
    this.cargarSedes();
  }

  // 🔥 Métodos para sidebar móvil
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  cargarSedes(): void {
    this.errorMensaje = '';
    this.limpiarSeleccion();

    if (this.filtroNombre.trim()) {
      this.headquarterService.buscarPorNombre(this.filtroNombre.trim()).subscribe({
        next: (data) => {
          this.sedes = data;
          this.cargando = false;
        },
        error: (err) => this.handleError('Error al buscar la sede por nombre', err)
      });
      return;
    }

    if (this.filtroCiudad.trim()) {
      this.headquarterService.buscarPorCiudad(this.filtroCiudad.trim()).subscribe({
        next: (data) => {
          this.sedes = data;
          this.cargando = false;
        },
        error: (err) => this.handleError('Error al buscar sedes por ciudad', err)
      });
      return;
    }

    this.headquarterService.obtenerTodas().subscribe({
      next: (data) => {
        this.sedes = data;
        this.cargando = false;
      },
      error: (err) => this.handleError('No se pudo obtener el listado de sedes', err)
    });
  }

  isSeleccionado(id: number | undefined): boolean {
    if (id === undefined) return false;
    return this.idsSeleccionados.has(id);
  }

  toggleSeleccionItem(id: number | undefined): void {
    if (id === undefined) return;
    if (this.idsSeleccionados.has(id)) {
      this.idsSeleccionados.delete(id);
    } else {
      this.idsSeleccionados.add(id);
    }
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.sedes.forEach(item => {
        if (item.idSede !== undefined && item.idSede !== null) {
          this.idsSeleccionados.add(item.idSede);
        }
      });
    } else {
      this.limpiarSeleccion();
    }
  }

  limpiarSeleccion(): void {
    this.idsSeleccionados.clear();
  }

  get isAllSelected(): boolean {
    if (this.sedes.length === 0) return false;
    return this.sedes.every(item => item.idSede !== undefined && item.idSede !== null && this.idsSeleccionados.has(item.idSede));
  }

  get isSomeSelected(): boolean {
    if (this.sedes.length === 0) return false;
    const count = this.sedes.filter(item => item.idSede !== undefined && item.idSede !== null && this.idsSeleccionados.has(item.idSede)).length;
    return count > 0 && !this.isAllSelected;
  }

  eliminarSeleccionados(): void {
    const ids: number[] = Array.from(this.idsSeleccionados);
    if (ids.length === 0) return;

    Swal.fire({
      title: '¿Eliminar sedes?',
      html: `¿Estás seguro de que deseas eliminar las <b>${ids.length}</b> sede(s) seleccionada(s)? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        let completados = 0;
        ids.forEach(id => {
          this.headquarterService.eliminarSede(id).subscribe({
            next: () => {
              completados++;
              if (completados === ids.length) {
                this.limpiarSeleccion();
                this.cargarSedes();
                Swal.fire({
                  icon: 'success',
                  title: '¡Sedes eliminadas!',
                  text: 'Las sedes seleccionadas han sido eliminadas correctamente.',
                  confirmButtonColor: '#0f1c3f'
                });
              }
            },
            error: (err) => {
              console.error(`Error al eliminar sede ID ${id}:`, err);
            }
          });
        });
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarSedes();
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroCiudad = '';
    this.cargarSedes();
  }

  abrirModalCrear(): void {
    this.sedeSeleccionada = null;
    this.mostrarModal = true;
  }

  abrirModalEditar(sede: Sede): void {
    this.sedeSeleccionada = { ...sede };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.sedeSeleccionada = null;
  }

  onSedeGuardada(): void {
    this.cerrarModal();
    this.cargarSedes();
  }

  confirmarEliminacion(sede: Sede): void {
    if (!sede.idSede) return;

    Swal.fire({
      title: '¿Eliminar Sede?',
      html: `¿Estás seguro de que deseas eliminar <b>${sede.nombreSede}</b>? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.headquarterService.eliminarSede(sede.idSede!).subscribe({
          next: () => {
            Swal.fire('¡Eliminada!', 'La sede ha sido eliminada correctamente.', 'success');
            this.cargarSedes();
          },
          error: (err) => {
            console.error('Error al eliminar sede:', err);
            Swal.fire('Error', 'No se pudo eliminar la sede seleccionada.', 'error');
          }
        });
      }
    });
  }

  private handleError(mensaje: string, error: any): void {
    console.error(mensaje, error);
    this.errorMensaje = mensaje;
    this.cargando = false;
  }
}