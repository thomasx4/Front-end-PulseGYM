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

  constructor(private headquarterService: HeadquarterService) {}

  ngOnInit(): void {
    this.cargarSedes();
  }

  cargarSedes(): void {
    this.cargando = true;
    this.errorMensaje = '';

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