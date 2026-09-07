import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NutricionalService, PlanNutricionalReal } from '../../../../../core/services/nutricional.service';

@Component({
  selector: 'app-detalle-plan',
  templateUrl: './detalle-plan.component.html',
  styleUrls: ['./detalle-plan.component.scss']
})
export class DetallePlanComponent implements OnInit {
  public plan: PlanNutricionalReal | null = null;
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public showErrorModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nutricionalService: NutricionalService
  ) {}

  ngOnInit(): void {
    this.cargarPlan();
  }

  cargarPlan(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.router.navigate(['/user/plan-nutricional']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.nutricionalService.getPlanById(Number(id)).subscribe({
      next: (response: PlanNutricionalReal) => {
        this.plan = response;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar plan:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al cargar el plan nutricional. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/user/plan-nutricional']);
  }

  // 👈 Método para navegar a editar
  editarPlan(): void {
    if (this.plan) {
      this.router.navigate(['/user/plan-nutricional/editar', this.plan.idPlanNutricional]);
    }
  }

  cerrarErrorModal(): void {
    this.showErrorModal = false;
    this.volver();
  }

  onRetry(): void {
    this.showErrorModal = false;
    this.cargarPlan();
  }
}