import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';  // ← IMPORTAR Router

interface Plan {
  id: number;
  nombre: string;
  precio: number;
  badge: string;
  badgeClass: string;
  beneficios: string[];
  accion: string;
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
}

@Component({
  selector: 'app-membership-list',
  templateUrl: './membership-list.component.html',
  styleUrls: ['./membership-list.component.scss']
})
export class MembershipListComponent implements OnInit {
  // ==================== PLANES ====================
  planes: Plan[] = [
    {
      id: 1,
      nombre: 'ESSENTIAL',
      precio: 49,
      badge: 'STANDARD',
      badgeClass: 'badge-essential',
      beneficios: [
        '24/7 Gym Access',
        'Locker Room Access',
        'Personal Training'
      ],
      accion: 'Edit Plan'
    },
    {
      id: 2,
      nombre: 'ELITE PERFORMANCE',
      precio: 89,
      badge: 'PREMIUM',
      badgeClass: 'badge-elite',
      beneficios: [
        'Everything in Standard',
        '4 Personal Training sessions',
        'Nutritional Consultations'
      ],
      accion: 'Manage Tier'
    },
    {
      id: 3,
      nombre: 'VIP SANCTUARY',
      precio: 199,
      badge: 'VIP',
      badgeClass: 'badge-vip',
      beneficios: [
        'Unlimited PT Sessions',
        'Private Lounge & Spa',
        'Priority Equipment Booking'
      ],
      accion: 'Edit Plan'
    }
  ];

  // ==================== MIEMBROS ====================
  miembros: Miembro[] = [
    {
      id: 1,
      nombre: 'Elena',
      apellido: 'Rodriguez',
      email: 'elena.riguez@example.com',
      plan: 'ELITTER',
      planClass: 'tier-elite',
      joinDate: 'Mar 12, 2023',
      status: 'Active',
      statusClass: 'active',
      nextBilling: 'Oct 12, 2023'
    },
    {
      id: 2,
      nombre: 'Julian',
      apellido: 'Vance',
      email: 'jvance@workmail.com',
      plan: 'VIP SANCTUARY',
      planClass: 'tier-vip',
      joinDate: 'Jan 05, 2023',
      status: 'Active',
      statusClass: 'active',
      nextBilling: 'Oct 05, 2023'
    },
    {
      id: 3,
      nombre: 'Sarah',
      apellido: 'Jenkins',
      email: 'sarahj@web.com',
      plan: 'STANDARD',
      planClass: 'tier-essential',
      joinDate: 'Aug 22, 2023',
      status: 'Grace Period',
      statusClass: 'grace',
      nextBilling: 'Sep 22, 2023'
    },
    {
      id: 4,
      nombre: 'Liam',
      apellido: "O'Connell",
      email: 'liam.oc@mail.com',
      plan: 'ELITTER',
      planClass: 'tier-elite',
      joinDate: 'May 15, 2023',
      status: 'Cancelled',
      statusClass: 'cancelled',
      nextBilling: '--'
    }
  ];

  // ==================== FILTROS Y PAGINACIÓN ====================
  searchTerm: string = '';
  mostrarFiltros: boolean = false;
  paginaActual: number = 1;
  itemsPorPagina: number = 10;

  // ==================== CONSTRUCTOR ====================
  constructor(private router: Router) {}  // ← INYECTAR Router

  get miembrosFiltrados(): Miembro[] {
    if (!this.searchTerm.trim()) {
      return this.miembros;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.miembros.filter(m =>
      m.nombre.toLowerCase().includes(term) ||
      m.apellido.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.plan.toLowerCase().includes(term)
    );
  }

  get totalPaginas(): number {
    return Math.ceil(this.miembrosFiltrados.length / this.itemsPorPagina) || 1;
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
    return Math.min(this.inicio + this.itemsPorPagina, this.miembrosFiltrados.length);
  }

  get miembrosPaginados(): Miembro[] {
    return this.miembrosFiltrados.slice(this.inicio, this.fin);
  }

  // ==================== MÉTODOS ====================
  ngOnInit(): void {
    // Cargar datos desde el backend si es necesario
  }

  crearNuevaMembresia(): void {
    // Navegar a crear nueva membresía
    this.router.navigate(['/dashboard-admin/memberships/new']);
  }

  editarPlan(plan: Plan): void {
    this.router.navigate(['/dashboard-admin/memberships/edit', plan.id]);
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  filtrarMiembros(): void {
    this.paginaActual = 1;
  }

  accionesMiembro(miembro: Miembro): void {
    console.log('Acciones para:', miembro.nombre);
    // TODO: Mostrar menú de acciones (renovar, suspender, cancelar)
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