import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
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
  perfilesFiltrados: UserProfile[] = [];
  loading: boolean = false;
  errorMensaje: string = '';

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  totalElementos: number = 0;

  // Filtros
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

  onImageError(perfil: UserProfile): void {
    perfil.fotoUrl = '';
  }

  private ordenarPerfiles(perfiles: UserProfile[]): UserProfile[] {
    return perfiles.sort((a, b) => {
      return b.idUsuario - a.idUsuario;
    });
  }

  cargarPerfiles(): void {
    this.loading = true;
    this.errorMensaje = '';

    this.userService.obtenerTodosLosPerfiles().subscribe({
      next: (data: UserProfile[]) => {
        this.perfiles = this.ordenarPerfiles(data);
        this.aplicarFiltros();
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
    let filtrados = [...this.perfiles];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.apellido.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.documentoIdentidad.includes(term)
      );
    }

    if (this.filtroRol !== 'todos') {
      filtrados = filtrados.filter(p => p.rol?.toLowerCase() === this.filtroRol);
    }

    if (this.filtroEstado !== 'todos') {
      filtrados = filtrados.filter(p => p.estado.toLowerCase() === this.filtroEstado);
    }

    this.perfilesFiltrados = this.ordenarPerfiles(filtrados);
    this.totalElementos = this.perfilesFiltrados.length;
    this.paginaActual = 1;
  }

  // LIMPIAR FILTROS
  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroRol = 'todos';
    this.filtroEstado = 'todos';
    this.aplicarFiltros();
  }

  //  PAGINACIÓN 
  get perfilesPaginados(): UserProfile[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.perfilesFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.perfilesFiltrados.length / this.itemsPorPagina) || 1;
  }

  get paginasVisibles(): number[] {
    const total = this.totalPaginas;
    const maxVisible = 5;
    let start = Math.max(1, this.paginaActual - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get inicio(): number {
    return (this.paginaActual - 1) * this.itemsPorPagina + 1;
  }

  get fin(): number {
    return Math.min(this.paginaActual * this.itemsPorPagina, this.perfilesFiltrados.length);
  }

  irPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  
  // ACCIONES
  

  // VER DETALLE
verDetalle(perfil: UserProfile): void {
    this.router.navigate(['/dashboard-admin/users/profiles/detail', perfil.idUsuario]);
}

  // EDITAR PERFIL
  editarPerfil(perfil?: UserProfile): void {
    if (perfil) {
      console.log('✏️ Editar perfil:', perfil.idUsuario);
      this.router.navigate(['/dashboard-admin/users/profiles/edit', perfil.idUsuario]);
    } else {
      console.log('➕ Crear nuevo perfil');
      this.router.navigate(['/dashboard-admin/users/profiles/new']);
    }
  }

  // CAMBIAR ESTADO
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

  //  OBTENER CLASE DEL ROL 
  getRolClass(rol: string): string {
    if (!rol) return 'rol-default';
    const rolLower = rol.toLowerCase();
    if (rolLower.includes('administrador')) return 'rol-admin';
    if (rolLower.includes('entrenador')) return 'rol-trainer';
    if (rolLower.includes('recepcionista')) return 'rol-receptionist';
    if (rolLower.includes('socio')) return 'rol-member';
    return 'rol-default';
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

  getTotalActivos(): number {
    return this.perfiles.filter(p => p.estado === 'ACTIVO').length;
  }

  getTotalInactivos(): number {
    return this.perfiles.filter(p => p.estado === 'INACTIVO').length;
  }
}