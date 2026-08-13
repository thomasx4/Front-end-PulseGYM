import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MembershipService } from '../../../../core/services/membership.service';
import Swal from 'sweetalert2';

interface Plan {
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

interface Miembro {
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
  incluyeIA?: boolean;
  esFlexible?: boolean;
}

@Component({
  selector: 'app-membership-list',
  templateUrl: './membership-list.component.html',
  styleUrls: ['./membership-list.component.scss']
})
export class MembershipListComponent implements OnInit {
  // ==================== PLANES (TODOS) ====================
  planes: Plan[] = [];

  // ==================== MIEMBROS ====================
  miembros: Miembro[] = [];
  miembrosFiltradosList: Miembro[] = [];

  // ==================== FILTROS (SOLO PARA TABLA) ====================
  searchTerm: string = '';
  filtroIA: string = 'todos';
  filtroFlexible: string = 'todos';

  // ==================== PAGINACIÓN ====================
  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  loading: boolean = false;

  constructor(
    private router: Router,
    private membershipService: MembershipService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    
    this.membershipService.getMembresiasConSocios().subscribe({
      next: (data: any[]) => {
        // Mapear planes (TODOS, sin filtros)
        this.planes = data.map((item: any) => ({
          id: item.idMembresia,
          nombre: item.nombre,
          precio: item.precioTotal || 0,
          badge: item.incluyeIA ? 'PREMIUM' : 'STANDARD',
          badgeClass: item.incluyeIA ? 'badge-elite' : 'badge-essential',
          beneficios: item.beneficios ? item.beneficios.split(',').map((b: string) => b.trim()) : ['Sin beneficios'],
          accion: 'Edit Plan',
          incluyeIA: item.incluyeIA,
          esFlexible: item.esFlexible,
          totalSociosAsignados: item.totalSociosAsignados || 0
        }));

        // Mapear socios asignados (con datos de membresía para filtrar)
        this.miembros = [];
        data.forEach((membresia: any) => {
          if (membresia.sociosAsignados && membresia.sociosAsignados.length > 0) {
            membresia.sociosAsignados.forEach((socio: any) => {
              this.miembros.push({
                id: socio.idSocio,
                nombre: socio.nombreCompleto?.split(' ')[0] || 'Usuario',
                apellido: socio.nombreCompleto?.split(' ').slice(1).join(' ') || '',
                email: socio.email || '',
                telefono: socio.telefono || '',
                plan: membresia.nombre,
                planClass: membresia.incluyeIA ? 'tier-elite' : 'tier-essential',
                joinDate: socio.fechaInicio ? new Date(socio.fechaInicio).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
                status: socio.estado === 'ACTIVA' ? 'Active' : 'Inactive',
                statusClass: socio.estado === 'ACTIVA' ? 'active' : 'cancelled',
                nextBilling: socio.fechaVencimiento ? new Date(socio.fechaVencimiento).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
                nombreMembresia: membresia.nombre,
                fechaInicio: socio.fechaInicio ? new Date(socio.fechaInicio).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
                fechaFin: socio.fechaVencimiento ? new Date(socio.fechaVencimiento).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
                estado: socio.estado === 'ACTIVA' ? 'Activo' : 'Inactivo',
                diasRestantes: socio.diasRestantes,
                incluyeIA: membresia.incluyeIA,
                esFlexible: membresia.esFlexible
              });
            });
          }
        });

        this.aplicarFiltrosTabla();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar datos:', error);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
      }
    });
  }

  // ==================== FILTROS SOLO PARA LA TABLA ====================
  aplicarFiltrosTabla(): void {
    let filtrados = [...this.miembros];

    // Filtro por IA
    if (this.filtroIA === 'conIA') {
      filtrados = filtrados.filter(m => m.incluyeIA === true);
    } else if (this.filtroIA === 'sinIA') {
      filtrados = filtrados.filter(m => m.incluyeIA === false);
    }

    // Filtro por Flexible
    if (this.filtroFlexible === 'flexible') {
      filtrados = filtrados.filter(m => m.esFlexible === true);
    } else if (this.filtroFlexible === 'noFlexible') {
      filtrados = filtrados.filter(m => m.esFlexible === false);
    }

    // Filtro por búsqueda (acepta espacios)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtrados = filtrados.filter(m =>
        m.nombre.toLowerCase().includes(term) ||
        m.apellido.toLowerCase().includes(term) ||
        (m.nombre + ' ' + m.apellido).toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.plan.toLowerCase().includes(term) ||
        (m.nombreMembresia?.toLowerCase().includes(term) || false)
      );
    }

    this.miembrosFiltradosList = filtrados;
    this.paginaActual = 1;
  }

  // ==================== LIMPIAR FILTROS ====================
  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroIA = 'todos';
    this.filtroFlexible = 'todos';
    this.aplicarFiltrosTabla();
  }

  // ==================== PAGINACIÓN ====================
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

  // ==================== MÉTODOS ====================
  crearNuevaMembresia(): void {
    this.router.navigate(['/dashboard-admin/memberships/new']);
  }

  editarPlan(plan: Plan): void {
    this.router.navigate(['/dashboard-admin/memberships/edit', plan.id]);
  }

  verDetallePlan(plan: Plan): void {
    this.router.navigate(['/dashboard-admin/memberships/detail', plan.id]);
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
}