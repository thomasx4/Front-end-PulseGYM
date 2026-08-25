import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MembershipService } from '../../../../core/services/membership.service';
import Swal from 'sweetalert2';

export interface Plan {
  id?: number;
  nombre: string;
  cantidad: number;
  tipoDuracion: string;
  precioPorDia: number;
  precioTotal: number;
  descripcion: string;
  beneficios: string[];
  incluyeIA: boolean;
  esFlexible: boolean;
  activo: boolean;
}

export interface Socio {
  idSocio: number;
  nombreCompleto: string;
  email: string;
  telefono: string;
  estado: string;
  fechaInicio: string;
  fechaVencimiento: string;
}

interface MembershipResponseDTO {
  idMembresia: number;
  nombre: string;
  cantidad?: number;
  tipoDuracion?: string;
  precioPorDia?: number;
  precioTotal?: number;
  beneficios?: string;
  incluyeIA?: boolean;
  esFlexible?: boolean;
  activo?: boolean;
  sociosAsignados?: Socio[];
}

const TIPO_DURACION_MAP: Record<string, string> = {
  'DIA': 'día(s)',
  'SEMANA': 'semana(s)',
  'MES': 'mes(es)',
  'TRIMESTRE': 'trimestre(s)',
  'SEMESTRE': 'semestre(s)',
  'ANUAL': 'año(s)'
};

@Component({
  selector: 'app-membership-detail',
  templateUrl: './membership-detail.component.html',
  styleUrls: ['./membership-detail.component.scss']
})
export class MembershipDetailComponent implements OnInit, OnDestroy {
  plan: Plan | null = null;
  socios: Socio[] = [];
  totalSocios: number = 0;
  revenueEstimado: number = 0;
  precioTotalFormateado: string = '$ 0';
  precioPorDiaFormateado: string = '$ 0';
  revenueFormateado: string = '$ 0';
  loading: boolean = true;
  planId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private membershipService: MembershipService
  ) { }

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          if (!params['id']) {
            this.router.navigate(['/dashboard-admin/memberships/list']);
            return [];
          }
          this.planId = +params['id'];
          this.loading = true;

          // ✅ PRIMERO: Obtener la membresía por ID (siempre disponible)
          return this.membershipService.getMembresiaById(this.planId).pipe(
            catchError((error) => {
              this.manejarError(error);
              return of(null);
            })
          );
        })
      )
      .subscribe({
        next: (data: MembershipResponseDTO | null) => {
          if (data) {
            this.procesarDatos(data);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private procesarDatos(data: MembershipResponseDTO): void {
    const beneficiosArray = data.beneficios
      ? data.beneficios.split(',').map((b: string) => b.trim())
      : ['Sin beneficios'];

    const precioTotal = data.precioTotal || 0;
    const precioPorDia = data.precioPorDia || 0;

    this.plan = {
      id: data.idMembresia,
      nombre: data.nombre,
      cantidad: data.cantidad || 1,
      tipoDuracion: data.tipoDuracion || 'MES',
      precioPorDia,
      precioTotal,
      descripcion: this.generarDescripcion(data),
      beneficios: beneficiosArray,
      incluyeIA: data.incluyeIA ?? false,
      esFlexible: data.esFlexible ?? false,
      activo: data.activo ?? true,
    };

    // ✅ SEGUNDO: Intentar cargar socios asignados (si falla, solo no hay socios)
    this.membershipService.getMembresiaConSociosActivos(data.idMembresia).subscribe({
      next: (sociosData: any) => {
        this.socios = sociosData?.sociosAsignados || sociosData?.data || [];
        this.totalSocios = this.socios.length;
        this.actualizarMetricas();
        this.loading = false;
      },
      error: (error: any) => {
        // ✅ Si es 404 o 400, simplemente no hay socios
        if (error.status === 404 || error.status === 400) {
          this.socios = [];
          this.totalSocios = 0;
          this.actualizarMetricas();
          this.loading = false;
        } else {
          console.warn('Error al cargar socios:', error);
          this.socios = [];
          this.totalSocios = 0;
          this.actualizarMetricas();
          this.loading = false;
        }
      }
    });
  }

  private actualizarMetricas(): void {
    const precioTotal = this.plan?.precioTotal || 0;
    this.revenueEstimado = precioTotal * this.totalSocios;
    this.precioTotalFormateado = this.formatearPrecio(precioTotal);
    this.precioPorDiaFormateado = this.formatearPrecio(this.plan?.precioPorDia || 0);
    this.revenueFormateado = this.formatearPrecio(this.revenueEstimado);
  }

  private manejarError(error: unknown): void {
    console.error('Error al cargar el plan:', error);
    this.loading = false;

    const err = error as any;
    if (err.status === 404) {
      Swal.fire({
        icon: 'error',
        title: 'Membresía no encontrada',
        text: 'La membresía que buscas no existe o ha sido eliminada.',
        confirmButtonText: 'Volver',
        confirmButtonColor: '#0f1c3f',
      }).then(() => {
        this.router.navigate(['/dashboard-admin/memberships/list']);
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la membresía.',
        confirmButtonText: 'Volver',
        confirmButtonColor: '#0f1c3f',
      }).then(() => {
        this.router.navigate(['/dashboard-admin/memberships/list']);
      });
    }
  }

  generarDescripcion(data: MembershipResponseDTO): string {
    const duracion = data.cantidad || 1;
    const tipo = TIPO_DURACION_MAP[data.tipoDuracion || 'MES'] || 'mes(es)';
    const ia = data.incluyeIA ? ' con IA' : '';
    return `Plan ${data.nombre} - ${duracion} ${tipo}${ia}`;
  }

  getNombreDuracion(tipo: string): string {
    return TIPO_DURACION_MAP[tipo] || 'mes(es)';
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio || 0);
  }

  volver(): void {
    this.router.navigate(['/dashboard-admin/memberships/list']);
  }

  editar(): void {
    if (this.planId) {
      this.router.navigate(['/dashboard-admin/memberships/edit', this.planId]);
    }
  }
}