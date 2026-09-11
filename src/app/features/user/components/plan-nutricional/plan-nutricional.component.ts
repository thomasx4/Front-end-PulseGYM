import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NutricionalService, PlanNutricionalReal } from '../../../../core/services/nutricional.service';
import { UserService } from '../../../../core/services/users.service';

export interface PlanNutricionalUI {
  id: number;
  nombre: string;
  descripcion: string;
  fechaGeneracion: string;
  restricciones: string[];
}

@Component({
  selector: 'app-plan-nutricional',
  templateUrl: './plan-nutricional.component.html',
  styleUrls: ['./plan-nutricional.component.scss']
})
export class PlanNutricionalComponent implements OnInit {

  public isLoading: boolean = false;
  public planes: PlanNutricionalUI[] = [];

  // Control de acceso a IA
  public tieneAccesoIA: boolean = false;
  public validandoAcceso: boolean = true;

  // Modal de membresia requerida
  public showMembresiaModal: boolean = false;

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';
  public errorModalAction: string = 'Reintentar';

  constructor(
    private nutricionalService: NutricionalService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.validarAccesoIA();
  }

  // Valida si la membresia incluye IA antes de cargar planes
  validarAccesoIA(): void {
    this.validandoAcceso = true;

    this.userService.getMiMembresiaActiva().subscribe({
      next: (membresia: any) => {
        console.log('Membresia activa recibida:', membresia);
        console.log('incluyeIA:', membresia?.incluyeIA);

        this.tieneAccesoIA = membresia?.incluyeIA === true;
        this.validandoAcceso = false;

        if (this.tieneAccesoIA) {
          this.cargarPlanes();
        } else {
          this.showMembresiaModal = true;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error al validar membresia:', error);
        this.validandoAcceso = false;
        this.tieneAccesoIA = false;
        this.isLoading = false;
        this.showMembresiaModal = true;
      }
    });
  }

  private formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private mapearPlan(plan: PlanNutricionalReal): PlanNutricionalUI {
    const nombre = plan.generadoPorIA
      ? `Plan IA - ${plan.calorias_diarias} kcal`
      : `Plan #${plan.idPlanNutricional}`;

    return {
      id: plan.idPlanNutricional,
      nombre: nombre,
      descripcion: plan.explicacion_ia?.slice(0, 120) || 'Plan nutricional personalizado',
      fechaGeneracion: this.formatearFecha(plan.fechaGeneracion),
      restricciones: plan.restricciones_dieteticas || []
    };
  }

  cargarPlanes(): void {
    this.isLoading = true;
    this.showErrorModal = false;

    this.nutricionalService.getMisPlanes().subscribe({
      next: (planes: PlanNutricionalReal[]) => {
        console.log('Planes recibidos:', planes);
        this.planes = planes.map(p => this.mapearPlan(p));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar planes:', err);
        this.isLoading = false;

        let mensaje = 'Hubo un error al obtener tus planes nutricionales. Por favor, intenta de nuevo.';
        if (err.status === 401) {
          mensaje = 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.';
          this.errorModalAction = 'Iniciar sesion';
        } else if (err.status === 404) {
          mensaje = 'No tienes planes nutricionales creados aun. Quieres crear uno?';
          this.errorModalAction = 'Crear plan';
        } else if (err.error?.message) {
          mensaje = err.error.message;
        }

        this.mostrarError('No se pudieron cargar los planes', mensaje);
      }
    });
  }

  crearPlan(): void {
    if (!this.tieneAccesoIA) {
      this.showMembresiaModal = true;
      return;
    }
    this.router.navigate(['/user/plan-nutricional/crear-plan']);
  }

  exportarPlanes(): void {
    this.router.navigate(['/user/plan-nutricional/exportar']);
  }

  verPlan(plan: PlanNutricionalUI): void {
    this.router.navigate(['/user/plan-nutricional/detalle', plan.id]);
  }

  // Redirige a membresias o cierra el modal
  irAMembresias(): void {
    this.showMembresiaModal = false;
    this.router.navigate(['/user/membresias']);
  }

  cerrarMembresiaModal(): void {
    this.showMembresiaModal = false;
  }

  mostrarError(titulo: string, mensaje: string): void {
    this.errorModalTitle = titulo;
    this.errorModalMessage = mensaje;
    this.showErrorModal = true;
  }

  onRetry(): void {
    this.showErrorModal = false;

    if (this.errorModalAction === 'Iniciar sesion') {
      this.router.navigate(['/auth/login']);
    } else if (this.errorModalAction === 'Crear plan') {
      this.crearPlan();
    } else {
      this.cargarPlanes();
    }
  }

  onCloseModal(): void {
    this.showErrorModal = false;
  }
}