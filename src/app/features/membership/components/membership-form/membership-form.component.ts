import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MembershipService } from '../../../../core/services/membership.service';
import Swal from 'sweetalert2';

// INTERFACES & DTOs
export interface Plan {
  id?: number;
  nombre: string;
  cantidad: number;
  tipoDuracion: string;
  precioPorDia: number;
  descripcion: string;
  beneficios: string[];
  incluyeIA: boolean;
  esFlexible: boolean;
  activo: boolean;
  miembrosActivos?: string;
  revenueEstimado?: string;
  badge?: string;
  badgeClass?: string;
}

export interface MembresiaResponseDTO {
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
  sociosAsignados?: unknown[];
}

export interface MembresiaRequestDTO {
  nombre: string;
  cantidad: number;
  tipoDuracion: string;
  incluyeIA: boolean;
  esFlexible: boolean;
  precioPorDia: number;
  beneficios: string;
  restricciones: string;
  activo: boolean;
}

// Mapeos constantes
const TIPO_DURACION_MAP: Record<string, string> = {
  DIA: 'día(s)',
  SEMANA: 'semana(s)',
  MES: 'mes(es)',
  TRIMESTRE: 'trimestre(s)',
  SEMESTRE: 'semestre(s)',
  ANUAL: 'año(s)'
};

const DIAS_POR_UNIDAD: Record<string, number> = {
  DIA: 1,
  SEMANA: 7,
  MES: 30,
  TRIMESTRE: 90,
  SEMESTRE: 180,
  ANUAL: 365
};

@Component({
  selector: 'app-membership-form',
  templateUrl: './membership-form.component.html',
  styleUrls: ['./membership-form.component.scss'],
})
export class MembershipFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private membershipService = inject(MembershipService);
  private destroyRef = inject(DestroyRef);

  // ESTADO
  plan: Plan = this.crearPlanInicial();
  nuevoBeneficio: string = '';
  esEdicion: boolean = false;
  planId: number | null = null;
  totalSocios: number = 0;

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['id']) {
          this.esEdicion = true;
          this.planId = +params['id'];
          this.cargarPlan(this.planId);
        } else {
          this.esEdicion = false;
          this.resetearPlan();
        }
      });
  }

  private crearPlanInicial(): Plan {
    return {
      nombre: '',
      cantidad: 1,
      tipoDuracion: 'MES',
      precioPorDia: 0,
      descripcion: '',
      beneficios: [],
      incluyeIA: false,
      esFlexible: false,
      activo: true,
      miembrosActivos: '0',
      revenueEstimado: '0',
    };
  }

  cargarPlan(id: number): void {
    this.membershipService.getMembresiaConSociosActivos(id).subscribe({
      next: (data: MembresiaResponseDTO) => {
        const beneficiosArray = data.beneficios
          ? data.beneficios.split(',').map((b) => b.trim()).filter(Boolean)
          : [];

        const socios = data.sociosAsignados || [];
        this.totalSocios = socios.length;

        this.plan = {
          id: data.idMembresia,
          nombre: data.nombre,
          cantidad: data.cantidad || 1,
          tipoDuracion: data.tipoDuracion || 'MES',
          precioPorDia: data.precioPorDia || 0,
          descripcion: this.generarDescripcion(data),
          beneficios: beneficiosArray,
          incluyeIA: data.incluyeIA ?? false,
          esFlexible: data.esFlexible ?? false,
          activo: data.activo ?? true,
          miembrosActivos: this.totalSocios.toString(),
          revenueEstimado: '0',
        };
      },
      error: (error: Error) => {
        console.error('Error al cargar el plan:', error);
        Swal.fire('Error', 'No se pudo cargar la membresía', 'error');
      }
    });
  }

  // CÁLCULOS DINÁMICOS
  get precioTotalCalculado(): number {
    const diasPorUnidad = DIAS_POR_UNIDAD[this.plan.tipoDuracion] || 30;
    const totalDias = diasPorUnidad * this.plan.cantidad;
    return this.plan.precioPorDia * totalDias;
  }

  get formularioValido(): boolean {
    return (
      this.plan.nombre.trim().length > 0 &&
      this.plan.cantidad > 0 &&
      this.plan.precioPorDia > 0 &&
      this.plan.beneficios.length > 0
    );
  }

  // ELIMINAR MEMBRESÍA
  eliminarMembresia(): void {
    if (!this.planId) return;

    Swal.fire({
      title: '¿Confirmar eliminación de membresía?',
      html: `
        <p style="color: #64748b; font-size: 14px;">
          Esta acción es irreversible y afectará a todos los socios vinculados a este plan.
          No se podrán procesar nuevos pagos bajo este esquema.
        </p>
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; text-align: left; font-size: 14px;">
            <tr>
              <th style="padding: 6px 8px; color: #94a3b8; font-weight: 600;">Nombre del Plan</th>
              <th style="padding: 6px 8px; color: #94a3b8; font-weight: 600;">Precio Total</th>
              <th style="padding: 6px 8px; color: #94a3b8; font-weight: 600;">Socios Activos</th>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">${this.escapeHtml(this.plan.nombre)}</td>
              <td style="padding: 6px 8px;">${this.formatearPrecio(this.precioTotalCalculado)}</td>
              <td style="padding: 6px 8px; text-align: center;">${this.totalSocios}</td>
            </tr>
          </table>
        </div>
        <div style="text-align: left; font-size: 13px; color: #64748b; padding: 8px 0;">
          <p>1. Al eliminar esta membresía, los <strong>${this.totalSocios} socios activos</strong> pasarán a no tener membresías asignadas y se les deberá reasignar una.</p>
          <p>2. Entiendo que los datos históricos de facturación se conservarán, pero el plan "<strong>${this.escapeHtml(this.plan.nombre)}</strong>" dejará de estar disponible de forma permanente.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Eliminar Definitivamente',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.membershipService.eliminarMembresia(this.planId!).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Membresía Eliminada!',
              text: `El plan "${this.plan.nombre}" ha sido eliminado correctamente.`,
            }).then(() => {
              this.router.navigate(['/dashboard-admin/memberships/list']);
            });
          },
          error: (error: { error?: { message?: string } }) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo eliminar la membresía.',
            });
          }
        });
      }
    });
  }

  // BENEFICIOS
  agregarBeneficio(): void {
    const beneficio = this.nuevoBeneficio.trim();
    if (beneficio) {
      this.plan.beneficios.push(beneficio);
      this.nuevoBeneficio = '';
    }
  }

  eliminarBeneficio(index: number): void {
    this.plan.beneficios.splice(index, 1);
  }

  // ACCIONES
  guardar(): void {
    if (!this.formularioValido) return;

    const request: MembresiaRequestDTO = {
      nombre: this.plan.nombre.trim(),
      cantidad: this.plan.cantidad,
      tipoDuracion: this.plan.tipoDuracion,
      incluyeIA: this.plan.incluyeIA,
      esFlexible: this.plan.esFlexible,
      precioPorDia: this.plan.precioPorDia,
      beneficios: this.plan.beneficios.join(', '),
      restricciones: 'No acumulable',
      activo: this.plan.activo,
    };

    const accion = this.esEdicion ? 'actualizar' : 'crear';
    const mensajeExito = this.esEdicion ? 'actualizado' : 'creado';

    Swal.fire({
      title: `¿Confirmar ${this.esEdicion ? 'actualización' : 'creación'}?`,
      text: `¿Estás seguro de que deseas ${accion} el plan "${this.plan.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const obs$ = (this.esEdicion && this.planId)
          ? this.membershipService.actualizarMembresia(this.planId, request)
          : this.membershipService.crearMembresia(request);

        obs$.subscribe({
          next: () => this.mostrarExito(mensajeExito),
          error: (err) => this.mostrarError(err)
        });
      }
    });
  }

  // HELPERS Y FORMATOS
  getNombreDuracion(tipo: string): string {
    return TIPO_DURACION_MAP[tipo] || 'mes(es)';
  }

  getBadgeClass(nombre: string): string {
    const nombreUpper = nombre.toUpperCase();
    return (nombreUpper.includes('STANDARD') || nombreUpper.includes('PREMIUM'))
      ? 'badge-essential'
      : 'badge-premium';
  }

  getBadgeText(nombre: string): string {
    const nombreUpper = nombre.toUpperCase();
    return (nombreUpper.includes('STANDARD') || nombreUpper.includes('PREMIUM'))
      ? 'PREMIUM'
      : 'PLAN';
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio || 0);
  }

  cancelar(): void {
    this.router.navigate(['/dashboard-admin/memberships/list']);
  }

  resetearPlan(): void {
    this.plan = this.crearPlanInicial();
  }

  private generarDescripcion(data: MembresiaResponseDTO): string {
    const duracion = data.cantidad || 1;
    const tipo = TIPO_DURACION_MAP[data.tipoDuracion || 'MES'] || 'mes(es)';
    const ia = data.incluyeIA ? ' con IA' : '';
    return `Plan ${data.nombre} - ${duracion} ${tipo}${ia}`;
  }

  private mostrarExito(mensaje: string): void {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: `El plan ha sido ${mensaje} correctamente.`,
    }).then(() => {
      this.router.navigate(['/dashboard-admin/memberships/list']);
    });
  }

  private mostrarError(error: { error?: { message?: string } }): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.error?.message || 'Ocurrió un error al guardar el plan.',
    });
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}