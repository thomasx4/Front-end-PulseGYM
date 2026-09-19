import { Component, OnInit } from '@angular/core';
import { Credencial, RespuestaPaginadaCredenciales, FiltrosUsuarios } from '../../models/auth/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { FiltrosCredenciales } from '../filter-credentials/filter-credentials.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-credentials-list',
  templateUrl: './credentials-list.component.html',
  styleUrls: ['./credentials-list.component.scss']
})
export class CredentialsListComponent implements OnInit {
  credenciales: Credencial[] = [];

  cargando: boolean = false;
  errorMensaje: string = '';

  numeroPagina: number = 0;
  tamanioPagina: number = 7;
  totalElementos: number = 0;
  totalPaginas: number = 0;

  totalActivosGeneral: number = 0;
  totalInactivosGeneral: number = 0;
  totalMesActual: number = 0;

  filtrosActivos: FiltrosUsuarios = {
    page: 0,
    size: 7
  };

  mostrarFormulario: boolean = false;
  mostrarModalPassword: boolean = false;
  usuarioSeleccionado: any = null;
  cargandoPassword: boolean = false;
  errorPassword: string = '';

  avatarErrors: Set<string | number> = new Set<string | number>();

  idsSeleccionados: Set<number> = new Set<number>();

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.cargarCredenciales();
    this.cargarMetricasGlobales();
  }

  cargarMetricasGlobales(): void {
    this.authService.listarTodosLosUsuarios().subscribe({
      next: (todos) => {
        if (todos && Array.isArray(todos)) {
          this.totalActivosGeneral = todos.filter(u => u.estado === true).length;
          this.totalInactivosGeneral = todos.filter(u => u.estado === false).length;

          const ahora = new Date();
          const mesActual = ahora.getMonth();
          const anioActual = ahora.getFullYear();

          this.totalMesActual = todos.filter(item => {
            if (!item.fechaRegistro) return false;
            const fecha = new Date(item.fechaRegistro);
            return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
          }).length;
        }
      },
      error: (err) => console.error('Error al cargar métricas globales:', err)
    });
  }

  cargarCredenciales(filtros: FiltrosCredenciales = {}): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.limpiarSeleccion();

    const esLimpieza = Object.keys(filtros).length === 0;

    if (esLimpieza) {
      this.filtrosActivos = {
        page: this.numeroPagina,
        size: this.tamanioPagina
      };
    } else {
      this.filtrosActivos = {
        ...filtros,
        page: this.numeroPagina,
        size: this.tamanioPagina
      };
    }

    this.authService.listarCredenciales(this.filtrosActivos).subscribe({
      next: (response: RespuestaPaginadaCredenciales) => {
        this.credenciales = response.contenido || response.content || [];
        this.totalElementos = response.totalElementos ?? response.totalElements ?? 0;
        this.totalPaginas = response.totalPaginas ?? response.totalPages ?? 0;
        this.numeroPagina = response.numeroPagina ?? response.currentPage ?? response.number ?? 0;
        this.tamanioPagina = response.tamanioPagina ?? response.size ?? 7;

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.errorMensaje = 'No se pudo cargar el listado de usuarios.';
        this.cargando = false;
      }
    });
  }

  isSeleccionado(id: number): boolean {
    return this.idsSeleccionados.has(id);
  }

  toggleSeleccionItem(id: number): void {
    if (this.idsSeleccionados.has(id)) {
      this.idsSeleccionados.delete(id);
    } else {
      this.idsSeleccionados.add(id);
    }
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.credenciales.forEach(item => {
        if (item.id !== undefined && item.id !== null) {
          this.idsSeleccionados.add(item.id);
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
    if (this.credenciales.length === 0) return false;
    return this.credenciales.every(item => item.id !== undefined && item.id !== null && this.idsSeleccionados.has(item.id));
  }

  get isSomeSelected(): boolean {
    if (this.credenciales.length === 0) return false;
    const count = this.credenciales.filter(item => item.id !== undefined && item.id !== null && this.idsSeleccionados.has(item.id)).length;
    return count > 0 && !this.isAllSelected;
  }

  cambiarEstadoSeleccionados(nuevoEstado: boolean): void {
    const ids: number[] = Array.from(this.idsSeleccionados);
    if (ids.length === 0) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a ${nuevoEstado ? 'activar' : 'desactivar'} ${ids.length} usuario(s) seleccionado(s).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f1c3f',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        let completados = 0;
        ids.forEach(id => {
          this.authService.cambiarEstado(id, nuevoEstado).subscribe({
            next: () => {
              completados++;
              const usuario = this.credenciales.find(c => c.id === id);
              if (usuario) usuario.estado = nuevoEstado;
              
              if (completados === ids.length) {
                this.cargarMetricasGlobales();
                this.limpiarSeleccion();
                Swal.fire('¡Actualizado!', 'Los estados han sido modificados correctamente.', 'success');
              }
            },
            error: (err) => {
              console.error(`Error al cambiar estado para ID ${id}:`, err);
            }
          });
        });
      }
    });
  }

  restablecerClaveSeleccionados(): void {
    const ids: number[] = Array.from(this.idsSeleccionados);
    if (ids.length === 0) return;

    const usuariosSeleccionadosObjs = this.credenciales.filter(c => c.id !== undefined && this.idsSeleccionados.has(c.id));

    Swal.fire({
      title: '¿Restablecer accesos?',
      text: `Se enviará una contraseña temporal a los correos de ${ids.length} usuario(s) seleccionado(s).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f1c3f',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, enviar a todos',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        let completados = 0;
        let errores = 0;

        usuariosSeleccionadosObjs.forEach(user => {
          if (!user.email) {
            completados++;
            return;
          }
          this.authService.generarContrasenaTemporalByAdmin(user.email).subscribe({
            next: () => {
              completados++;
              if (completados + errores === usuariosSeleccionadosObjs.length) {
                this.finalizarEnvioMasivo(errores);
              }
            },
            error: (err) => {
              console.error(`Error enviando clave a ${user.email}:`, err);
              errores++;
              if (completados + errores === usuariosSeleccionadosObjs.length) {
                this.finalizarEnvioMasivo(errores);
              }
            }
          });
        });
      }
    });
  }

  private finalizarEnvioMasivo(errores: number): void {
    this.limpiarSeleccion();
    if (errores === 0) {
      Swal.fire('¡Proceso Exitoso!', 'Se han enviado las contraseñas temporales a todos los usuarios seleccionados.', 'success');
    } else {
      Swal.fire('Proceso Completado', `Se enviaron los correos, pero hubo ${errores} error(es) en algunas cuentas.`, 'warning');
    }
  }

  getFotoCredencial(item: Credencial): string | null {
    if (!item) return null;
    const directFoto = item.fotoUrl || item.avatarUrl || item.foto;
    if (directFoto && !directFoto.includes('pravatar.cc') && !directFoto.includes('ui-avatars.com')) {
      const rawUrl = String(directFoto).trim();
      if (rawUrl !== '' && rawUrl !== 'null' && rawUrl !== 'undefined') {
        return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
      }
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

  toggleEstado(item: Credencial): void {
    const nuevoEstado = !item.estado;

    this.authService.cambiarEstado(item.id, nuevoEstado).subscribe({
      next: () => {
        item.estado = nuevoEstado;
        this.cargarMetricasGlobales();
      },
      error: (err) => {
        console.error('Error al cambiar el estado:', err);
        this.errorMensaje = 'No se pudo cambiar el estado del usuario.';
      }
    });
  }

  onFiltrosAplicados(filtros: FiltrosCredenciales): void {
    this.numeroPagina = 0;
    this.cargarCredenciales(filtros);
  }

  irAPagina(p: number): void {
    if (p !== this.numeroPagina && p >= 0 && p < this.totalPaginas) {
      this.numeroPagina = p;
      this.cargarCredenciales(this.filtrosActivos);
    }
  }

  paginaSiguiente(): void {
    if (!this.esUltimaPagina) {
      this.irAPagina(this.numeroPagina + 1);
    }
  }

  paginaAnterior(): void {
    if (this.numeroPagina > 0) {
      this.irAPagina(this.numeroPagina - 1);
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

  get mostrarUltimaPagina(): boolean {
    const paginas = this.paginasVisibles;
    if (paginas.length === 0) return false;
    return paginas[paginas.length - 1] < this.totalPaginas - 1;
  }

  get esUltimaPagina(): boolean {
    return this.numeroPagina >= this.totalPaginas - 1;
  }

  obtenerRangoInicio(): number {
    return this.totalElementos === 0 ? 0 : this.numeroPagina * this.tamanioPagina + 1;
  }

  obtenerRangoFin(): number {
    return Math.min((this.numeroPagina + 1) * this.tamanioPagina, this.totalElementos);
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

  generarContrasenaAleatoria(): void {
    if (!this.usuarioSeleccionado) return;

    this.cargandoPassword = true;
    this.errorPassword = '';

    this.authService.generarContrasenaTemporalByAdmin(this.usuarioSeleccionado.email).subscribe({
      next: () => {
        this.cargandoPassword = false;

        Swal.fire({
          icon: 'success',
          title: '¡Clave Temporal Enviada!',
          html: `
            <p style="font-size:14px; color:#475569; margin-bottom:12px;">
              Se ha enviado la contraseña temporal directamente al correo de <b>${this.usuarioSeleccionado.username}</b> (<i>${this.usuarioSeleccionado.email}</i>).
            </p>
            <small style="color:#64748b;">El usuario deberá consultar su bandeja de entrada y cambiar la clave en su próximo inicio de sesión.</small>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0f1c3f',
        });

        this.cerrarModalPassword();
      },
      error: (err) => {
        this.cargandoPassword = false;
        this.errorPassword = err?.error?.message || 'Error al generar la contraseña temporal';
      }
    });
  }

  abrirFormulario(): void {
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  onUsuarioCreado(): void {
    this.cerrarFormulario();
    this.cargarCredenciales();
    this.cargarMetricasGlobales();
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