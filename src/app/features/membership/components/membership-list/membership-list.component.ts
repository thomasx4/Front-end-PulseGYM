import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FiltrosSociosMembresias, MembershipService, PageResponse, SocioAsignado } from '../../../../core/services/membership.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../../../../core/services/user.service';

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
  fotoUrl?: string | null;
}

@Component({
  selector: 'app-membership-list',
  templateUrl: './membership-list.component.html',
  styleUrls: ['./membership-list.component.scss']
})
export class MembershipListComponent implements OnInit {
  // Datos Planes
  todosLosPlanes: Plan[] = [];
  planesFiltrados: Plan[] = [];
  planes: Plan[] = [];

  // Miembros
  miembros: Miembro[] = [];

  loadingPlanes: boolean = false;
  loadingTabla: boolean = false;

  // Filtros Planes
  searchTermPlan: string = '';
  filtroPlanTipo: string = 'todos';
  filtroPlanFlexible: string = 'todos';

  // Paginación Planes
  paginaPlanesActual: number = 0;
  itemsPorPaginaPlanes: number = 6;
  totalPaginasPlanes: number = 1;

  // Filtros Socios
  searchTerm: string = '';
  filtroIA: string = 'todos';
  filtroFlexible: string = 'todos';
  filtroMembresia: string = 'todos';

  // Paginación Socios
  paginaActual: number = 0;
  itemsPorPagina: number = 6;
  totalPaginas: number = 1;
  totalElementos: number = 0;

  // 👇 AGREGADO PARA AVATARES
  avatarErrors: Set<number> = new Set<number>();

  constructor(
    private router: Router,
    private membershipService: MembershipService,
    private userService: UserService 
  ) { }

  ngOnInit(): void {
    this.cargarPlanes();
    this.cargarTablaMiembros();
  }

  cargarPlanes(): void {
    this.loadingPlanes = true;

    this.membershipService.getMembresias({ tamanio: 100 }).subscribe({
      next: (res) => {
        let rawList: any[] = [];
        if (Array.isArray(res)) {
          rawList = res;
        } else if (res?.content && Array.isArray(res.content)) {
          rawList = res.content;
        }

        this.todosLosPlanes = rawList.map((item: any) => ({
          id: item.idMembresia || item.id,
          nombre: item.nombre || 'Sin Nombre',
          precio: item.precioTotal || item.precio || 0,
          badge: item.incluyeIA ? 'PREMIUM' : 'STANDARD',
          badgeClass: item.incluyeIA ? 'badge-elite' : 'badge-essential',
          beneficios: this.parseBeneficios(item.beneficios),
          accion: 'Ver Detalle',
          incluyeIA: !!item.incluyeIA,
          esFlexible: !!item.esFlexible,
          totalSociosAsignados: item.sociosAsignados?.length || item.totalSociosAsignados || 0
        }));

        this.aplicarFiltrosPlanes();
        this.loadingPlanes = false;
      },
      error: (err) => {
        console.error('Error al cargar planes:', err);
        this.loadingPlanes = false;
      }
    });
  }

  private parseBeneficios(beneficios: any): string[] {
    if (!beneficios) return ['Sin beneficios especificados'];
    if (typeof beneficios === 'string') {
      return beneficios.split(',').map((b: string) => b.trim());
    }
    return Array.isArray(beneficios) ? beneficios : [beneficios];
  }

  aplicarFiltrosPlanes(): void {
    let result = [...this.todosLosPlanes];

    if (this.filtroPlanTipo === 'premium') {
      result = result.filter(p => p.incluyeIA);
    } else if (this.filtroPlanTipo === 'standard') {
      result = result.filter(p => !p.incluyeIA);
    }

    if (this.filtroPlanFlexible === 'flexible') {
      result = result.filter(p => p.esFlexible);
    } else if (this.filtroPlanFlexible === 'noFlexible') {
      result = result.filter(p => !p.esFlexible);
    }

    if (this.searchTermPlan.trim()) {
      const term = this.searchTermPlan.trim().toLowerCase();
      result = result.filter(p => p.nombre.toLowerCase().includes(term));
    }

    this.planesFiltrados = result;
    this.paginaPlanesActual = 0;
    this.actualizarPaginacionPlanes();
  }

  actualizarPaginacionPlanes(): void {
    this.totalPaginasPlanes = Math.ceil(this.planesFiltrados.length / this.itemsPorPaginaPlanes) || 1;
    const inicio = this.paginaPlanesActual * this.itemsPorPaginaPlanes;
    this.planes = this.planesFiltrados.slice(inicio, inicio + this.itemsPorPaginaPlanes);
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
      this.actualizarPaginacionPlanes();
    }
  }

  paginaPlanesAnterior(): void {
    if (this.paginaPlanesActual > 0) {
      this.paginaPlanesActual--;
      this.actualizarPaginacionPlanes();
    }
  }

  paginaPlanesSiguiente(): void {
    if (this.paginaPlanesActual < this.totalPaginasPlanes - 1) {
      this.paginaPlanesActual++;
      this.actualizarPaginacionPlanes();
    }
  }

  get paginasPlanes(): number[] {
    return Array.from({ length: this.totalPaginasPlanes }, (_, i) => i);
  }

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

  forkJoin({
    socios: this.membershipService.getSociosActivosPaginadosServer(filtros),
    usuarios: this.userService.listarPerfilesPaginados({ tamanio: 100 }).pipe(catchError(() => of({ content: [] })))
  }).subscribe({
    next: ({ socios, usuarios }) => {
      const listaUsuarios = usuarios?.content || [];

      const fotosMap = new Map<number, string>();
      if (Array.isArray(listaUsuarios)) {
        listaUsuarios.forEach((u: any) => {
          const id = Number(u.idUsuario || u.id);
          const foto = u.fotoUrl || u.fotoPerfil || u.foto || u.avatar;
          if (id && foto) {
            fotosMap.set(id, foto);
          }
        });
      }

      this.totalPaginas = socios.totalPages || 1;
      this.totalElementos = socios.totalElements || 0;
      this.paginaActual = socios.number || 0;

      this.miembros = socios.content.map((socio: SocioAsignado) => {
        const membresia = socio.membresia || socio as any;
        const dias = socio.diasRestantes ?? 0;
        
        const idSocioNum = Number(socio.idSocio);
        const fotoUrlFinal = fotosMap.get(idSocioNum) || socio.fotoUrl || null;
        
        return {
          id: idSocioNum,
          nombre: socio.nombreCompleto?.split(' ')[0] || 'Usuario',
          apellido: socio.nombreCompleto?.split(' ').slice(1).join(' ') || '',
          email: socio.email || 'Sin correo',
          telefono: socio.telefono || 'N/A',
          plan: membresia?.nombre || socio.tipoMembresiaDescripcion || 'Sin plan',
          planClass: membresia?.incluyeIA ? 'tier-elite' : 'tier-essential',
          joinDate: socio.fechaInicio ? new Date(socio.fechaInicio).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          status: socio.estado === 'ACTIVA' ? 'Activa' : 'Inactiva',
          statusClass: socio.estado === 'ACTIVA' ? 'active' : 'cancelled',
          nextBilling: socio.fechaVencimiento ? new Date(socio.fechaVencimiento).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
          nombreMembresia: membresia?.nombre || socio.tipoMembresiaDescripcion,
          fechaInicio: socio.fechaInicio,
          fechaFin: socio.fechaVencimiento,
          estado: socio.estado === 'ACTIVA' ? 'Activo' : 'Inactivo',
          diasRestantes: dias,
          diasClass: dias <= 3 ? 'urgente' : (dias <= 7 ? 'alerta' : ''),
          incluyeIA: !!membresia?.incluyeIA,
          esFlexible: !!membresia?.esFlexible || socio.esFlexible || false,
          idMembresia: membresia?.idMembresia || 0,
          fotoUrl: fotoUrlFinal
        };
      });

      this.loadingTabla = false;
    },
    error: (err) => {
      console.error('Error al cargar socios paginados:', err);
      this.miembros = [];
      this.totalElementos = 0;
      this.totalPaginas = 0;
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
    if (pagina >= 0 && pagina < this.totalPaginas && pagina !== this.paginaActual) {
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

  get inicio(): number {
    return this.totalElementos === 0 ? 0 : this.paginaActual * this.itemsPorPagina + 1;
  }

  get fin(): number {
    return Math.min((this.paginaActual + 1) * this.itemsPorPagina, this.totalElementos);
  }

  get paginas(): number[] {
    const maxVisible = 5;
    let start = Math.max(0, this.paginaActual - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPaginas, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    return Array.from({ length: end - start }, (_, i) => start + i);
  }

  getMiembroFoto(miembro: Miembro): string | null {
    if (!miembro) return null;
    return miembro.fotoUrl || null;
  }

  onAvatarError(id: number): void {
    if (id) {
      this.avatarErrors.add(id);
    }
  }

  hasAvatarError(id: number): boolean {
    return this.avatarErrors.has(id);
  }

  getInitials(nombre?: string, apellido?: string): string {
    const n = nombre ? nombre.trim().charAt(0) : '?';
    const a = apellido ? apellido.trim().charAt(0) : '';
    return (n + a).toUpperCase() || '?';
  }

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
