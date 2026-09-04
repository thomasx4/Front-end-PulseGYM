import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { MembershipService } from '../../../../core/services/membership.service';
import { UserService } from '../../../../core/services/user.service';
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
  fotoUrl?: string;
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
  loading: boolean = true;
  planId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private membershipService: MembershipService,
    private userService: UserService
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

    this.plan = {
      id: data.idMembresia,
      nombre: data.nombre,
      cantidad: data.cantidad || 1,
      tipoDuracion: data.tipoDuracion || 'MES',
      precioPorDia: data.precioPorDia || 0,
      precioTotal: data.precioTotal || 0,
      descripcion: this.generarDescripcion(data),
      beneficios: beneficiosArray,
      incluyeIA: data.incluyeIA ?? false,
      esFlexible: data.esFlexible ?? false,
      activo: data.activo ?? true,
    };

    forkJoin({
      sociosRes: this.membershipService.getMembresiaConSociosActivos(data.idMembresia).pipe(catchError(() => of(null))),
      usuariosRes: this.userService.listarPerfilesPaginados().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ sociosRes, usuariosRes }) => {
        const rawSocios = sociosRes?.sociosAsignados || sociosRes?.data || [];
        
        const fotosUsuariosMap = new Map<number, string>();
        if (Array.isArray(usuariosRes)) {
          usuariosRes.forEach((u: any) => {
            const id = u.idUsuario || u.id;
            const foto = u.fotoUrl || u.fotoPerfil || u.foto || u.avatar;
            if (id && foto) {
              fotosUsuariosMap.set(Number(id), foto);
            }
          });
        }

        this.socios = rawSocios.map((socio: any) => ({
          ...socio,
          fotoUrl: socio.fotoUrl || socio.fotoPerfil || socio.foto || socio.avatar || fotosUsuariosMap.get(Number(socio.idSocio)) || null
        }));

        this.totalSocios = this.socios.length;
        this.loading = false;
      },
      error: () => {
        this.socios = [];
        this.totalSocios = 0;
        this.loading = false;
      }
    });
  }

  getSocioFoto(socio: Socio): string | null {
    if (!socio || !socio.fotoUrl) return null;
    let rawUrl = String(socio.fotoUrl).trim();
    if (rawUrl === '' || rawUrl === 'null' || rawUrl === 'undefined') return null;
    return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
  }

  onAvatarError(idSocio: number): void {
  }

  hasAvatarError(idSocio: number): boolean {
    return false;
  }

  getInitials(nombreCompleto?: string): string {
    if (!nombreCompleto) return 'U';
    const partes = nombreCompleto.trim().split(' ').filter(p => p.length > 0);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  private manejarError(error: unknown): void {
    console.error('Error al cargar el plan:', error);
    this.loading = false;

    const err = error as any;
    Swal.fire({
      icon: 'error',
      title: err.status === 404 ? 'Membresía no encontrada' : 'Error',
      text: err.status === 404 ? 'La membresía que buscas no existe o ha sido eliminada.' : 'No se pudo cargar la membresía.',
      confirmButtonText: 'Volver',
      confirmButtonColor: '#0f1c3f',
    }).then(() => {
      this.router.navigate(['/dashboard-admin/memberships/list']);
    });
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