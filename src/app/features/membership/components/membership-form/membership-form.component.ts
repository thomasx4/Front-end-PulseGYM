import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MembershipService } from '../../../../core/services/membership.service';
import Swal from 'sweetalert2';

interface Plan {
  id?: number;
  nombre: string;
  precio: number;
  duracion: string;
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

@Component({
  selector: 'app-membership-form',
  templateUrl: './membership-form.component.html',
  styleUrls: ['./membership-form.component.scss'],
})
export class MembershipFormComponent implements OnInit {
  // ==================== DATOS ====================
  plan: Plan = {
    nombre: 'Elite Performance',
    precio: 149.99,
    duracion: '12',
    descripcion:
      'El plan definitivo para atletas de alto rendimiento. Incluye seguimiento biométrico avanzado y acceso prioritario a todas las instalaciones élite.',
    beneficios: [
      'Acceso 24/7 a todas las sedes Titan',
      'Sesiones ilimitadas con entrenador personal',
      'Acceso VIP a Spa y zona de Recuperación Criogénica',
      'Kit de bienvenida Elite (Ropa + Suplementación)',
    ],
    incluyeIA: false,
    esFlexible: false,
    activo: true,
    miembrosActivos: '1,248',
    revenueEstimado: '187k',
  };

  nuevoBeneficio: string = '';
  esEdicion: boolean = false;
  planId: number | null = null;

  // ==================== CONSTRUCTOR ====================
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private membershipService: MembershipService,
  ) {}

  // ==================== LIFECYCLE ====================
  ngOnInit(): void {
    // Verificar si es edición o creación
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.esEdicion = true;
        this.planId = +params['id'];
        this.cargarPlan(this.planId);
      } else {
        this.esEdicion = false;
        // Resetear para nuevo plan
        this.resetearPlan();
      }
    });
  }

  // ==================== CARGA DE DATOS ====================
  cargarPlan(id: number): void {
    // TODO: Implementar carga desde el backend
    // this.membershipService.getMembresia(id).subscribe({
    //   next: (data) => {
    //     this.plan = data;
    //   },
    //   error: (error) => {
    //     console.error('Error al cargar el plan:', error);
    //   }
    // });
    console.log('Cargando plan con ID:', id);
  }

  resetearPlan(): void {
    this.plan = {
      nombre: '',
      precio: 0,
      duracion: '1',
      descripcion: '',
      beneficios: [],
      incluyeIA: false,
      esFlexible: false,
      activo: true,
    };
  }

  // ==================== BENEFICIOS ====================
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

  // ==================== VALIDACIÓN ====================
  get formularioValido(): boolean {
    return (
      this.plan.nombre.trim().length > 0 &&
      this.plan.precio > 0 &&
      this.plan.beneficios.length > 0
    );
  }

  // ==================== BADGE ====================
  getBadgeClass(nombre: string): string {
    const nombreUpper = nombre.toUpperCase();
    if (nombreUpper.includes('ESSENTIAL') || nombreUpper.includes('STANDARD')) {
      return 'badge-essential';
    }
    if (nombreUpper.includes('ELITE') || nombreUpper.includes('PERFORMANCE')) {
      return 'badge-elite';
    }
    if (nombreUpper.includes('VIP') || nombreUpper.includes('SANCTUARY')) {
      return 'badge-vip';
    }
    return 'badge-premium';
  }

  getBadgeText(nombre: string): string {
    const nombreUpper = nombre.toUpperCase();
    if (nombreUpper.includes('ESSENTIAL') || nombreUpper.includes('STANDARD')) {
      return 'STANDARD';
    }
    if (nombreUpper.includes('ELITE') || nombreUpper.includes('PERFORMANCE')) {
      return 'PREMIUM';
    }
    if (nombreUpper.includes('VIP') || nombreUpper.includes('SANCTUARY')) {
      return 'VIP';
    }
    return 'PLAN';
  }

  // ==================== ACCIONES ====================
  guardar(): void {
    if (!this.formularioValido) return;

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
        // TODO: Enviar al backend
        // if (this.esEdicion) {
        //   this.membershipService.actualizarMembresia(this.plan).subscribe(...)
        // } else {
        //   this.membershipService.crearMembresia(this.plan).subscribe(...)
        // }

        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: `El plan ha sido ${mensaje} correctamente.`,
        }).then(() => {
          this.router.navigate(['/dashboard-admin/memberships/list']);
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard-admin/memberships/list']);
  }
}
