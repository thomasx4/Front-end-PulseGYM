import { Component, OnInit } from '@angular/core';
import { Credencial } from '../../models/auth/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { FiltrosCredenciales } from '../filter-credentials/filter-credentials.component';
import Swal from 'sweetalert2';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-credentials-list',
  templateUrl: './credentials-list.component.html',
  styleUrls: ['./credentials-list.component.scss']
})
export class CredentialsListComponent implements OnInit {
  todosLosUsuarios: Credencial[] = [];
  usuariosFiltrados: Credencial[] = [];
  credenciales: Credencial[] = [];

  filtrosActuales: FiltrosCredenciales = {};
  cargando: boolean = false;
  errorMensaje: string = '';

  numeroPagina: number = 0;
  tamanioPagina: number = 5;
  totalElementos: number = 0;
  totalPaginas: number = 0;

  totalActivosGeneral: number = 0;
  totalInactivosGeneral: number = 0;
  totalMesActual: number = 0;

  mostrarFormulario: boolean = false;
  mostrarModalPassword: boolean = false;
  usuarioSeleccionado: any = null;
  cargandoPassword: boolean = false;
  errorPassword: string = '';

  fotosPorKeyMap: Map<string, string> = new Map<string, string>();
  avatarErrors: Set<string | number> = new Set<string | number>();

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.cargarMapaFotos();
    this.cargarTodosLosUsuarios();
  }

  cargarMapaFotos(): void {
    this.userService.obtenerTodosLosPerfilesActivos().pipe(
      catchError((err) => {
        console.warn('No se pudieron obtener los perfiles para asociar fotos:', err);
        return of([]);
      })
    ).subscribe((usuarios: any[]) => {
      if (Array.isArray(usuarios)) {
        usuarios.forEach((u: any) => {
          const foto = u.fotoUrl || u.fotoPerfil || u.foto || u.avatar;
          if (foto) {
            if (u.username) {
              this.fotosPorKeyMap.set(u.username.toLowerCase().trim(), foto);
            }
            if (u.email) {
              this.fotosPorKeyMap.set(u.email.toLowerCase().trim(), foto);
            }
            if (u.idUsuario || u.id) {
              this.fotosPorKeyMap.set(String(u.idUsuario || u.id), foto);
            }
          }
        });
      }
    });
  }

  getFotoCredencial(item: Credencial): string | null {
    if (!item) return null;

    const directFoto = (item as any).fotoUrl || (item as any).avatarUrl || (item as any).foto;
    if (directFoto && !directFoto.includes('pravatar.cc') && !directFoto.includes('ui-avatars.com')) {
      let rawUrl = String(directFoto).trim();
      if (rawUrl !== '' && rawUrl !== 'null' && rawUrl !== 'undefined') {
        return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
      }
    }

    if (item.id && this.fotosPorKeyMap.has(String(item.id))) {
      return this.fotosPorKeyMap.get(String(item.id)) || null;
    }

    if (item.username && this.fotosPorKeyMap.has(item.username.toLowerCase().trim())) {
      return this.fotosPorKeyMap.get(item.username.toLowerCase().trim()) || null;
    }

    if (item.email && this.fotosPorKeyMap.has(item.email.toLowerCase().trim())) {
      return this.fotosPorKeyMap.get(item.email.toLowerCase().trim()) || null;
    }

    return null;
  }

  onAvatarError(key: string | number): void {
    if (key !== undefined && key !== null) {
      this.avatarErrors.add(key);
    }
  }

  hasAvatarError(key: string | number): boolean {
    return this.avatarErrors.has(key);
  }

  getInitials(username?: string): string {
    if (!username) return 'U';
    const partes = username.trim().split(' ').filter(p => p.length > 0);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  cargarTodosLosUsuarios(): void {
    this.cargando = true;
    this.errorMensaje = '';

    this.authService.listarTodosLosUsuarios().subscribe({
      next: (usuarios: Credencial[]) => {
        this.todosLosUsuarios = usuarios || [];
        this.calcularMetricasLocales();
        this.aplicarFiltrosYPaginar(0);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener la lista de usuarios:', err);
        this.errorMensaje = 'No se pudo cargar el listado de usuarios.';
        this.cargando = false;
      }
    });
  }

  aplicarFiltrosYPaginar(pagina: number = 0): void {
    let resultado = [...this.todosLosUsuarios];

    if (this.filtrosActuales.username && this.filtrosActuales.username.trim() !== '') {
      const busqueda = this.filtrosActuales.username.toLowerCase().trim();
      resultado = resultado.filter(u =>
        (u.username && u.username.toLowerCase().includes(busqueda)) ||
        (u.email && u.email.toLowerCase().includes(busqueda))
      );
    }

    if (this.filtrosActuales.rol && this.filtrosActuales.rol.trim() !== '') {
      const rolBuscado = this.filtrosActuales.rol.toLowerCase().trim();
      resultado = resultado.filter(u => u.rol && u.rol.toLowerCase() === rolBuscado);
    }

    if (this.filtrosActuales.activo !== undefined && this.filtrosActuales.activo !== null) {
      resultado = resultado.filter(u => u.estado === this.filtrosActuales.activo);
    }

    const direccion = this.filtrosActuales.direccion || 'desc';
    resultado.sort((a, b) => {
      const idA = a.id || 0;
      const idB = b.id || 0;
      return direccion === 'asc' ? idA - idB : idB - idA;
    });

    this.usuariosFiltrados = resultado;
    this.totalElementos = this.usuariosFiltrados.length;
    this.totalPaginas = Math.ceil(this.totalElementos / this.tamanioPagina);

    if (pagina >= this.totalPaginas && this.totalPaginas > 0) {
      pagina = this.totalPaginas - 1;
    }
    this.numeroPagina = Math.max(0, pagina);

    const inicio = this.numeroPagina * this.tamanioPagina;
    const fin = inicio + this.tamanioPagina;
    this.credenciales = this.usuariosFiltrados.slice(inicio, fin);
  }

  private calcularMetricasLocales(): void {
    this.totalActivosGeneral = this.todosLosUsuarios.filter(u => u.estado === true).length;
    this.totalInactivosGeneral = this.todosLosUsuarios.filter(u => u.estado === false).length;

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    this.totalMesActual = this.todosLosUsuarios.filter(item => {
      if (!item.fechaRegistro) return false;
      const fechaRegistro = new Date(item.fechaRegistro);
      return fechaRegistro.getMonth() === mesActual &&
        fechaRegistro.getFullYear() === anioActual;
    }).length;
  }

  toggleEstado(item: Credencial): void {
    const nuevoEstado = !item.estado;

    this.authService.cambiarEstado(item.id, nuevoEstado).subscribe({
      next: () => {
        item.estado = nuevoEstado;
        this.calcularMetricasLocales();
        this.aplicarFiltrosYPaginar(this.numeroPagina);
      },
      error: (err) => {
        console.error('Error al cambiar el estado:', err);
        this.errorMensaje = 'No se pudo cambiar el estado del usuario.';
      }
    });
  }

  abrirModalCambiarPassword(usuario: any): void {
    this.usuarioSeleccionado = usuario;
    this.errorPassword = '';
    this.mostrarModalPassword = true;
  }

  cerrarModalPassword(): void {
    this.mostrarModalPassword = false;
    this.usuarioSeleccionado = null;
    this.errorPassword = '';
    this.cargandoPassword = false;
  }

  /**
   * Invoca la generación de clave temporal en el backend
   */
  generarContrasenaAleatoria(): void {
    if (!this.usuarioSeleccionado) return;

    this.cargandoPassword = true;
    this.errorPassword = '';

    this.authService.generarContrasenaTemporalByAdmin(this.usuarioSeleccionado.email).subscribe({
      next: (res) => {
        this.cargandoPassword = false;
        const claveTemporal = res.data || 'Error al obtener clave';

        Swal.fire({
          icon: 'success',
          title: '¡Contraseña Temporal Generada!',
          html: `
            <p style="font-size:14px; color:#475569; margin-bottom:12px;">
              Proporciona esta clave de un solo uso al usuario <b>${this.usuarioSeleccionado.username}</b>.
            </p>
            <div style="background:#f1f5f9; border:2px dashed #0f1c3f; border-radius:10px; padding:16px; font-size:22px; font-weight:800; letter-spacing:3px; color:#0f1c3f; user-select:all; margin-bottom:12px;">
              ${claveTemporal}
            </div>
            <small style="color:#64748b;">El usuario deberá cambiarla obligatoriamente en su próximo inicio de sesión.</small>
          `,
          confirmButtonText: 'Copiar y Cerrar',
          confirmButtonColor: '#0f1c3f',
        }).then(() => {
          navigator.clipboard.writeText(claveTemporal);
        });

        this.cerrarModalPassword();
      },
      error: (err) => {
        this.cargandoPassword = false;
        this.errorPassword = err?.error?.message || 'Error al generar la contraseña temporal';
      }
    });
  }

  get paginasVisibles(): number[] {
    if (this.totalPaginas <= 2) {
      return Array.from({ length: this.totalPaginas }, (_, i) => i);
    }

    let inicio = this.numeroPagina;

    if (inicio + 2 > this.totalPaginas) {
      inicio = this.totalPaginas - 2;
    }

    return [inicio, inicio + 1];
  }

  get esUltimaPagina(): boolean {
    return this.numeroPagina >= this.totalPaginas - 1;
  }

  irAPagina(p: number): void {
    if (p !== this.numeroPagina) {
      this.aplicarFiltrosYPaginar(p);
    }
  }

  paginaSiguiente(): void {
    if (!this.esUltimaPagina) {
      this.aplicarFiltrosYPaginar(this.numeroPagina + 1);
    }
  }

  paginaAnterior(): void {
    if (this.numeroPagina > 0) {
      this.aplicarFiltrosYPaginar(this.numeroPagina - 1);
    }
  }

  obtenerRangoInicio(): number {
    return this.totalElementos === 0 ? 0 : this.numeroPagina * this.tamanioPagina + 1;
  }

  obtenerRangoFin(): number {
    return Math.min((this.numeroPagina + 1) * this.tamanioPagina, this.totalElementos);
  }

  onFiltrosAplicados(filtros: FiltrosCredenciales): void {
    this.filtrosActuales = filtros;
    this.aplicarFiltrosYPaginar(0);
  }

  abrirFormulario(): void {
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  onUsuarioCreado(): void {
    this.cerrarFormulario();
    this.cargarTodosLosUsuarios();
  }

  formatearFecha(fechaStr?: string | Date): string {
    if (!fechaStr) return 'N/D';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return 'N/D';

    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}