import { Component, OnInit } from '@angular/core';
import { RespuestaPaginadaCredenciales, Credencial } from '../../models/auth/auth.model';
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
  credenciales: Credencial[] = [];
  filtrosActuales: FiltrosCredenciales = {};
  cargando: boolean = false;
  errorMensaje: string = '';

  numeroPagina: number = 0;
  tamanioPagina: number = 5;
  totalElementos: number = 0;
  totalPaginas: number = 0;
  esUltimaPagina: boolean = false;

  totalActivosGeneral: number = 0;
  totalInactivosGeneral: number = 0;
  totalMesActual: number = 0;

  mostrarFormulario: boolean = false;

  mostrarModalPassword: boolean = false;
  usuarioSeleccionado: any = null;
  nuevaPassword: string = '';
  confirmarPassword: string = '';
  mostrarPassword: boolean = false;
  mostrarConfirmacion: boolean = false;
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
    this.cargarCredenciales();
    this.cargarMetricasGenerales();
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

  cargarCredenciales(pagina: number = 0): void {
    this.cargando = true;
    this.errorMensaje = '';

    this.authService.listarCredenciales(
      pagina,
      this.tamanioPagina,
      'id',
      this.filtrosActuales.direccion || 'desc',
      this.filtrosActuales.rol,
      this.filtrosActuales.activo,
      this.filtrosActuales.username
    ).subscribe({
      next: (res: RespuestaPaginadaCredenciales) => {
        this.credenciales = res.contenido;
        this.numeroPagina = res.numeroPagina;
        this.tamanioPagina = res.tamanioPagina;
        this.totalElementos = res.totalElementos;
        this.totalPaginas = res.totalPaginas;
        this.esUltimaPagina = res.ultima;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener credenciales:', err);
        this.errorMensaje = 'No se pudo cargar el listado de credenciales.';
        this.cargando = false;
      }
    });
  }

  cargarMetricasGenerales(): void {
    this.authService.listarCredenciales(0, 1, 'id', 'desc', undefined, true).subscribe({
      next: (res) => this.totalActivosGeneral = res.totalElementos,
      error: (err) => console.error('Error al obtener métricas activas:', err)
    });

    this.authService.listarCredenciales(0, 1, 'id', 'desc', undefined, false).subscribe({
      next: (res) => this.totalInactivosGeneral = res.totalElementos,
      error: (err) => console.error('Error al obtener métricas inactivas:', err)
    });

    this.authService.listarCredenciales(0, 1000, 'id', 'desc').subscribe({
      next: (res) => {
        this.calcularCredencialesMesActual(res.contenido);
      },
      error: (err) => console.error('Error al obtener métricas de crecimiento:', err)
    });
  }

  private calcularCredencialesMesActual(lista: Credencial[]): void {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    this.totalMesActual = lista.filter(item => {
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
        this.cargarMetricasGenerales();
      },
      error: (err) => {
        console.error('Error al cambiar el estado:', err);
        this.errorMensaje = 'No se pudo cambiar el estado del usuario.';
      }
    });
  }

  abrirModalCambiarPassword(usuario: any): void {
    this.usuarioSeleccionado = usuario;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.errorPassword = '';
    this.mostrarPassword = false;
    this.mostrarConfirmacion = false;
    this.mostrarModalPassword = true;
  }

  cerrarModalPassword(): void {
    this.mostrarModalPassword = false;
    this.usuarioSeleccionado = null;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.errorPassword = '';
    this.cargandoPassword = false;
  }

  cambiarPasswordUsuario(): void {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;

    if (!passwordRegex.test(this.nuevaPassword)) {
      this.errorPassword = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.';
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.errorPassword = 'Las contraseñas no coinciden';
      return;
    }

    this.errorPassword = '';
    this.cargandoPassword = true;

    const request = {
      email: this.usuarioSeleccionado.email,
      newPassword: this.nuevaPassword,
      confirmPassword: this.confirmarPassword
    };

    this.authService.changePasswordByAdmin(request).subscribe({
      next: () => {
        this.cargandoPassword = false;
        Swal.fire({
          icon: 'success',
          title: '¡Contraseña Actualizada!',
          text: `La contraseña de "${this.usuarioSeleccionado.username}" ha sido cambiada exitosamente.`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0f1c3f',
        });
        this.cerrarModalPassword();
      },
      error: (error) => {
        this.cargandoPassword = false;
        this.errorPassword = error.error?.message || 'Error al cambiar la contraseña';
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

  irAPagina(p: number): void {
    if (p !== this.numeroPagina) {
      this.cargarCredenciales(p);
    }
  }

  paginaSiguiente(): void {
    if (!this.esUltimaPagina) {
      this.cargarCredenciales(this.numeroPagina + 1);
    }
  }

  paginaAnterior(): void {
    if (this.numeroPagina > 0) {
      this.cargarCredenciales(this.numeroPagina - 1);
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
    this.cargarCredenciales(0);
  }

  abrirFormulario(): void {
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  onUsuarioCreado(): void {
    this.cerrarFormulario();
    this.cargarCredenciales(0);
    this.cargarMetricasGenerales();
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