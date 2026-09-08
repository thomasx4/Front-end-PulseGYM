import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ThemeService } from '../../../../core/services/theme.service';
import { AjustesService } from '../../../../core/services/ajustes.service';

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
  public errorMessage: string = '';
  public isDarkMode: boolean = false;

  private readonly soporteEmail = 'soportepulsegym@gmail.com';

  // URLs de los PDFs en Google Drive
  private readonly urlPdfGeneral = 'https://drive.google.com/file/d/1LafUWZUpaYUWZKMCojw9MwXzEXv4qB2J/view?usp=sharing';
  
  // URL para FAQ
  private readonly urlFaq = 'https://drive.google.com/file/d/1LafUWZUpaYUWZKMCojw9MwXzEXv4qB2J/view?usp=sharing';

  public canalesNotificacion = [
    { value: 'AMBOS', label: 'Email y Push' },
    { value: 'EMAIL', label: 'Solo Email' },
    { value: 'PUSH', label: 'Solo Push' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private themeService: ThemeService,
    private ajustesService: AjustesService
  ) {
    this.isDarkMode = this.themeService.isDarkMode();
    
    this.ajustesForm = this.fb.group({
      modoOscuro: [this.isDarkMode],
      canalNotificacion: ['AMBOS']
    });
  }

  ngOnInit(): void {
    this.cargarPreferencias();

    this.ajustesForm.get('modoOscuro')?.valueChanges.subscribe((isDark: boolean) => {
      this.isDarkMode = isDark;
      this.themeService.setTheme(isDark ? 'dark' : 'light');
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
        
        this.ajustesForm.patchValue({
          canalNotificacion: data.preferencia || 'AMBOS'
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar preferencias:', error);
        this.isLoading = false;
        this.ajustesForm.patchValue({
          canalNotificacion: 'AMBOS'
        });
      }
    });
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
      logrosHabilitado: false,
      mantenimientosHabilitado: false,
      promocionesHabilitado: false
    };

    console.log('Guardando preferencias:', payload);

    this.ajustesService.actualizarPreferencias(payload).subscribe({
      next: (response) => {
        console.log('Preferencias guardadas:', response);
        this.isLoading = false;
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
      '[Describe aquí tu consulta]\n\n' +
      'Quedo atento a su respuesta.\n\n' +
      'Saludos cordiales.'
    );
    
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${asunto}&body=${cuerpo}`,
      '_blank'
    );
  }

  verTerminos(): void {
    window.open(this.urlPdfGeneral, '_blank');
  }

  verPrivacidad(): void {
    window.open(this.urlPdfGeneral, '_blank');
  }

  verFAQ(): void {
    window.open(this.urlFaq, '_blank');
  }

  cerrarSuccessModal(): void {
    this.showSuccessModal = false;
  }

  cerrarErrorModal(): void {
    this.showErrorModal = false;
  }

  volver(): void {
    this.router.navigate(['/user/profile']);
  }
}