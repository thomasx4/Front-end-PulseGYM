import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MembershipService } from '../../../../core/services/membership.service';
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
}

@Component({
  selector: 'app-membership-list',
  templateUrl: './membership-list.component.html',
  styleUrls: ['./membership-list.component.scss']
})
export class MembershipListComponent implements OnInit {
  // ESTADOS Y LISTAS DE DATOS
  planes: Plan[] = [];
  planesFiltrados: Plan[] = [];

  miembros: Miembro[] = [];
  miembrosFiltradosList: Miembro[] = [];

  loading: boolean = false;

  // FILTROS PLANES
  searchTermPlan: string = '';
  filtroPlanTipo: string = 'todos';
  filtroPlanFlexible: string = 'todos';

  // FILTROS TABLA SOCIOS
  searchTerm: string = '';
  filtroIA: string = 'todos';
  filtroFlexible: string = 'todos';
  filtroMembresia: string = 'todos';

  // PAGINACIÓN PLANES
  paginaPlanesActual: number = 1;
  itemsPorPaginaPlanes: number = 6;

  // PAGINACIÓN SOCIOS
  paginaActual: number = 1;
  itemsPorPagina: number = 6;

  constructor(
    private router: Router,
    private membershipService: MembershipService
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  // CARGA DE DATOS DESDE EL SERVICE
  cargarDatos(): void {
    this.loading = true;

    this.membershipService.getMembresias().subscribe({
      next: (membresiasData: any[]) => {
        this.planes = membresiasData.map((item: any) => ({
          id: item.idMembresia,
          nombre: item.nombre || 'Sin Nombre',
          precio: item.precioTotal || 0,
          badge: item.incluyeIA ? 'PREMIUM' : 'STANDARD',
          badgeClass: item.incluyeIA ? 'badge-elite' : 'badge-essential',
          beneficios: item.beneficios ? item.beneficios.split(',').map((b: string) => b.trim()) : ['Sin beneficios especificados'],
          accion: 'Ver Detalle',
          incluyeIA: !!item.incluyeIA,
          esFlexible: !!item.esFlexible,
          totalSociosAsignados: 0
        }));

        this.membershipService.getMembresiasConSocios().subscribe({
          next: (dataConSocios: any[]) => {
            dataConSocios.forEach((item: any) => {
              const plan = this.planes.find(p => p.id === item.idMembresia);
              if (plan) {
                plan.totalSociosAsignados = item.totalSociosAsignados || 0;
              }
            });

            // Mapear miembros de cada membresía
            this.miembros = [];
            dataConSocios.forEach((membresia: any) => {
              if (membresia.sociosAsignados && membresia.sociosAsignados.length > 0) {
                membresia.sociosAsignados.forEach((socio: any) => {
                  const dias = socio.diasRestantes ?? 0;

                  this.miembros.push({
                    id: socio.idSocio,
                    nombre: socio.nombreCompleto?.split(' ')[0] || 'Usuario',
                    apellido: socio.nombreCompleto?.split(' ').slice(1).join(' ') || '',
                    email: socio.email || 'Sin correo',
                    telefono: socio.telefono || 'N/A',
                    plan: membresia.nombre,
                    planClass: membresia.incluyeIA ? 'tier-elite' : 'tier-essential',
                    joinDate: socio.fechaInicio ? new Date(socio.fechaInicio).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
                    status: socio.estado === 'ACTIVA' ? 'Activa' : 'Inactiva',
                    statusClass: socio.estado === 'ACTIVA' ? 'active' : 'cancelled',
                    nextBilling: socio.fechaVencimiento ? new Date(socio.fechaVencimiento).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
                    nombreMembresia: membresia.nombre,
                    fechaInicio: socio.fechaInicio,
                    fechaFin: socio.fechaVencimiento,
                    estado: socio.estado === 'ACTIVA' ? 'Activo' : 'Inactivo',
                    diasRestantes: dias,
                    diasClass: dias <= 3 ? 'urgente' : (dias <= 7 ? 'alerta' : ''),
                    incluyeIA: membresia.incluyeIA,
                    esFlexible: membresia.esFlexible,
                    idMembresia: membresia.idMembresia
                  });
                });
              }
            });

            this.aplicarFiltrosPlanes();
            this.aplicarFiltrosTabla();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error al cargar socios por membresía:', err);
            this.aplicarFiltrosPlanes();
            this.loading = false;
          }
        });
      },
      error: (error: any) => {
        console.error('Error al cargar membresías:', error);
        this.loading = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los datos de membresías',
          icon: 'error',
          confirmButtonColor: '#0c1838'
        });
      }
    });
  }

  // FILTROS PLANES
  aplicarFiltrosPlanes(): void {
    let filtrados = [...this.planes];

    if (this.filtroPlanTipo === 'premium') {
      filtrados = filtrados.filter(p => p.incluyeIA === true);
    } else if (this.filtroPlanTipo === 'standard') {
      filtrados = filtrados.filter(p => p.incluyeIA === false);
    }

    if (this.filtroPlanFlexible === 'flexible') {
      filtrados = filtrados.filter(p => p.esFlexible === true);
    } else if (this.filtroPlanFlexible === 'noFlexible') {
      filtrados = filtrados.filter(p => p.esFlexible === false);
    }

    if (this.searchTermPlan.trim()) {
      const term = this.searchTermPlan.toLowerCase().trim();
      filtrados = filtrados.filter(p => p.nombre.toLowerCase().includes(term));
    }

    this.planesFiltrados = filtrados;
    this.paginaPlanesActual = 1;
  }

  limpiarFiltrosPlanes(): void {
    this.searchTermPlan = '';
    this.filtroPlanTipo = 'todos';
    this.filtroPlanFlexible = 'todos';
    this.aplicarFiltrosPlanes();
  }

  // FILTROS TABLA SOCIOS
  aplicarFiltrosTabla(): void {
    let filtrados = [...this.miembros];

    if (this.filtroIA === 'conIA') {
      filtrados = filtrados.filter(m => m.incluyeIA === true);
    } else if (this.filtroIA === 'sinIA') {
      filtrados = filtrados.filter(m => m.incluyeIA === false);
    }

    if (this.filtroFlexible === 'flexible') {
      filtrados = filtrados.filter(m => m.esFlexible === true);
    } else if (this.filtroFlexible === 'noFlexible') {
      filtrados = filtrados.filter(m => m.esFlexible === false);
    }

    if (this.filtroMembresia !== 'todos') {
      filtrados = filtrados.filter(m => m.idMembresia === +this.filtroMembresia);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtrados = filtrados.filter(m =>
        m.nombre.toLowerCase().includes(term) ||
        m.apellido.toLowerCase().includes(term) ||
        `${m.nombre} ${m.apellido}`.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.plan.toLowerCase().includes(term)
      );
    }

    this.miembrosFiltradosList = filtrados;
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroIA = 'todos';
    this.filtroFlexible = 'todos';
    this.filtroMembresia = 'todos';
    this.aplicarFiltrosTabla();
  }

  // PAGINACIÓN PLANES
  get totalPaginasPlanes(): number {
    return Math.ceil(this.planesFiltrados.length / this.itemsPorPaginaPlanes) || 1;
  }

  get paginasPlanes(): number[] {
    return Array.from({ length: this.totalPaginasPlanes }, (_, i) => i + 1);
  }

  get planesPaginados(): Plan[] {
    const inicio = (this.paginaPlanesActual - 1) * this.itemsPorPaginaPlanes;
    return this.planesFiltrados.slice(inicio, inicio + this.itemsPorPaginaPlanes);
  }

  cambiarPaginaPlanes(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasPlanes) {
      this.paginaPlanesActual = pagina;
    }
  }

  paginaPlanesAnterior(): void {
    if (this.paginaPlanesActual > 1) {
      this.paginaPlanesActual--;
    }
  }

  paginaPlanesSiguiente(): void {
    if (this.paginaPlanesActual < this.totalPaginasPlanes) {
      this.paginaPlanesActual++;
    }
  }

  // PAGINACIÓN SOCIOS
  get totalPaginas(): number {
    return Math.ceil(this.miembrosFiltradosList.length / this.itemsPorPagina) || 1;
  }

  get paginas(): number[] {
    const total = this.totalPaginas;
    const maxVisible = 5;
    let start = Math.max(1, this.paginaActual - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get inicio(): number {
    return (this.paginaActual - 1) * this.itemsPorPagina;
  }

  get fin(): number {
    return Math.min(this.inicio + this.itemsPorPagina, this.miembrosFiltradosList.length);
  }

  get miembrosPaginados(): Miembro[] {
    return this.miembrosFiltradosList.slice(this.inicio, this.fin);
  }

  irPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  // NAVEGACIÓN Y ACCIONES
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