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
}

interface Socio {
  idSocio: number;
  nombreCompleto: string;
  email: string;
  telefono: string;
  estado: string;
  fechaInicio: string;
  fechaVencimiento: string;
}

const TIPO_DURACION_MAP: { [key: string]: string } = {
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
export class MembershipDetailComponent implements OnInit {
  plan: Plan | null = null;
  socios: Socio[] = [];
  totalSocios: number = 0;
  loading: boolean = true;
  planId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private membershipService: MembershipService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.planId = +params['id'];
        this.cargarPlan(this.planId);
      } else {
        this.router.navigate(['/dashboard-admin/memberships/list']);
      }
    });
  }

  cargarPlan(id: number): void {
    this.loading = true;
    
    this.membershipService.getMembresiaConSociosActivos(id).subscribe({
      next: (data: any) => {
        const beneficiosArray = data.beneficios 
          ? data.beneficios.split(',').map((b: string) => b.trim()) 
          : ['Sin beneficios'];

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
        };

        this.socios = data.sociosAsignados || [];
        this.totalSocios = this.socios.length;

        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar el plan:', error);
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la membresía', 'error');
        this.router.navigate(['/dashboard-admin/memberships/list']);
      }
    });
  }

  generarDescripcion(data: any): string {
    const duracion = data.cantidad || 1;
    const tipo = TIPO_DURACION_MAP[data.tipoDuracion] || 'mes(es)';
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

  calcularRevenue(): number {
    if (!this.plan) return 0;
    return (this.plan.precioTotal || 0) * this.totalSocios;
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