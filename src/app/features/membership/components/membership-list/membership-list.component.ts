import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MembershipService, FiltrosMembresias, FiltrosSociosMembresias } from '../../../../core/services/membership.service';
import Swal from 'sweetalert2';

export interface Plan {
  id: number;
  nombre: string;
  precio: number;
  badge: string;
  badgeClass: string;
  beneficios: string[];
  accion: string;
  incluyeIA: boolean;
  esFlexible: boolean;
  totalSociosAsignados: number;
}

export interface Miembro {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  plan: string;
  planClass: string;
  joinDate: string;
  status: string;
  statusClass: string;
  nextBilling: string;
  nombreMembresia?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  telefono?: string;
  diasRestantes?: number;
  diasClass?: string;
  incluyeIA?: boolean;
  esFlexible?: boolean;
  idMembresia?: number;
  fotoUrl?: string;
}

@Component({
  selector: 'app-membership-list',
  templateUrl: './membership-list.component.html',
  styleUrls: ['./membership-list.component.scss']
})
export class MembershipListComponent implements OnInit {
  planes: Plan[] = [];
  miembros: Miembro[] = [];

  loadingPlanes: boolean = false;
  loadingTabla: boolean = false;

  // Filtros Planes
  searchTermPlan: string = '';
  filtroPlanTipo: string = 'todos';
  filtroPlanFlexible: string = 'todos';

  // Paginación - Planes (6 por página)
  paginaPlanesActual: number = 0; // 0-indexed
  itemsPorPaginaPlanes: number = 6;
  totalPaginasPlanes: number = 1;
  totalElementosPlanes: number = 0;

  // Filtros Socios
  searchTerm: string = '';
  filtroIA: string = 'todos';
  filtroFlexible: string = 'todos';
  filtroMembresia: string = 'todos';

  // Paginación Backend - Socios / Tabla
  paginaActual: number = 0; // 0-indexed
  itemsPorPagina: number = 6;
  totalPaginas: number = 1;
  totalElementos: number = 0;

  avatarErrors: Set<number> = new Set<number>();

  constructor(
    private router: Router,
    private membershipService: MembershipService
  ) { }

  ngOnInit(): void {
    this.cargarPlanes();
    this.cargarTablaMiembros();
  }

  // ==========================================
  // 1. CARGA DE PLANES (CON PAGINACIÓN EN FRONTEND SI EL BACKEND DEVUELVE LISTA COMPLETA)
  // ==========================================
  cargarPlanes(): void {
    this.loadingPlanes = true;

    const filtros: FiltrosMembresias = {
      pagina: this.paginaPlanesActual,
      tamanio: this.itemsPorPaginaPlanes,
      busqueda: this.searchTermPlan.trim() || undefined,
      tipo: this.filtroPlanTipo,
      esFlexible: this.filtroPlanFlexible === 'flexible' ? true : (this.filtroPlanFlexible === 'noFlexible' ? false : undefined)
    };

    this.membershipService.getMembresias(filtros).subscribe({
      next: (res) => {
        let rawList: any[] = [];
        let isBackendPaged = false;

        if (Array.isArray(res)) {
          // El backend envió una lista sin paginar (retorna todos los elementos)
          rawList = res;
          isBackendPaged = false;
        } else if (res?.content && Array.isArray(res.content)) {
          // El backend envió una estructura paged (PageImpl)
          rawList = res.content;
          isBackendPaged = true;
          this.totalPaginasPlanes = res.totalPages || 1;
          this.totalElementosPlanes = res.totalElements || rawList.length;
        }

        // Mapeo general de los datos
        const todosLosPlanesMapeados: Plan[] = rawList.map((item: any) => ({
          id: item.idMembresia || item.id,
          nombre: item.nombre || 'Sin Nombre',
          precio: item.precioTotal || item.precio || 0,
          badge: item.incluyeIA ? 'PREMIUM' : 'STANDARD',
          badgeClass: item.incluyeIA ? 'badge-elite' : 'badge-essential',
          beneficios: item.beneficios
            ? (typeof item.beneficios === 'string'
              ? item.beneficios.split(',').map((b: string) => b.trim())
              : item.beneficios)
            : ['Sin beneficios especificados'],
          accion: 'Ver Detalle',
          incluyeIA: !!item.incluyeIA,
          esFlexible: !!item.esFlexible,
          totalSociosAsignados: item.totalSociosAsignados || item.sociosAsignados?.length || 0
        }));

        if (!isBackendPaged) {
          // PAGINACIÓN EN EL FRONTEND:
          // Si el backend no paginó, calculamos total de páginas y recortamos (slice) a 6 por página.
          this.totalElementosPlanes = todosLosPlanesMapeados.length;
          this.totalPaginasPlanes = Math.ceil(this.totalElementosPlanes / this.itemsPorPaginaPlanes) || 1;

          const inicio = this.paginaPlanesActual * this.itemsPorPaginaPlanes;
          const fin = inicio + this.itemsPorPaginaPlanes;

          this.planes = todosLosPlanesMapeados.slice(inicio, fin);
        } else {
          this.planes = todosLosPlanesMapeados;
        }

        this.loadingPlanes = false;
      },
      error: (err) => {
        console.error('Error al cargar planes paginados:', err);
        this.loadingPlanes = false;
      }
    });
  }

  aplicarFiltrosPlanes(): void {
    this.paginaPlanesActual = 0;
    this.cargarPlanes();
  }

  limpiarFiltrosPlanes(): void {
    this.searchTermPlan = '';
    this.filtroPlanTipo = 'todos';
    this.filtroPlanFlexible = 'todos';
    this.aplicarFiltrosPlanes();
  }

  cambiarPaginaPlanes(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginasPlanes) {
      this.paginaPlanesActual = pagina;
      this.cargarPlanes();
    }
  }

  paginaPlanesAnterior(): void {
    if (this.paginaPlanesActual > 0) {
      this.paginaPlanesActual--;
      this.cargarPlanes();
    }
  }

  paginaPlanesSiguiente(): void {
    if (this.paginaPlanesActual < this.totalPaginasPlanes - 1) {
      this.paginaPlanesActual++;
      this.cargarPlanes();
    }
  }

  get paginasPlanes(): number[] {
    return Array.from({ length: this.totalPaginasPlanes }, (_, i) => i);
  }

  // ==========================================
  // 2. CARGA PAGINADA DE SOCIOS/TABLA
  // ==========================================
  cargarTablaMiembros(): void {
    this.loadingTabla = true;

    const filtros: FiltrosSociosMembresias = {
      pagina: this.paginaActual,
      tamanio: this.itemsPorPagina,
      busqueda: this.searchTerm.trim() || undefined,
      incluyeIA: this.filtroIA === 'conIA' ? true : (this.filtroIA === 'sinIA' ? false : undefined),
      esFlexible: this.filtroFlexible === 'flexible' ? true : (this.filtroFlexible === 'noFlexible' ? false : undefined),
      idMembresia: this.filtroMembresia !== 'todos' ? Number(this.filtroMembresia) : undefined
    };

    this.membershipService.getDashboardMembresias(filtros).subscribe({
      next: (dashboard) => {
        const paginado = dashboard?.membresiasPaginadas;
        const dashboardPlanes = paginado?.content || (Array.isArray(dashboard) ? dashboard : []);
        const usuariosActivos = dashboard?.usuariosActivos || [];

        this.totalPaginas = paginado?.totalPages || 1;
        this.totalElementos = paginado?.totalElements || 0;

        const tempMiembros: Miembro[] = [];
        const fotosUsuariosMap = new Map<number, string>();

        if (Array.isArray(usuariosActivos)) {
          usuariosActivos.forEach((u: any) => {
            const id = u.idUsuario || u.id;
            const foto = u.fotoUrl || u.fotoPerfil || u.foto || u.avatar;
            if (id && foto) {
              fotosUsuariosMap.set(Number(id), foto);
            }
          });
        }

        dashboardPlanes.forEach((membresiaDash: any) => {
          const idMem = membresiaDash.idMembresia;
          const socios = membresiaDash.sociosAsignados || [];

          socios.forEach((socio: any) => {
            const dias = socio.diasRestantes ?? 0;
            const idSocioNum = Number(socio.idSocio);
            const fotoEncontrada = socio.fotoUrl || socio.fotoPerfil || socio.foto || socio.avatar || fotosUsuariosMap.get(idSocioNum) || null;

            tempMiembros.push({
              id: socio.idSocio,
              nombre: socio.nombreCompleto?.split(' ')[0] || 'Usuario',
              apellido: socio.nombreCompleto?.split(' ').slice(1).join(' ') || '',
              email: socio.email || 'Sin correo',
              telefono: socio.telefono || 'N/A',
              plan: membresiaDash.nombre,
              planClass: membresiaDash.incluyeIA ? 'tier-elite' : 'tier-essential',
              joinDate: socio.fechaInicio ? new Date(socio.fechaInicio).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
              status: socio.estado === 'ACTIVA' ? 'Activa' : 'Inactiva',
              statusClass: socio.estado === 'ACTIVA' ? 'active' : 'cancelled',
              nextBilling: socio.fechaVencimiento ? new Date(socio.fechaVencimiento).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
              nombreMembresia: membresiaDash.nombre,
              fechaInicio: socio.fechaInicio,
              fechaFin: socio.fechaVencimiento,
              estado: socio.estado === 'ACTIVA' ? 'Activo' : 'Inactivo',
              diasRestantes: dias,
              diasClass: dias <= 3 ? 'urgente' : (dias <= 7 ? 'alerta' : ''),
              incluyeIA: membresiaDash.incluyeIA,
              esFlexible: membresiaDash.esFlexible,
              idMembresia: idMem,
              fotoUrl: fotoEncontrada
            });
          });
        });

        this.miembros = tempMiembros;
        this.loadingTabla = false;
      },
      error: (err) => {
        console.error('Error al cargar socios paginados:', err);
        this.loadingTabla = false;
      }
    });
  }

  aplicarFiltrosTabla(): void {
    this.paginaActual = 0;
    this.cargarTablaMiembros();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroIA = 'todos';
    this.filtroFlexible = 'todos';
    this.filtroMembresia = 'todos';
    this.aplicarFiltrosTabla();
  }

  irPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarTablaMiembros();
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 0) {
      this.paginaActual--;
      this.cargarTablaMiembros();
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas - 1) {
      this.paginaActual++;
      this.cargarTablaMiembros();
    }
  }

  get paginas(): number[] {
    const total = this.totalPaginas;
    const maxVisible = 5;
    let start = Math.max(0, this.paginaActual - Math.floor(maxVisible / 2));
    let end = Math.min(total - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get inicio(): number {
    return this.paginaActual * this.itemsPorPagina;
  }

  get fin(): number {
    return Math.min(this.inicio + this.itemsPorPagina, this.totalElementos);
  }

  // AVATARES Y AUXILIARES
  getMiembroFoto(miembro: Miembro): string | null {
    if (!miembro || !miembro.fotoUrl) return null;
    let rawUrl = String(miembro.fotoUrl).trim();
    if (rawUrl === '' || rawUrl === 'null' || rawUrl === 'undefined') return null;
    return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
  }

  onAvatarError(idSocio: number): void {
    if (idSocio) this.avatarErrors.add(idSocio);
  }

  hasAvatarError(idSocio: number): boolean {
    return this.avatarErrors.has(idSocio);
  }

  getInitials(nombre?: string, apellido?: string): string {
    const n = nombre ? nombre.trim().charAt(0) : '?';
    const a = apellido ? apellido.trim().charAt(0) : '';
    return (n + a).toUpperCase() || '?';
  }

  // NAVEGACIÓN
  crearNuevaMembresia(): void {
    this.router.navigate(['/dashboard-admin/memberships/new']);
  }

  editarPlan(plan: Plan): void {
    this.router.navigate(['/dashboard-admin/memberships/edit', plan.id]);
  }

  verDetallePlan(plan: Plan): void {
    this.router.navigate(['/dashboard-admin/memberships/detail', plan.id]);
  }
}