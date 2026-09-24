import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MembershipService } from '../../../../core/services/membership.service';
import Swal from 'sweetalert2';

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
  private fb = inject(FormBuilder);

  membershipForm!: FormGroup;
  plan: Plan = this.crearPlanInicial();
  beneficiosArray: string[] = [];
  nuevoBeneficio: string = '';
  esEdicion: boolean = false;
  planId: number | null = null;
  totalSocios: number = 0;
  loading: boolean = false;

  ngOnInit(): void {
    this.buildForm();
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

  buildForm(): void {
    this.membershipForm = this.fb.group({
      // Ajustado a maxLength(50) para evitar el error de base de datos character varying(50)
      nombre: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ0-9\s\-]+$/)]],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(365)]],
      tipoDuracion: ['MES', [Validators.required]],
      precioPorDia: [0, [Validators.required, Validators.min(1000), Validators.max(100000)]],
      descripcion: ['', [Validators.maxLength(255)]],
      incluyeIA: [false],
      esFlexible: [false],
      activo: [true]
    });

    // Sincronizar en tiempo real con el objeto local para la vista previa fluida
    this.membershipForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((values) => {
        this.plan = {
          ...this.plan,
          ...values,
          beneficios: this.beneficiosArray
        };
      });
  }

  validarCaracteresNumericos(event: KeyboardEvent): void {
    const teclasInvalidas = ['e', 'E', '+', '-', '.'];
    if (teclasInvalidas.includes(event.key)) {
      event.preventDefault();
    }
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
    };
  }

  cargarPlan(id: number): void {
    this.loading = true;
    
    this.membershipService.getMembresiaById(id).subscribe({
      next: (data: MembresiaResponseDTO) => {
        this.beneficiosArray = data.beneficios
          ? data.beneficios.split(',').map((b) => b.trim()).filter(Boolean)
          : [];

        this.plan = {
          id: data.idMembresia,
          nombre: data.nombre,
          cantidad: data.cantidad || 1,
          tipoDuracion: data.tipoDuracion || 'MES',
          precioPorDia: data.precioPorDia || 0,
          descripcion: this.generarDescripcion(data),
          beneficios: this.beneficiosArray,
          incluyeIA: data.incluyeIA ?? false,
          esFlexible: data.esFlexible ?? false,
          activo: data.activo ?? true,
        };

        this.membershipForm.patchValue({
          nombre: this.plan.nombre,
          cantidad: this.plan.cantidad,
          tipoDuracion: this.plan.tipoDuracion,
          precioPorDia: this.plan.precioPorDia,
          descripcion: data.beneficios || '',
          incluyeIA: this.plan.incluyeIA,
          esFlexible: this.plan.esFlexible,
          activo: this.plan.activo
        });

        this.membershipService.getMembresiaConSociosActivos(id).subscribe({
          next: (sociosData: any) => {
            const socios = sociosData?.sociosAsignados || sociosData?.data || [];
            this.totalSocios = socios.length;
            this.loading = false;
          },
          error: () => {
            this.totalSocios = 0;
            this.loading = false;
          }
        });
      },
      error: (error: any) => {
        console.error('Error al cargar el plan:', error);
        this.loading = false;
        const msg = error.error?.message || 'No se pudo cargar la membresía.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  get precioTotalCalculado(): number {
    const cantidad = this.membershipForm.get('cantidad')?.value || 1;
    const tipo = this.membershipForm.get('tipoDuracion')?.value || 'MES';
    const precioDia = this.membershipForm.get('precioPorDia')?.value || 0;
    const diasPorUnidad = DIAS_POR_UNIDAD[tipo] || 30;
    return precioDia * diasPorUnidad * cantidad;
  }

  agregarBeneficio(): void {
    const beneficio = this.nuevoBeneficio.trim();
    if (!beneficio) return;
    if (beneficio.length > 50) {
      Swal.fire('Aviso', 'Cada beneficio individual no puede superar los 50 caracteres por restricciones del sistema.', 'warning');
      return;
    }
    if (this.beneficiosArray.includes(beneficio)) {
      Swal.fire('Aviso', 'Este beneficio ya ha sido agregado.', 'warning');
      return;
    }

    this.beneficiosArray.push(beneficio);
    this.plan.beneficios = [...this.beneficiosArray];
    this.nuevoBeneficio = '';
  }

  eliminarBeneficio(index: number): void {
    this.beneficiosArray.splice(index, 1);
    this.plan.beneficios = [...this.beneficiosArray];
  }

  eliminarMembresia(): void {
    if (!this.planId) return;

    Swal.fire({
      title: '¿Confirmar eliminación de membresía?',
      html: `
        <p style="color: #64748b; font-size: 14px;">
          Esta acción es irreversible y afectará a todos los socios vinculados a este plan.
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
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Eliminar Definitivamente',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.membershipService.eliminarMembresia(this.planId!).subscribe({
          next: () => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: '¡Membresía Eliminada!',
              text: `El plan "${this.plan.nombre}" ha sido eliminado correctamente.`,
            }).then(() => {
              this.router.navigate(['/dashboard-admin/memberships/list']);
            });
          },
          error: (error: any) => {
            this.loading = false;
            const mensaje = error.error?.message || error.error || 'No se pudo eliminar la membresía por restricciones del servidor.';
            Swal.fire({
              icon: 'error',
              title: 'Error de Eliminación',
              text: mensaje,
            });
          }
        });
      }
    });
  }

  guardar(): void {
    if (this.membershipForm.invalid) {
      this.membershipForm.markAllAsTouched();
      Swal.fire('Formulario Inválido', 'Por favor complete correctamente todos los campos obligatorios y revise las longitudes permitidas.', 'warning');
      return;
    }

    if (this.beneficiosArray.length === 0) {
      Swal.fire('Faltan Beneficios', 'Debe agregar al menos un beneficio para la membresía.', 'warning');
      return;
    }

    const formValues = this.membershipForm.value;
    const request: MembresiaRequestDTO = {
      nombre: formValues.nombre.trim(),
      cantidad: Number(formValues.cantidad),
      tipoDuracion: formValues.tipoDuracion,
      incluyeIA: Boolean(formValues.incluyeIA),
      esFlexible: Boolean(formValues.esFlexible),
      precioPorDia: Number(formValues.precioPorDia),
      beneficios: this.beneficiosArray.join(', '),
      restricciones: 'No acumulable',
      activo: Boolean(formValues.activo),
    };

    const accion = this.esEdicion ? 'actualizar' : 'crear';
    const mensajeExito = this.esEdicion ? 'actualizado' : 'creado';

    Swal.fire({
      title: `¿Confirmar ${this.esEdicion ? 'actualización' : 'creación'}?`,
      text: `¿Estás seguro de que deseas ${accion} el plan "${request.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        const obs$ = (this.esEdicion && this.planId)
          ? this.membershipService.actualizarMembresia(this.planId, request)
          : this.membershipService.crearMembresia(request);

        obs$.subscribe({
          next: () => {
            this.loading = false;
            this.mostrarExito(mensajeExito);
          },
          error: (err: any) => {
            this.loading = false;
            this.mostrarError(err);
          }
        });
      }
    });
  }

  getNombreDuracion(tipo: string): string {
    return TIPO_DURACION_MAP[tipo] || 'mes(es)';
  }

  getBadgeClass(nombre: string): string {
    const nombreUpper = (nombre || '').toUpperCase();
    return (nombreUpper.includes('STANDARD') || nombreUpper.includes('PREMIUM'))
      ? 'badge-essential'
      : 'badge-premium';
  }

  getBadgeText(nombre: string): string {
    const nombreUpper = (nombre || '').toUpperCase();
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
    this.membershipForm.reset({
      cantidad: 1,
      tipoDuracion: 'MES',
      precioPorDia: 0,
      incluyeIA: false,
      esFlexible: false,
      activo: true
    });
    this.beneficiosArray = [];
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

  private mostrarError(error: any): void {
    let mensajeError = 'Ocurrió un error al guardar el plan.';
    if (error.error) {
      if (typeof error.error === 'string') {
        mensajeError = error.error;
      } else if (error.error.message) {
        mensajeError = error.error.message;
      } else if (error.error.error) {
        mensajeError = error.error.error;
      }
    }
    Swal.fire({
      icon: 'error',
      title: 'Error de Servidor',
      text: mensajeError,
    });
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}