import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NutricionalService } from '../../../../../core/services/nutricional.service';

export interface EditarPlanPayload {
  caloriasDiarias: number;
  proteinasG: number;
  carbohidratosG: number;
  grasasG: number;
  restriccionesDieteticas: string[];
  motivo: string;
}

@Component({
  selector: 'app-editar-plan',
  templateUrl: './editar-plan.component.html',
  styleUrls: ['./editar-plan.component.scss']
})
export class EditarPlanComponent implements OnInit {
  public planForm: FormGroup;
  public isLoading: boolean = false;
  public showSuccessModal: boolean = false;
  public showErrorModal: boolean = false;
  public errorMessage: string = '';
  public planId: number = 0;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private nutricionalService: NutricionalService
  ) {
    this.planForm = this.fb.group({
      caloriasDiarias: ['', [Validators.required, Validators.min(500), Validators.max(5000)]],
      proteinasG: ['', [Validators.required, Validators.min(0), Validators.max(500)]],
      carbohidratosG: ['', [Validators.required, Validators.min(0), Validators.max(1000)]],
      grasasG: ['', [Validators.required, Validators.min(0), Validators.max(300)]],
      restriccionesDieteticas: [''],
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.planId = Number(idParam);
    
    if (!this.planId || isNaN(this.planId)) {
      this.router.navigate(['/user/plan-nutricional']);
      return;
    }
    
    this.cargarDatosPlan();
  }

  cargarDatosPlan(): void {
    this.isLoading = true;
    this.nutricionalService.getPlanById(this.planId).subscribe({
      next: (plan) => {
        this.planForm.patchValue({
          caloriasDiarias: plan.calorias_diarias,
          proteinasG: plan.proteinas_g,
          carbohidratosG: plan.carbohidratos_g,
          grasasG: plan.grasas_g,
          restriccionesDieteticas: plan.restricciones_dieteticas?.join(', ') || '',
          motivo: ''
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar plan:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al cargar los datos del plan.';
        this.showErrorModal = true;
      }
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
    
    const restricciones = formValue.restriccionesDieteticas
      ? formValue.restriccionesDieteticas.split(',').map((item: string) => item.trim()).filter((item: string) => item !== '')
      : [];

    const payload: EditarPlanPayload = {
      caloriasDiarias: Number(formValue.caloriasDiarias),
      proteinasG: Number(formValue.proteinasG),
      carbohidratosG: Number(formValue.carbohidratosG),
      grasasG: Number(formValue.grasasG),
      restriccionesDieteticas: restricciones,
      motivo: formValue.motivo
    };

    console.log('Enviando payload:', payload);

    this.nutricionalService.editarPlan(payload).subscribe({
      next: (response) => {
        console.log('Plan actualizado:', response);
        this.isLoading = false;
        this.showSuccessModal = true;
      },
      error: (error) => {
        console.error('Error al actualizar plan:', error);
        console.error('Detalle del error:', error.error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al actualizar el plan nutricional.';
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

  cancelar(): void {
    this.router.navigate(['/user/plan-nutricional']);
  }

  volver(): void {
    this.router.navigate(['/user/plan-nutricional']);
  }
}