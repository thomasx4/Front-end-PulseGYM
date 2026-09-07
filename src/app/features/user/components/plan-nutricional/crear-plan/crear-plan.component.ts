import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NutricionalService, GenerarPlanPayload } from '../../../../../core/services/nutricional.service';

@Component({
  selector: 'app-crear-plan',
  templateUrl: './crear-plan.component.html',
  styleUrls: ['./crear-plan.component.scss']
})
export class CrearPlanComponent {
  public planForm: FormGroup;
  public isLoading: boolean = false;
  public showSuccessModal: boolean = false;
  public showErrorModal: boolean = false;
  public errorMessage: string = '';
  public planGenerado: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private nutricionalService: NutricionalService
  ) {
    this.planForm = this.fb.group({
      objetivo_especifico: ['', Validators.required],
      restricciones_dieteticas: [''],
      alergias: [''],
      intolerancias: ['']
    });
  }

  onSubmit(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.showErrorModal = false;
    this.errorMessage = '';

    const formValue = this.planForm.value;

    const procesarTexto = (texto: string): string[] => {
      if (!texto || texto.trim() === '') return [];
      return texto.split(',').map((item: string) => item.trim()).filter((item: string) => item !== '');
    };

    // 👈 Usando el formato con guiones bajos que espera GenerarPlanPayload
    const payload: GenerarPlanPayload = {
      restricciones_dieteticas: procesarTexto(formValue.restricciones_dieteticas),
      alergias: procesarTexto(formValue.alergias),
      intolerancias: procesarTexto(formValue.intolerancias),
      objetivo_especifico: formValue.objetivo_especifico
    };

    console.log('Enviando payload:', payload);

    this.nutricionalService.generarPlan(payload).subscribe({
      next: (response: any) => {
        console.log('Plan generado:', response);
        this.isLoading = false;
        this.planGenerado = response;
        this.showSuccessModal = true;
      },
      error: (error) => {
        console.error('Error al generar plan:', error);
        console.error('Detalle del error:', error.error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al generar el plan nutricional. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  cerrarSuccessModal(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/user/plan-nutricional']);
  }

  cerrarErrorModal(): void {
    this.showErrorModal = false;
  }

  cancelarCreacion(): void {
    this.router.navigate(['/user/plan-nutricional']);
  }
}