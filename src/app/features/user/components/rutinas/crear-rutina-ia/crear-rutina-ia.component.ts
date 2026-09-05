import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RutinasService, GenerarRutinaIARequest, RutinaDetalle } from '../../../../../core/services/rutinas.service';

@Component({
  selector: 'app-crear-rutina-ia',
  templateUrl: './crear-rutina-ia.component.html',
  styleUrls: ['./crear-rutina-ia.component.scss']
})
export class CrearRutinaIaComponent {
  public isLoading: boolean = false;
  public errorMessage: string = '';

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  public datosIA: GenerarRutinaIARequest = {
    diasPorSemana: 4,
    duracionSemanas: 4,
    incluirCardio: true
  };

  public diasDisponibles: { label: string; value: number }[] = [
    { label: '2-3 dias', value: 3 },
    { label: '4-5 dias', value: 5 },
    { label: '6-7 dias', value: 7 }
  ];

  public duracionesSemanas: { label: string; value: number }[] = [
    { label: '2 semanas', value: 2 },
    { label: '4 semanas', value: 4 },
  ];

  constructor(
    private router: Router,
    private rutinasService: RutinasService
  ) {}

  cancelar(): void {
    this.router.navigate(['/user/rutinas']);
  }

  generarRutinaIA(): void {
    console.log('Enviando datos:', this.datosIA);

    this.isLoading = true;
    this.errorMessage = '';

    this.rutinasService.generarRutinaIA(this.datosIA).subscribe({
      next: (response: RutinaDetalle) => {
        this.isLoading = false;
        this.router.navigate(['/user/rutinas/detalle', response.idRutina]);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al generar rutina:', error);

        if (error.status === 401) {
          this.errorModalTitle = 'Sesion expirada';
          this.errorModalMessage = 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.';
        } else if (error.status === 400) {
          this.errorModalTitle = 'Datos invalidos';
          this.errorModalMessage = error.error?.message || 'Verifica que todos los campos sean correctos.';
        } else if (error.status === 500) {
          this.errorModalTitle = 'Error del servidor';
          this.errorModalMessage = 'El servidor no esta disponible. Por favor, intenta mas tarde.';
        } else {
          this.errorModalTitle = 'Error al generar';
          this.errorModalMessage = error.error?.message || 'Error al generar la rutina. Por favor, intenta de nuevo.';
        }
        this.showErrorModal = true;
      }
    });
  }

  onRetry(): void {
    this.showErrorModal = false;
    this.generarRutinaIA();
  }

  onCloseModal(): void {
    this.showErrorModal = false;
    if (this.errorModalTitle === 'Sesion expirada') {
      this.router.navigate(['/auth/login']);
    }
  }
}