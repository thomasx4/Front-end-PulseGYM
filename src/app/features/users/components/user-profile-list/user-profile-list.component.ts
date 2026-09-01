import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, FiltrosPerfiles, RespuestaPaginadaPerfiles } from '../../../../core/services/user.service';
import Swal from 'sweetalert2';

export interface UserProfile {
  idUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  documentoIdentidad: string;
  fotoUrl: string;
  fechaNacimiento: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  idSede: number;
  objetivoPrincipal: string;
  nivelExperiencia: string;
  fechaContratacion: string;
  especialidad: string;
  anosExperiencia: number;
  horarioDisponibilidad: string;
  tarifaHora: number;
  turno: string;
  fechaRegistro: string;
  estado: string;
  rol?: string;
}

@Component({
  selector: 'app-user-profile-list',
  templateUrl: './user-profile-list.component.html',
  styleUrls: ['./user-profile-list.component.scss']
})
export class UserProfileListComponent implements OnInit {
  perfiles: UserProfile[] = [];
  loading: boolean = false;
  errorMensaje: string = '';

  numeroPagina: number = 0;
  tamanioPagina: number = 7;
  totalElementos: number = 0;
  totalPaginas: number = 0;

  searchTerm: string = '';
  filtroRol: string = 'todos';
  filtroEstado: string = 'todos';

  constructor(
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarPerfiles();
  }

  cargarPerfiles(): void {
    this.loading = true;
    this.errorMensaje = '';

    const filtros: FiltrosPerfiles = {
      pagina: this.numeroPagina,
      tamanio: this.tamanioPagina,
      busqueda: this.searchTerm.trim() || undefined,
      rol: this.filtroRol !== 'todos' ? this.filtroRol : undefined,
      estado: this.filtroEstado !== 'todos' ? this.filtroEstado : undefined
    };

    this.userService.listarPerfilesPaginados(filtros).subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.totalElementos = response.length;
          this.totalPaginas = Math.ceil(this.totalElementos / this.tamanioPagina) || 1;

          const inicioSlice = this.numeroPagina * this.tamanioPagina;
          const finSlice = inicioSlice + this.tamanioPagina;
          this.perfiles = response.slice(inicioSlice, finSlice);
        }
        else {
          const listData = response.data || response.contenido || response.content || [];
          this.perfiles = Array.isArray(listData) ? listData : [];
          this.totalElementos = response.totalElementos ?? response.totalElements ?? this.perfiles.length;
          this.totalPaginas = response.totalPaginas ?? response.totalPages ?? 1;
          this.numeroPagina = response.numeroPagina ?? response.currentPage ?? response.number ?? 0;
          this.tamanioPagina = response.tamanioPagina ?? response.size ?? 7;
        }

        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar perfiles:', error);
        this.errorMensaje = error.error?.message || 'No se pudieron cargar los perfiles.';
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.numeroPagina = 0;
    this.cargarPerfiles();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroRol = 'todos';
    this.filtroEstado = 'todos';
    this.numeroPagina = 0;
    this.cargarPerfiles();
  }

  irPagina(pZeroBased: number): void {
    if (pZeroBased !== this.numeroPagina && pZeroBased >= 0 && pZeroBased < this.totalPaginas) {
      this.numeroPagina = pZeroBased;
      this.cargarPerfiles();
    }
  }

  paginaAnterior(): void {
    if (this.numeroPagina > 0) {
      this.irPagina(this.numeroPagina - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.numeroPagina < this.totalPaginas - 1) {
      this.irPagina(this.numeroPagina + 1);
    }
  }

  get paginasVisibles(): number[] {
    const maxVisibles = 4;
    let inicio = Math.max(0, this.numeroPagina - 1);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPaginas) {
      fin = this.totalPaginas;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  get inicio(): number {
    return this.totalElementos === 0 ? 0 : this.numeroPagina * this.tamanioPagina + 1;
  }

  get fin(): number {
    return Math.min((this.numeroPagina + 1) * this.tamanioPagina, this.totalElementos);
  }

  onImageError(perfil: UserProfile): void {
    perfil.fotoUrl = '';
  }

  verDetalle(perfil: UserProfile): void {
    this.router.navigate(['/dashboard-admin/users/profiles/detail', perfil.idUsuario]);
  }

  editarPerfil(perfil?: UserProfile): void {
    if (perfil) {
      this.router.navigate(['/dashboard-admin/users/profiles/edit', perfil.idUsuario]);
    } else {
      this.router.navigate(['/dashboard-admin/users/profiles/new']);
    }
  }

  toggleEstado(perfil: UserProfile): void {
    const nuevoEstado = perfil.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    Swal.fire({
      title: '¿Confirmar cambio de estado?',
      text: `¿Estás seguro de que deseas ${nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar'} a "${perfil.nombre} ${perfil.apellido}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f1c3f',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.cambiarEstadoPerfil(perfil.idUsuario, nuevoEstado).subscribe({
          next: () => {
            perfil.estado = nuevoEstado;
            Swal.fire({
              icon: 'success',
              title: 'Estado actualizado',
              text: `El usuario ha sido ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente.`,
              confirmButtonColor: '#0f1c3f',
            });
          },
          error: (error: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo cambiar el estado.',
              confirmButtonColor: '#0f1c3f',
            });
          }
        });
      }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/D';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'N/D';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getTotalPorRol(rol: string): number {
    return this.perfiles.filter(p => p.rol?.toLowerCase() === rol.toLowerCase()).length;
  }
}