import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntrenadorService } from '../../../../../core/services/entrenador.service';

export interface PerfilMedico {
  idPerfilMedico: number | null;
  idSocio: number | null;
  nombreSocio: string;
  pesoKg: number | null;
  estaturaCm: number | null;
  porcentajeGrasa: number | null;
  alergias: string;
  condicionesCronicas: string;
  lesionesPrevias: string;
  fechaActualizacion: string;
}

@Component({
  selector: 'app-detalle-medico',
  templateUrl: './detalle-medico.component.html',
  styleUrls: ['./detalle-medico.component.scss']
})
export class DetalleMedicoComponent implements OnInit {

  idSocio: number = 0;

  perfilMedico: PerfilMedico = this.getPerfilVacio();
  perfilBackup: PerfilMedico = this.getPerfilVacio();

  // Foto del socio
  fotoSocio: string = '';

  isLoading: boolean = true;
  isSaving: boolean = false;
  editando: boolean = false;
  error: string | null = null;
  mensajeExito: string | null = null;

  mostrarModalError: boolean = false;
  modalErrorMessage: string = '';

  // Control de menú lateral (Hamburguesa)
  isSidebarOpen: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entrenadorService: EntrenadorService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idSocio = Number(params['idSocio']) || 0;

      if (!this.idSocio) {
        this.error = 'No se especifico un socio valido';
        this.isLoading = false;
        return;
      }

      this.cargarFotoSocio();
      this.cargarPerfilMedico();
    });
  }

  // ==========================================
  // MÉTODOS DE MENÚ LATERAL (HAMBURGUESA)
  // ==========================================
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  // ==========================================
  // Cargar foto del socio
  // ==========================================
  cargarFotoSocio(): void {
    this.entrenadorService.getUsuarios().subscribe({
      next: (usuarios: any) => {
        const lista = Array.isArray(usuarios) ? usuarios : [];
        const socio = lista.find((u: any) => u.idUsuario === this.idSocio);

        if (socio?.fotoUrl && !socio.fotoUrl.includes('socio_default_avatar')) {
          this.fotoSocio = socio.fotoUrl;
        } else {
          this.fotoSocio = '';
        }
      },
      error: (err) => {
        console.warn('No se pudo cargar la foto del socio:', err);
        this.fotoSocio = '';
      }
    });
  }

  // ==========================================
  // Cargar perfil médico
  // ==========================================
  cargarPerfilMedico(): void {
    this.isLoading = true;
    this.error = null;

    this.entrenadorService.getPerfilMedicoPorSocio(this.idSocio).subscribe({
      next: (data: any) => {
        if (data) {
          this.perfilMedico = {
            idPerfilMedico: data.idPerfilMedico || null,
            idSocio: data.idSocio || this.idSocio,
            nombreSocio: data.nombreSocio || 'Socio',
            pesoKg: data.pesoKg ?? null,
            estaturaCm: data.estaturaCm ?? null,
            porcentajeGrasa: data.porcentajeGrasa ?? null,
            alergias: data.alergias || '',
            condicionesCronicas: data.condicionesCronicas || '',
            lesionesPrevias: data.lesionesPrevias || '',
            fechaActualizacion: data.fechaActualizacion || ''
          };
        } else {
          this.perfilMedico = { ...this.getPerfilVacio(), idSocio: this.idSocio };
        }

        this.perfilBackup = { ...this.perfilMedico };
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.perfilMedico = { ...this.getPerfilVacio(), idSocio: this.idSocio };
          this.perfilBackup = { ...this.perfilMedico };
          this.isLoading = false;
        } else {
          this.isLoading = false;
          this.mostrarErrorModal('No se pudo cargar el perfil medico del socio.');
        }
      }
    });
  }

  // ==========================================
  // Editar / Guardar
  // ==========================================
  activarEdicion(): void {
    this.perfilBackup = { ...this.perfilMedico };
    this.editando = true;
    this.mensajeExito = null;
    this.error = null;
  }

  cancelarEdicion(): void {
    this.perfilMedico = { ...this.perfilBackup };
    this.editando = false;
    this.mensajeExito = null;
    this.error = null;
  }

  guardarCambios(): void {
    if (!this.idSocio) {
      this.error = 'No hay socio seleccionado';
      return;
    }

    // Validaciones
    if (this.perfilMedico.pesoKg === null || this.perfilMedico.pesoKg <= 0) {
      this.error = 'El peso es obligatorio y debe ser mayor a 0';
      return;
    }
    if (this.perfilMedico.estaturaCm === null || this.perfilMedico.estaturaCm <= 0) {
      this.error = 'La estatura es obligatoria y debe ser mayor a 0';
      return;
    }
    if (this.perfilMedico.porcentajeGrasa !== null &&
        (this.perfilMedico.porcentajeGrasa < 0 || this.perfilMedico.porcentajeGrasa > 100)) {
      this.error = 'El porcentaje de grasa debe estar entre 0 y 100';
      return;
    }

    this.isSaving = true;
    this.error = null;

    const payload = {
      idSocio: this.idSocio,
      pesoKg: this.perfilMedico.pesoKg,
      estaturaCm: this.perfilMedico.estaturaCm,
      porcentajeGrasa: this.perfilMedico.porcentajeGrasa,
      alergias: this.perfilMedico.alergias || '',
      condicionesCronicas: this.perfilMedico.condicionesCronicas || '',
      lesionesPrevias: this.perfilMedico.lesionesPrevias || ''
    };

    const peticion = this.perfilMedico.idPerfilMedico
      ? this.entrenadorService.actualizarPerfilMedico(this.idSocio, payload)
      : this.entrenadorService.crearPerfilMedico(payload);

    peticion.subscribe({
      next: () => {
        this.isSaving = false;
        this.editando = false;
        this.mensajeExito = 'Perfil medico actualizado correctamente';

        this.cargarPerfilMedico();

        setTimeout(() => {
          this.mensajeExito = null;
        }, 2500);
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err.error?.message || 'Error al guardar los cambios. Intenta de nuevo.';
      }
    });
  }

  // ==========================================
  // Navegación
  // ==========================================
  volver(): void {
    this.router.navigate(['/trainer/perfil-medico']);
  }

  // ==========================================
  // Helpers
  // ==========================================
  private getPerfilVacio(): PerfilMedico {
    return {
      idPerfilMedico: null,
      idSocio: null,
      nombreSocio: '',
      pesoKg: null,
      estaturaCm: null,
      porcentajeGrasa: null,
      alergias: '',
      condicionesCronicas: '',
      lesionesPrevias: '',
      fechaActualizacion: ''
    };
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No registrada';
    try {
      const d = new Date(fecha);
      const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} - ${hh}:${mm}`;
    } catch {
      return fecha;
    }
  }

  getIniciales(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    this.fotoSocio = '';
  }

  mostrarErrorModal(mensaje: string): void {
    this.modalErrorMessage = mensaje;
    this.mostrarModalError = true;
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
  }
}