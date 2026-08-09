import { Component, OnInit } from '@angular/core';

export interface Membresia {
  id: number;
  nombre: string;
  precio: number;
  periodo: string;
  beneficios: string[];
  estado: 'Activa' | 'Inactiva';
  sociosActivos: number;
  destacado?: boolean;
  badgeText?: string;
  iconoFondo?: 'dumbbell' | 'star' | string;
}

export interface Socio {
  id: number;
  nombre: string;
  email: string;
  fechaRegistro: string;
  avatarUrl: string;
}

export interface SocioAsignado {
  id: number;
  nombre: string;
  email: string;
  fechaAsignacion: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-assign-membership',
  templateUrl: './assign-membership.component.html',
  styleUrls: ['./assign-membership.component.scss'],
})
export class AssignMembershipComponent implements OnInit {
  // Control de Vista: 'tarjetas' | 'socios'
  vistaActual: 'tarjetas' | 'socios' = 'tarjetas';

  membresias: Membresia[] = [];
  membresiaSeleccionada: Membresia | null = null;

  // Estado del Modal (Asignar)
  mostrarModal: boolean = false;
  searchTermModal: string = '';

  // Búsqueda en la Vista de Socios Asignados
  searchTermSocios: string = '';

  // Datos Mocks
  sociosModal: Socio[] = [];
  sociosFiltradosModal: Socio[] = [];

  sociosAsignados: SocioAsignado[] = [];
  sociosAsignadosFiltrados: SocioAsignado[] = [];

  ngOnInit(): void {
    this.cargarMembresias();
    this.cargarSociosModal();
    this.cargarSociosAsignados();
  }

  cargarMembresias(): void {
    this.membresias = [
      {
        id: 1,
        nombre: 'ESSENTIAL',
        precio: 49,
        periodo: 'mo',
        beneficios: ['24/7 Gym Access', 'Locker Room Access'],
        estado: 'Activa',
        sociosActivos: 120,
        iconoFondo: 'dumbbell',
      },
      {
        id: 2,
        nombre: 'ELITE PERFORMANCE',
        precio: 89,
        periodo: 'mo',
        beneficios: [
          'Everything in Standard',
          '4 Personal Training sessions',
          'Nutritional Consultations',
        ],
        estado: 'Activa',
        sociosActivos: 342,
        destacado: true,
        badgeText: 'MÁS POPULAR',
      },
      {
        id: 3,
        nombre: 'VIP SANCTUARY',
        precio: 199,
        periodo: 'mo',
        beneficios: [
          'Unlimited PT Sessions',
          'Private Lounge & Spa',
          'Priority Equipment Booking',
        ],
        estado: 'Activa',
        sociosActivos: 85,
        iconoFondo: 'star',
      },
    ];
  }

  cargarSociosModal(): void {
    this.sociosModal = [
      {
        id: 101,
        nombre: 'Elena Rodriguez',
        email: 'elena.r@example.com',
        fechaRegistro: 'Mar 12, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=2d3748&color=fff',
      },
      {
        id: 102,
        nombre: 'Julian Vance',
        email: 'j.vance@workmail.com',
        fechaRegistro: 'Jan 05, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Julian+Vance&background=1a202c&color=fff',
      },
      {
        id: 103,
        nombre: 'Sarah Jenkins',
        email: 'sarahj@web.com',
        fechaRegistro: 'Aug 22, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=4a5568&color=fff',
      },
      {
        id: 104,
        nombre: "Liam O'Connell",
        email: 'liam.oc@mail.com',
        fechaRegistro: 'May 15, 2023',
        avatarUrl:
          "https://ui-avatars.com/api/?name=Liam+O'Connell&background=0f172a&color=fff",
      },
      {
        id: 105,
        nombre: 'Sophia Martinez',
        email: 'sophia.m@mail.com',
        fechaRegistro: 'Jul 18, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Sophia+Martinez&background=334155&color=fff',
      },
    ];
    this.sociosFiltradosModal = [...this.sociosModal];
  }

  cargarSociosAsignados(): void {
    this.sociosAsignados = [
      {
        id: 1,
        nombre: 'Elena Rodriguez',
        email: 'elena.r@example.com',
        fechaAsignacion: 'Mar 12, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=2d3748&color=fff',
      },
      {
        id: 2,
        nombre: 'Julian Vance',
        email: 'j.vance@workmail.com',
        fechaAsignacion: 'Jan 05, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Julian+Vance&background=1a202c&color=fff',
      },
      {
        id: 3,
        nombre: 'Sarah Jenkins',
        email: 'sarahj@web.com',
        fechaAsignacion: 'Aug 22, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=4a5568&color=fff',
      },
      {
        id: 4,
        nombre: "Liam O'Connell",
        email: 'liam.oc@mail.com',
        fechaAsignacion: 'May 15, 2023',
        avatarUrl:
          "https://ui-avatars.com/api/?name=Liam+O'Connell&background=0f172a&color=fff",
      },
      {
        id: 5,
        nombre: 'Sophia Martinez',
        email: 'sophia.m@mail.com',
        fechaAsignacion: 'Jul 18, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Sophia+Martinez&background=334155&color=fff',
      },
      {
        id: 6,
        nombre: 'Noah Thompson',
        email: 'noah.t@mail.com',
        fechaAsignacion: 'Aug 30, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Noah+Thompson&background=1e293b&color=fff',
      },
      {
        id: 7,
        nombre: 'Olivia Parker',
        email: 'olivia.p@mail.com',
        fechaAsignacion: 'Sep 10, 2023',
        avatarUrl:
          'https://ui-avatars.com/api/?name=Olivia+Parker&background=475569&color=fff',
      },
    ];
    this.sociosAsignadosFiltrados = [...this.sociosAsignados];
  }

  // NAVEGACIÓN A MÓDULO VER SOCIOS
  verSocios(id: number): void {
    const seleccionada = this.membresias.find((m) => m.id === id);
    if (seleccionada) {
      this.membresiaSeleccionada = seleccionada;
      this.vistaActual = 'socios';
      this.searchTermSocios = '';
      this.sociosAsignadosFiltrados = [...this.sociosAsignados];
    }
  }

  volverAMembresias(): void {
    this.vistaActual = 'tarjetas';
    this.membresiaSeleccionada = null;
  }

  // ABRIR/CERRAR MODAL
  asignarMembresia(id: number): void {
    const seleccionada = this.membresias.find((m) => m.id === id);
    if (seleccionada) {
      this.membresiaSeleccionada = seleccionada;
      this.mostrarModal = true;
      this.searchTermModal = '';
      this.sociosFiltradosModal = [...this.sociosModal];
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  // FILTROS
  onSearchModal(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTermModal = value;
    this.sociosFiltradosModal = this.sociosModal.filter(
      (s) =>
        s.nombre.toLowerCase().includes(value) ||
        s.email.toLowerCase().includes(value),
    );
  }

  onSearchSociosAsignados(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTermSocios = value;
    this.sociosAsignadosFiltrados = this.sociosAsignados.filter(
      (s) =>
        s.nombre.toLowerCase().includes(value) ||
        s.email.toLowerCase().includes(value),
    );
  }

  confirmarAsignacion(socio: Socio): void {
    console.log(`Asignando membresía a: ${socio.nombre}`);
    this.cerrarModal();
  }
}
