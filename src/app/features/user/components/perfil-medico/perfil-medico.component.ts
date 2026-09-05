import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-perfil-medico',
  templateUrl: './perfil-medico.component.html',
  styleUrls: ['./perfil-medico.component.scss']
})
export class PerfilMedicoComponent implements OnInit {
  public isLoading: boolean = true;
  public error: string | null = null;
  public fotoUrl: string = '';
  
  // Modo edición
  public editando: boolean = false;
  public guardando: boolean = false;
  public mensajeExito: string | null = null;

  public perfilMedico: any = {
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

  public perfilMedicoBackup: any = {};

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.cargarPerfilMedico();
  }

  cargarPerfilMedico(): void {
    this.isLoading = true;
    this.error = null;

    // Cargar perfil médico
    this.userService.getPerfilMedico().subscribe({
      next: (data: any) => {
        if (data) {
          this.perfilMedico = {
            idPerfilMedico: data.idPerfilMedico,
            idSocio: data.idSocio,
            nombreSocio: data.nombreSocio || this.obtenerNombreSocio(),
            pesoKg: data.pesoKg || 0,
            estaturaCm: data.estaturaCm || 0,
            porcentajeGrasa: data.porcentajeGrasa || null,
            alergias: data.alergias || '',
            condicionesCronicas: data.condicionesCronicas || '',
            lesionesPrevias: data.lesionesPrevias || '',
            fechaActualizacion: data.fechaActualizacion || new Date().toISOString()
          };
          this.perfilMedicoBackup = { ...this.perfilMedico };
          this.isLoading = false;
        } else {
          this.error = 'No se pudo cargar la información médica.';
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al cargar perfil médico:', error);

        if (error.status === 401) {
          this.errorModalTitle = 'Sesion expirada';
          this.errorModalMessage = 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.';
        } else if (error.status === 404) {
          this.errorModalTitle = 'No encontrado';
          this.errorModalMessage = 'No se encontró información médica para este usuario.';
        } else if (error.status === 500) {
          this.errorModalTitle = 'Error del servidor';
          this.errorModalMessage = 'El servidor no esta disponible. Por favor, intenta mas tarde.';
        } else {
          this.errorModalTitle = 'Error al cargar';
          this.errorModalMessage = error.error?.message || 'Error al cargar la información médica.';
        }
        this.showErrorModal = true;
      }
    });

    // Cargar foto de perfil
    this.userService.getUserProfile().subscribe({
      next: (data: any) => {
        if (data && data.fotoUrl) {
          this.fotoUrl = data.fotoUrl;
        }
      },
      error: () => {
        // Si no hay foto, se muestra el avatar con iniciales
      }
    });
  }

  obtenerNombreSocio(): string {
    const user = this.authService.getUser();
    return user?.name || user?.username || 'Usuario';
  }

  // ============================================
  // FUNCIONES DE EDICIÓN
  // ============================================
  activarEdicion(): void {
    this.perfilMedicoBackup = { ...this.perfilMedico };
    this.editando = true;
    this.mensajeExito = null;
    this.error = null;
  }

  cancelarEdicion(): void {
    this.perfilMedico = { ...this.perfilMedicoBackup };
    this.editando = false;
    this.mensajeExito = null;
    this.error = null;
  }

  guardarCambios(): void {
    // Validar campos obligatorios
    if (!this.perfilMedico.pesoKg || this.perfilMedico.pesoKg <= 0) {
      this.error = 'El peso es obligatorio y debe ser mayor a 0.';
      return;
    }

    if (!this.perfilMedico.estaturaCm || this.perfilMedico.estaturaCm <= 0) {
      this.error = 'La estatura es obligatoria y debe ser mayor a 0.';
      return;
    }

    this.guardando = true;
    this.error = null;
    this.mensajeExito = null;

    const payload = {
      pesoKg: this.perfilMedico.pesoKg,
      estaturaCm: this.perfilMedico.estaturaCm,
      porcentajeGrasa: this.perfilMedico.porcentajeGrasa || null,
      alergias: this.perfilMedico.alergias || '',
      condicionesCronicas: this.perfilMedico.condicionesCronicas || '',
      lesionesPrevias: this.perfilMedico.lesionesPrevias || ''
    };

    console.log('Enviando datos al backend:', JSON.stringify(payload, null, 2));

    this.userService.actualizarPerfilMedico(payload).subscribe({
      next: (response: any) => {
        this.guardando = false;
        if (response) {
          this.editando = false;
          this.perfilMedicoBackup = { ...this.perfilMedico };
          this.mensajeExito = 'Información médica actualizada correctamente';
          this.perfilMedico.fechaActualizacion = new Date().toISOString();
          
          setTimeout(() => {
            this.mensajeExito = null;
          }, 3000);
        } else {
          this.error = 'Error al guardar los cambios. Verifica los datos e intenta de nuevo.';
        }
      },
      error: (error: any) => {
        this.guardando = false;
        console.error('Error al actualizar perfil médico:', error);
        this.errorModalTitle = 'Error al guardar';
        this.errorModalMessage = error.error?.message || 'Error al guardar los cambios. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  formatFecha(fecha: string): string {
    if (!fecha) return 'No registrada';
    const date = new Date(fecha);
    const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const diaSemana = dias[date.getDay()];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    return `${diaSemana}, ${dia} ${mes} ${anio} - ${horas}:${minutos}`;
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  volver(): void {
    if (this.editando) {
      this.cancelarEdicion();
    } else {
      this.router.navigate(['/user/profile']);
    }
  }

  onRetry(): void {
    this.showErrorModal = false;
    this.guardarCambios();
  }

  onCloseModal(): void {
    this.showErrorModal = false;
    if (this.errorModalTitle === 'Sesion expirada') {
      this.router.navigate(['/auth/login']);
    }
  }
}