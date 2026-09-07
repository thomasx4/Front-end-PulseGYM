import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NutricionalService, PlanNutricionalReal } from '../../../../../core/services/nutricional.service';

@Component({
  selector: 'app-exportar-plan',
  templateUrl: './exportar-plan.component.html',
  styleUrls: ['./exportar-plan.component.scss']
})
export class ExportarPlanComponent implements OnInit {
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public planes: PlanNutricionalReal[] = [];

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  constructor(
    private router: Router,
    private nutricionalService: NutricionalService
  ) {}

  ngOnInit(): void {
    this.cargarPlanes();
  }

  cargarPlanes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.nutricionalService.getMisPlanes().subscribe({
      next: (response: PlanNutricionalReal[]) => {
        this.planes = response || [];
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al cargar planes:', error);

        if (error.status === 401) {
          this.errorModalTitle = 'Sesión expirada';
          this.errorModalMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 404) {
          this.planes = [];
          this.errorMessage = 'No tienes planes nutricionales guardados.';
          return;
        } else if (error.status === 500) {
          this.errorModalTitle = 'Error del servidor';
          this.errorModalMessage = 'El servidor no está disponible. Por favor, intenta más tarde.';
        } else {
          this.errorModalTitle = 'Error al cargar';
          this.errorModalMessage = error.error?.message || 'Error al cargar los planes.';
        }
        this.showErrorModal = true;
      }
    });
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    return `${dia} ${mes} ${anio}`;
  }

  exportarPlanEspecifico(idPlan: number): void {
    if (!idPlan) return;

    this.isLoading = true;

    this.nutricionalService.exportarPlanPDF(idPlan).subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const plan = this.planes.find(p => p.idPlanNutricional === idPlan);
        link.download = `plan-nutricional-${plan?.idPlanNutricional || idPlan}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al exportar PDF:', error);
        this.errorModalTitle = 'Error al exportar';
        this.errorModalMessage = error.error?.message || 'No se pudo exportar el PDF. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  exportarUltimoPlan(): void {
    this.isLoading = true;

    this.nutricionalService.exportarUltimoPlanPDF().subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `plan-nutricional-ultimo.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al exportar último plan:', error);
        this.errorModalTitle = 'Error al exportar';
        this.errorModalMessage = error.error?.message || 'No se pudo exportar el último plan. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/user/plan-nutricional']);
  }

  onRetry(): void {
    this.showErrorModal = false;
    this.cargarPlanes();
  }

  onCloseModal(): void {
    this.showErrorModal = false;
    if (this.errorModalTitle === 'Sesión expirada') {
      this.router.navigate(['/auth/login']);
    }
  }
}