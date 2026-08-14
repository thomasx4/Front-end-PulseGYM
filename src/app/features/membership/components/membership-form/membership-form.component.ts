import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MembershipService } from '../../../../core/services/membership.service';
import Swal from 'sweetalert2';

interface Plan {
  id?: number;
  nombre: string;
  cantidad: number;
  tipoDuracion: string;
  precioPorDia: number;
  precioTotal?: number;
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

// Mapeo de tipos de duración a nombres legibles
const TIPO_DURACION_MAP: { [key: string]: string } = {
  'DIA': 'día(s)',
  'SEMANA': 'semana(s)',
  'MES': 'mes(es)',
  'TRIMESTRE': 'trimestre(s)',
  'SEMESTRE': 'semestre(s)',
  'ANUAL': 'año(s)'
};

// Días por unidad según el enum del backend
const DIAS_POR_UNIDAD: { [key: string]: number } = {
  'DIA': 1,
  'SEMANA': 7,
  'MES': 30,
  'TRIMESTRE': 90,
  'SEMESTRE': 180,
  'ANUAL': 365
};

@Component({
  selector: 'app-membership-form',
  templateUrl: './membership-form.component.html',
  styleUrls: ['./membership-form.component.scss'],
})
export class MembershipFormComponent implements OnInit {
  //  DATOS 
  plan: Plan = {
    nombre: '',
    cantidad: 1,
    tipoDuracion: 'MES',
    precioPorDia: 0,
    precioTotal: 0,
    descripcion: '',
    beneficios: [],
    incluyeIA: false,
    esFlexible: false,
    activo: true,
    miembrosActivos: '0',
    revenueEstimado: '0',
  };

  nuevoBeneficio: string = '';
  esEdicion: boolean = false;
  planId: number | null = null;
  totalSocios: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private membershipService: MembershipService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
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

  cargarPlan(id: number): void {
    this.membershipService.getMembresiaConSociosActivos(id).subscribe({
      next: (data: any) => {
        const beneficiosArray = data.beneficios 
          ? data.beneficios.split(',').map((b: string) => b.trim()) 
          : ['Sin beneficios'];

        // Contar socios activos
        const socios = data.sociosAsignados || [];
        this.totalSocios = socios.length;

        this.plan = {
          id: data.idMembresia,
          nombre: data.nombre,
          cantidad: data.cantidad || 1,
          tipoDuracion: data.tipoDuracion || 'MES',
          precioPorDia: data.precioPorDia || 0,
          precioTotal: data.precioTotal || 0,
          descripcion: this.generarDescripcion(data),
          beneficios: beneficiosArray,
          incluyeIA: data.incluyeIA || false,
          esFlexible: data.esFlexible || false,
          activo: data.activo !== undefined ? data.activo : true,
          miembrosActivos: this.totalSocios.toString(),
          revenueEstimado: '0',
        };
      },
      error: (error: any) => {
        console.error('Error al cargar el plan:', error);
        Swal.fire('Error', 'No se pudo cargar la membresía', 'error');
      }
    });
  }

  //  ELIMINAR MEMBRESÍA 
  eliminarMembresia(): void {
    if (!this.planId) return;

    const mensaje = this.totalSocios > 0 
      ? `Esta acción afectará a ${this.totalSocios} socios activos que perderán su membresía.`
      : 'No hay socios asignados a este plan.';

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
              <td style="padding: 6px 8px; font-weight: 600;">${this.plan.nombre}</td>
              <td style="padding: 6px 8px;">${this.formatearPrecio(this.plan.precioTotal || 0)}</td>
              <td style="padding: 6px 8px; text-align: center;">${this.totalSocios}</td>
            </tr>
          </table>
        </div>
        <div style="text-align: left; font-size: 13px; color: #64748b; padding: 8px 0;">
          <p>1. Al eliminar esta membresía, los <strong>${this.totalSocios} socios activos</strong> pasarán a no tener membresias asignadas y tendran que volver a asignaler una.</p>
          <p>2. Entiendo que los datos históricos de facturación se conservarán, pero el plan "<strong>${this.plan.nombre}</strong>" dejará de estar disponible de forma permanente.</p>
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
          error: (error: any) => {
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

  generarDescripcion(data: any): string {
    const duracion = data.cantidad || 1;
    const tipo = TIPO_DURACION_MAP[data.tipoDuracion] || 'mes(es)';
    const ia = data.incluyeIA ? ' con IA' : '';
    return `Plan ${data.nombre} - ${duracion} ${tipo}${ia}`;
  }

  resetearPlan(): void {
    this.plan = {
      nombre: '',
      cantidad: 1,
      tipoDuracion: 'MES',
      precioPorDia: 0,
      precioTotal: 0,
      descripcion: '',
      beneficios: [],
      incluyeIA: false,
      esFlexible: false,
      activo: true,
      miembrosActivos: '0',
      revenueEstimado: '0',
    };
  }

  //  CÁLCULO PRECIO TOTAL 
  calcularPrecioTotal(): number {
    const diasPorUnidad = DIAS_POR_UNIDAD[this.plan.tipoDuracion] || 30;
    const totalDias = diasPorUnidad * this.plan.cantidad;
    return this.plan.precioPorDia * totalDias;
  }

  //  OBTENER NOMBRE DE DURACIÓN 
  getNombreDuracion(tipo: string): string {
    return TIPO_DURACION_MAP[tipo] || 'mes(es)';
  }

  //  BENEFICIOS 
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

  //  VALIDACIÓN 
  get formularioValido(): boolean {
    return (
      this.plan.nombre.trim().length > 0 &&
      this.plan.cantidad > 0 &&
      this.plan.precioPorDia > 0 &&
      this.plan.beneficios.length > 0
    );
  }

  //  BADGE 
  getBadgeClass(nombre: string): string {
    const nombreUpper = nombre.toUpperCase();
    if (nombreUpper.includes('STANDARD') || nombreUpper.includes('PREMIUM')) {
      return 'badge-essential';
    }
    return 'badge-premium';
  }

  getBadgeText(nombre: string): string {
    const nombreUpper = nombre.toUpperCase();
    if (nombreUpper.includes('STANDARD') || nombreUpper.includes('PREMIUM')) {
      return 'PREMIUM';
    }
    return 'PLAN';
  }

  //  FORMATEAR PRECIO 
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio || 0);
  }

  //  ACCIONES 
  guardar(): void {
    if (!this.formularioValido) return;

    const request = {
      nombre: this.plan.nombre,
      cantidad: this.plan.cantidad,
      tipoDuracion: this.plan.tipoDuracion,
      incluyeIA: this.plan.incluyeIA,
      esFlexible: this.plan.esFlexible,
      precioPorDia: this.plan.precioPorDia,
      beneficios: this.plan.beneficios.join(', '),
      restricciones: 'No acumulable',
      activo: this.plan.activo,
    };

    const mensaje = this.esEdicion ? 'actualizado' : 'creado';

    Swal.fire({
      title: `¿Confirmar ${this.esEdicion ? 'actualización' : 'creación'}?`,
      text: `¿Estás seguro de que deseas ${this.esEdicion ? 'actualizar' : 'crear'} el plan "${this.plan.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${this.esEdicion ? 'actualizar' : 'crear'}`,
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.esEdicion && this.planId) {
          this.membershipService.actualizarMembresia(this.planId, request).subscribe({
            next: () => {
              this.mostrarExito(mensaje);
            },
            error: (error: any) => {
              this.mostrarError(error);
            }
          });
        } else {
          this.membershipService.crearMembresia(request).subscribe({
            next: () => {
              this.mostrarExito(mensaje);
            },
            error: (error: any) => {
              this.mostrarError(error);
            }
          });
        }
      }
    });
  }

  mostrarExito(mensaje: string): void {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: `El plan ha sido ${mensaje} correctamente.`,
    }).then(() => {
      this.router.navigate(['/dashboard-admin/memberships/list']);
    });
  }

  mostrarError(error: any): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.error?.message || 'Ocurrió un error al guardar el plan.',
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard-admin/memberships/list']);
  }
}