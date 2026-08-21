import { Component, OnInit } from '@angular/core';
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

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.cargarPerfiles();
  }

  cargarPerfiles(): void {
    this.loading = true;
    this.errorMensaje = '';

    this.userService.obtenerTodosLosPerfiles().subscribe({
      next: (data: UserProfile[]) => {
        this.perfiles = data;
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

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.apellido.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.documentoIdentidad.includes(term)
      );
    }

    // Filtro por rol
    if (this.filtroRol !== 'todos') {
      filtrados = filtrados.filter(p => p.rol?.toLowerCase() === this.filtroRol);
    }

    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      filtrados = filtrados.filter(p => p.estado.toLowerCase() === this.filtroEstado);
    }

    this.perfilesFiltrados = filtrados;
    this.totalElementos = filtrados.length;
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

  //  ACCIONES 
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

  editarPerfil(perfil?: UserProfile): void {
    if (perfil) {
      console.log('Editar perfil:', perfil);
      // TODO: Navegar a editar perfil
    } else {
      console.log('Crear nuevo perfil');
      // TODO: Navegar a crear perfil
    }
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

  //  MÉTRICAS 
  getTotalPorRol(rol: string): number {
    return this.perfiles.filter(p => p.rol?.toLowerCase() === rol.toLowerCase()).length;
  }

  getTotalActivos(): number {
    return this.perfiles.filter(p => p.estado === 'ACTIVO').length;
  }

  getTotalInactivos(): number {
    return this.perfiles.filter(p => p.estado === 'INACTIVO').length;
  }

  //  VER DETALLE DEL USUARIO 
verDetalle(perfil: UserProfile): void {
    Swal.fire({
        title: `${perfil.nombre} ${perfil.apellido}`,
        html: `
            <div style="text-align: left; font-size: 14px;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #1e293b, #0f172a); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 700; flex-shrink: 0;">
                        ${perfil.nombre.charAt(0)}${perfil.apellido.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 18px; color: #0b1a30;">${perfil.nombre} ${perfil.apellido}</div>
                        <div style="color: #64748b; font-size: 14px;">${perfil.email}</div>
                        <span style="display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; background: ${perfil.estado === 'ACTIVO' ? '#e6f9f0' : '#f1f3f5'}; color: ${perfil.estado === 'ACTIVO' ? '#00b865' : '#868e96'}; margin-top: 4px;">
                            ${perfil.estado === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #edf2f7; padding-top: 16px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;">
                        <div><strong style="color: #64748b; font-size: 12px;">DOCUMENTO</strong><br><span style="color: #0b1a30;">${perfil.documentoIdentidad || 'N/D'}</span></div>
                        <div><strong style="color: #64748b; font-size: 12px;">TELÉFONO</strong><br><span style="color: #0b1a30;">${perfil.telefono || 'N/D'}</span></div>
                        <div><strong style="color: #64748b; font-size: 12px;">ROL</strong><br><span style="color: #0b1a30; text-transform: capitalize;">${perfil.rol || 'Sin rol'}</span></div>
                        <div><strong style="color: #64748b; font-size: 12px;">FECHA REGISTRO</strong><br><span style="color: #0b1a30;">${this.formatearFecha(perfil.fechaRegistro)}</span></div>
                        ${perfil.fechaNacimiento ? `<div><strong style="color: #64748b; font-size: 12px;">FECHA NACIMIENTO</strong><br><span style="color: #0b1a30;">${this.formatearFecha(perfil.fechaNacimiento)}</span></div>` : ''}
                        ${perfil.idSede ? `<div><strong style="color: #64748b; font-size: 12px;">SEDE</strong><br><span style="color: #0b1a30;">${perfil.idSede}</span></div>` : ''}
                    </div>
                </div>
                
                ${perfil.objetivoPrincipal ? `
                <div style="border-top: 1px solid #edf2f7; padding-top: 12px; margin-top: 12px;">
                    <strong style="color: #64748b; font-size: 12px;">OBJETIVO PRINCIPAL</strong>
                    <p style="color: #0b1a30; margin: 4px 0 0 0;">${perfil.objetivoPrincipal}</p>
                </div>` : ''}
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#0f1c3f',
        width: 500,
        padding: '20px',
    });
}
}