import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EnvioNotificacion, PlantillaNotificacion } from '../../models/notification.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-envio-manual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-envio-manual.component.html',
  styleUrls: ['./admin-envio-manual.component.scss']
})
export class AdminEnvioManualComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private rolAdmin = 'ADMIN';

  envio: EnvioNotificacion = {
    usuarioId: 0,
    destinatario: '',
    asunto: '',
    contenido: '',
    canal: 'EMAIL'
  };

  plantillasList: PlantillaNotificacion[] = [];
  plantillaSeleccionadaId: number | null = null;

  showPartnerModal: boolean = false;
  usuariosList: any[] = [];
  selectedUsuario: any = null;
  searchUsuario: string = '';
  telefonoWhatsapp: string = '';
  
  paginaModalActual: number = 0;
  itemsPorPaginaModal: number = 5;
  totalElementosModal: number = 0;
  totalPaginasModal: number = 0;
  loadingModalUsers: boolean = false;

  avatarSelectedError: boolean = false;
  modalAvatarErrors: Set<number> = new Set<number>();

  mensajeResultado = '';
  esError = false;

  ngOnInit(): void {
    this.cargarPlantillas();
  }

  cargarPlantillas(): void {
    this.notificationService.listarPlantillas(this.rolAdmin).subscribe({
      next: (res: { data?: PlantillaNotificacion[] }) => {
        if (res && res.data) {
          this.plantillasList = res.data;
        }
      },
      error: (err: any) => console.error('Error al cargar plantillas', err)
    });
  }

  abrirModalSeleccionSocio(): void {
    this.searchUsuario = '';
    this.paginaModalActual = 0;
    this.showPartnerModal = true;
    this.cargarCredencialesModal();
  }

  cerrarModalSeleccionSocio(): void {
    this.showPartnerModal = false;
  }

  filtrarSociosModal(): void {
    this.paginaModalActual = 0;
    this.cargarCredencialesModal();
  }

  cargarCredencialesModal(): void {
    this.loadingModalUsers = true;
    const filtros: any = {
      page: this.paginaModalActual,
      size: this.itemsPorPaginaModal
    };

    if (this.searchUsuario && this.searchUsuario.trim() !== '') {
      filtros.busqueda = this.searchUsuario.trim();
    }

    this.authService.listarCredenciales(filtros).subscribe({
      next: (res: any) => {
        this.loadingModalUsers = false;
        this.usuariosList = res.content || res.contenido || res.data || [];
        this.totalElementosModal = res.totalElements ?? res.totalElementos ?? 0;
        this.totalPaginasModal = res.totalPages ?? res.totalPaginas ?? 0;
      },
      error: (err: any) => {
        console.error('Error al listar credenciales', err);
        this.usuariosList = [];
        this.totalElementosModal = 0;
        this.totalPaginasModal = 0;
        this.loadingModalUsers = false;
      }
    });
  }

  irPaginaModal(pZeroBased: number): void {
    if (pZeroBased !== this.paginaModalActual && pZeroBased >= 0 && pZeroBased < this.totalPaginasModal) {
      this.paginaModalActual = pZeroBased;
      this.cargarCredencialesModal();
    }
  }

  paginaAnteriorModal(): void {
    if (this.paginaModalActual > 0) {
      this.irPaginaModal(this.paginaModalActual - 1);
    }
  }

  paginaSiguienteModal(): void {
    if (this.paginaModalActual < this.totalPaginasModal - 1) {
      this.irPaginaModal(this.paginaModalActual + 1);
    }
  }

  get paginasVisiblesModal(): number[] {
    const maxVisibles = 4;
    let inicio = Math.max(0, this.paginaModalActual - 1);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPaginasModal) {
      fin = this.totalPaginasModal;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  seleccionarSocioDesdeModal(credencial: any): void {
    this.selectedUsuario = credencial;
    this.envio.usuarioId = credencial.id || credencial.idUsuario || 1;
    this.envio.destinatario = credencial.email || '';
    this.telefonoWhatsapp = '';
    this.avatarSelectedError = false;
    this.cerrarModalSeleccionSocio();

    Swal.fire({
      icon: 'success',
      title: 'Destinatario asignado',
      text: `Se ha seleccionado a ${credencial.username || credencial.email}`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  limpiarSeleccion(): void {
    this.selectedUsuario = null;
    this.envio.usuarioId = 0;
    this.envio.destinatario = '';
    this.telefonoWhatsapp = '';
    this.avatarSelectedError = false;
  }

  onSeleccionarPlantilla(): void {
    if (!this.plantillaSeleccionadaId) return;
    const plantillaEncontrada = this.plantillasList.find(p => p.idPlantilla === this.plantillaSeleccionadaId);
    if (plantillaEncontrada) {
      this.envio.asunto = plantillaEncontrada.titulo || '';
      this.envio.contenido = plantillaEncontrada.contenido || '';
      if (plantillaEncontrada.tipoPlantilla) {
        this.envio.canal = plantillaEncontrada.tipoPlantilla;
      }
    }
  }

  enviar(): void {
    if (this.envio.canal === 'WHATSAPP') {
      if (!this.telefonoWhatsapp || this.telefonoWhatsapp.trim() === '') {
        Swal.fire({
          icon: 'warning',
          title: 'Número requerido',
          text: 'Por favor ingresa un número de teléfono válido para WhatsApp.',
          confirmButtonColor: '#0e3b72'
        });
        return;
      }
      this.envio.destinatario = this.telefonoWhatsapp.trim();
    } else {
      if (this.selectedUsuario && this.selectedUsuario.email) {
        this.envio.destinatario = this.selectedUsuario.email;
      }
    }

    if (!this.envio.usuarioId || !this.envio.destinatario) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta destinatario',
        text: 'Por favor selecciona un usuario y verifica el campo de destino.',
        confirmButtonColor: '#0e3b72'
      });
      return;
    }

    this.notificationService.enviarNotificacionManual(this.rolAdmin, this.envio).subscribe({
      next: (res: { message?: string }) => {
        this.esError = false;
        this.mensajeResultado = res?.message || 'Notificación enviada con éxito';
        Swal.fire({
          icon: 'success',
          title: '¡Enviado!',
          text: this.mensajeResultado,
          confirmButtonColor: '#0e3b72',
          timer: 2000
        });
      },
      error: (err: any) => {
        this.esError = true;
        this.mensajeResultado = err.error?.message || 'Error al enviar la notificación';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.mensajeResultado,
          confirmButtonColor: '#0e3b72'
        });
      }
    });
  }

  getUsuarioFoto(usuario: any): string | null {
    if (!usuario) return null;
    let rawUrl = usuario.fotoUrl || usuario.fotoPerfil || usuario.foto || usuario.avatar || null;
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    rawUrl = rawUrl.trim();
    if (rawUrl === '' || rawUrl === 'null' || rawUrl === 'undefined') return null;
    if (rawUrl.startsWith('//')) return `https:${rawUrl}`;
    return rawUrl;
  }

  onAvatarError(): void {
    this.avatarSelectedError = true;
  }

  hasAvatarError(): boolean {
    return this.avatarSelectedError;
  }

  hasModalAvatarError(id: number): boolean {
    return this.modalAvatarErrors.has(id);
  }

  getInitials(username?: string, email?: string): string {
    if (username && username.trim().length > 0) {
      return username.trim().substring(0, 2).toUpperCase();
    }
    if (email && email.trim().length > 0) {
      return email.trim().substring(0, 2).toUpperCase();
    }
    return 'US';
  }

  getRolLabel(rol: string): string {
    if (!rol) return 'Socio';
    const r = rol.toUpperCase();
    if (r.includes('ADMIN')) return 'Administrador';
    if (r.includes('RECEPCIONISTA')) return 'Recepcionista';
    if (r.includes('ENTRENADOR')) return 'Entrenador';
    return 'Socio';
  }

  getRolClass(rol: string): string {
    if (!rol) return 'rol-socio';
    const r = rol.toUpperCase();
    if (r.includes('ADMIN')) return 'rol-admin';
    if (r.includes('RECEPCIONISTA')) return 'rol-recep';
    if (r.includes('ENTRENADOR')) return 'rol-entrenador';
    return 'rol-socio';
  }
}