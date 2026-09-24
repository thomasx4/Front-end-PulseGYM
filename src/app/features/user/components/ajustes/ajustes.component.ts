import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ThemeService } from '../../../../core/services/theme.service';
import { AjustesService } from '../../../../core/services/ajustes.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BiometricService } from '../../../../core/services/biometric.service';
import { EstadoEscaneoHuella } from '../../../../shared/components/fingerprint-scanner/fingerprint-scanner.component';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.scss']
})
export class AjustesComponent implements OnInit {
  public ajustesForm: FormGroup;
  public isLoading: boolean = false;
  public showSuccessModal: boolean = false;
  public showErrorModal: boolean = false;
  public showUnsavedModal: boolean = false;
  public errorMessage: string = '';
  public isDarkMode: boolean = false;

  // Estado inicial guardado para comparar si hubo cambios
  private initialFormValues: any = null;
  private permitirSalida: boolean = false;

  // Huella digital (simulada)
  public huellaActivaEnDispositivo: boolean = false;
  public mostrarModalHuella: boolean = false;
  public modoHuella: 'activar' | 'eliminar' = 'activar';
  public huellaEstado: EstadoEscaneoHuella = 'idle';
  public huellaMensaje: string = '';
  private userId: number = 0;

  private readonly soporteEmail = 'soportepulsegym@gmail.com';
  private readonly urlPdfGeneral = 'https://drive.google.com/file/d/1LafUWZUpaYUWZKMCojw9MwXzEXv4qB2J/view?usp=sharing';
  private readonly urlFaq = 'https://drive.google.com/file/d/1LafUWZUpaYUWZKMCojw9MwXzEXv4qB2J/view?usp=sharing';

  public canalesNotificacion = [
    { value: 'AMBOS', label: 'Email y WhatsApp' },
    { value: 'EMAIL', label: 'Solo Email' },
    { value: 'WHATSAPP', label: 'Solo WhatsApp' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private themeService: ThemeService,
    private ajustesService: AjustesService,
    private authService: AuthService,
    private biometricService: BiometricService
  ) {
    this.isDarkMode = this.themeService.isDarkMode();

    this.ajustesForm = this.fb.group({
      modoOscuro: [this.isDarkMode],
      canalNotificacion: ['AMBOS'],
      logrosHabilitado: [true],
      mantenimientosHabilitado: [true],
      promocionesHabilitado: [true]
    });
  }

  ngOnInit(): void {
    this.cargarPreferencias();

    this.ajustesForm.get('modoOscuro')?.valueChanges.subscribe((isDark: boolean) => {
      this.isDarkMode = isDark;
      this.themeService.setTheme(isDark ? 'dark' : 'light');
    });

    this.biometricService.obtenerIdPerfil().subscribe({
      next: (idUsuario) => {
        this.userId = idUsuario;
        this.huellaActivaEnDispositivo = this.biometricService.hayHuellaEnEsteDispositivo(this.userId);
      },
      error: () => {
        this.userId = 0;
      }
    });
  }

  seleccionarCanal(canal: string): void {
    this.ajustesForm.patchValue({ canalNotificacion: canal });
  }

  cargarPreferencias(): void {
    this.isLoading = true;
    this.ajustesService.getMisPreferencias().subscribe({
      next: (response) => {
        const data = response.data || response;
        console.log('Preferencias cargadas:', data);

        const loadedValues = {
          modoOscuro: this.isDarkMode,
          canalNotificacion: data.preferencia || 'AMBOS',
          logrosHabilitado: data.logrosHabilitado ?? true,
          mantenimientosHabilitado: data.mantenimientosHabilitado ?? true,
          promocionesHabilitado: data.promocionesHabilitado ?? true
        };

        this.ajustesForm.patchValue(loadedValues);
        this.initialFormValues = JSON.stringify(this.ajustesForm.value);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar preferencias:', error);
        this.isLoading = false;
        const defaultValues = {
          modoOscuro: this.isDarkMode,
          canalNotificacion: 'AMBOS',
          logrosHabilitado: true,
          mantenimientosHabilitado: true,
          promocionesHabilitado: true
        };
        this.ajustesForm.patchValue(defaultValues);
        this.initialFormValues = JSON.stringify(this.ajustesForm.value);
      }
    });
  }

  tieneCambiosPendientes(): boolean {
    if (!this.initialFormValues) return false;
    const currentValues = JSON.stringify(this.ajustesForm.value);
    return currentValues !== this.initialFormValues;
  }

  // Método requerido por el Guard cuando se intenta cambiar de ruta mediante el menú lateral u otra sección
  mostrarModalCambiosPendientes(): void {
    this.showUnsavedModal = true;
  }

  // Método que ejecuta el CanDeactivate Guard automáticamente
  canDeactivate(): boolean {
    if (this.tieneCambiosPendientes() && !this.permitirSalida) {
      this.showUnsavedModal = true;
      return false;
    }
    return true;
  }

  intentarVolver(): void {
    if (this.tieneCambiosPendientes()) {
      this.showUnsavedModal = true;
    } else {
      this.volverRutaDestino();
    }
  }

  irAGuardar(): void {
    this.showUnsavedModal = false;
    const element = document.getElementById('seccion-guardar');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  descartarYSalir(): void {
    this.showUnsavedModal = false;
    this.permitirSalida = true; // Autoriza el cambio de ruta
    this.volverRutaDestino();
  }

  guardarAjustes(): void {
    if (this.ajustesForm.invalid) {
      this.ajustesForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.showErrorModal = false;
    this.errorMessage = '';

    const formValue = this.ajustesForm.value;

    this.themeService.setTheme(formValue.modoOscuro ? 'dark' : 'light');

    const payload = {
      preferencia: formValue.canalNotificacion,
      logrosHabilitado: formValue.logrosHabilitado,
      mantenimientosHabilitado: formValue.mantenimientosHabilitado,
      promocionesHabilitado: formValue.promocionesHabilitado
    };

    console.log('Guardando preferencias:', payload);

    this.ajustesService.actualizarPreferencias(payload).subscribe({
      next: (response) => {
        console.log('Preferencias guardadas:', response);
        this.isLoading = false;
        this.initialFormValues = JSON.stringify(this.ajustesForm.value);
        this.showSuccessModal = true;
      },
      error: (error) => {
        console.error('Error al guardar preferencias:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al guardar las preferencias. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  contactarSoporte(): void {
    const email = this.soporteEmail;
    const asunto = encodeURIComponent('Consulta - Pulse Gym');
    const cuerpo = encodeURIComponent(
      'Hola, equipo de Pulse Gym.\n\n' +
      'Me comunico con ustedes para consultar sobre:\n\n' +
      '[Describe aqui tu consulta]\n\n' +
      'Quedo atento a su respuesta.\n\n' +
      'Saludos cordiales.'
    );

    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${asunto}&body=${cuerpo}`,
      '_blank'
    );
  }

  verTerminos(): void {
    this.router.navigate(['/politicas']);
  }

  verPrivacidad(): void {
    this.router.navigate(['/politicas']);
  }

  verFAQ(): void {
    this.router.navigate(['/politicas']);
  }

  cerrarSuccessModal(): void {
    this.showSuccessModal = false;
    this.permitirSalida = true;
    this.volverRutaDestino();
  }

  cerrarErrorModal(): void {
    this.showErrorModal = false;
  }

  volverRutaDestino(): void {
    this.permitirSalida = true;
    this.router.navigate(['/user/profile']);
  }

  volver(): void {
    this.intentarVolver();
  }

  public isSidebarOpen: boolean = false;

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  // ==========================================
  // Huella digital (simulada)
  // ==========================================
  abrirActivarHuella(): void {
    this.modoHuella = 'activar';
    this.huellaEstado = 'idle';
    this.huellaMensaje = 'Coloca tu huella para activarla en este dispositivo';
    this.mostrarModalHuella = true;
  }

  abrirEliminarHuella(): void {
    this.modoHuella = 'eliminar';
    this.huellaEstado = 'idle';
    this.huellaMensaje = 'Escanea tu huella para eliminarla de este dispositivo';
    this.mostrarModalHuella = true;
  }

  cerrarModalHuella(): void {
    if (this.huellaEstado === 'escaneando') {
      return;
    }
    this.mostrarModalHuella = false;
  }

  onEscanearHuella(): void {
    if (!this.userId) {
      this.huellaEstado = 'error';
      this.huellaMensaje = 'No se pudo identificar tu usuario. Vuelve a iniciar sesión.';
      return;
    }

    this.huellaEstado = 'escaneando';
    this.huellaMensaje = 'Leyendo huella digital...';

    const nombreUsuario = this.authService.getUser()?.name;
    const accion$ = this.modoHuella === 'activar'
      ? this.biometricService.registrarHuella(this.userId, nombreUsuario)
      : this.biometricService.eliminarHuella(this.userId);

    timer(1400).pipe(
      switchMap(() => accion$)
    ).subscribe({
      next: (mensaje: string) => {
        this.huellaEstado = 'exito';
        this.huellaMensaje = mensaje;
        this.huellaActivaEnDispositivo = this.modoHuella === 'activar';

        setTimeout(() => {
          this.mostrarModalHuella = false;
        }, 1200);
      },
      error: (error: any) => {
        this.huellaEstado = 'error';
        this.huellaMensaje = error?.error?.message || error?.message || 'No se pudo procesar la huella. Intenta de nuevo.';
      }
    });
  }
}