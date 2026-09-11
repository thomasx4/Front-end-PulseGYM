import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NutricionalService,
  PlanNutricionalReal,
  HistorialPlanVersion
} from '../../../../../core/services/nutricional.service';

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

  // Historial de versiones
  public historial: HistorialPlanVersion[] = [];
  public cargandoHistorial: boolean = false;
  public versionExpandida: number | null = null;

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
        this.cargarHistorial(Number(id));
      },
      error: (error: any) => {
        console.error('Error al cargar plan:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al cargar el plan nutricional. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  // Historial de versiones
  cargarHistorial(idPlan: number): void {
    this.cargandoHistorial = true;

    this.nutricionalService.getHistorialPlan(idPlan).subscribe({
      next: (response: HistorialPlanVersion[]) => {
        this.historial = response || [];
        this.cargandoHistorial = false;
      },
      error: (error: any) => {
        console.error('Error al cargar historial:', error);
        this.historial = [];
        this.cargandoHistorial = false;
      }
    });
  }

  // Acordeon del historial
  toggleVersion(idHistorial: number): void {
    if (this.versionExpandida === idHistorial) {
      this.versionExpandida = null;
    } else {
      this.versionExpandida = idHistorial;
    }
  }

  isVersionExpandida(idHistorial: number): boolean {
    return this.versionExpandida === idHistorial;
  }

  // Devuelve todas las comidas de una version en un array plano
  getComidasVersion(datos: any): { tipo: string; comidas: any[] }[] {
    if (!datos?.sugerencias_comidas) return [];

    const sugerencias = datos.sugerencias_comidas;
    const resultado: { tipo: string; comidas: any[] }[] = [];

    if (sugerencias.desayuno?.length) {
      resultado.push({ tipo: 'Desayuno', comidas: sugerencias.desayuno });
    }
    if (sugerencias.almuerzo?.length) {
      resultado.push({ tipo: 'Almuerzo', comidas: sugerencias.almuerzo });
    }
    if (sugerencias.cena?.length) {
      resultado.push({ tipo: 'Cena', comidas: sugerencias.cena });
    }
    if (sugerencias.colaciones?.length) {
      resultado.push({ tipo: 'Colacion', comidas: sugerencias.colaciones });
    }

    return resultado;
  }

  getTotalComidasVersion(datos: any): number {
    if (!datos?.sugerencias_comidas) return 0;
    const s = datos.sugerencias_comidas;
    return (s.desayuno?.length || 0)
      + (s.almuerzo?.length || 0)
      + (s.cena?.length || 0)
      + (s.colaciones?.length || 0);
  }

  volver(): void {
    this.router.navigate(['/user/plan-nutricional']);
  }

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