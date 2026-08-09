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

@Component({
  selector: 'app-assign-membership',
  templateUrl: './assign-membership.component.html',
  styleUrls: ['./assign-membership.component.scss']
})
export class AssignMembershipComponent implements OnInit {

  membresias: Membresia[] = [];
  
  // Estado del Modal
  mostrarModal: boolean = false;
  membresiaSeleccionada: Membresia | null = null;
  searchTerm: string = '';

  // Datos de Socios (Mock Data)
  socios: Socio[] = [];
  sociosFiltrados: Socio[] = [];

  ngOnInit(): void {
    this.cargarMembresias();
    this.cargarSocios();
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
        iconoFondo: 'dumbbell'
      },
      {
        id: 2,
        nombre: 'ELITE PERFORMANCE',
        precio: 89,
        periodo: 'mo',
        beneficios: ['Everything in Standard', '4 Personal Training sessions', 'Nutritional Consultations'],
        estado: 'Activa',
        sociosActivos: 342,
        destacado: true,
        badgeText: 'MÁS POPULAR'
      },
      {
        id: 3,
        nombre: 'VIP SANCTUARY',
        precio: 199,
        periodo: 'mo',
        beneficios: ['Unlimited PT Sessions', 'Private Lounge & Spa', 'Priority Equipment Booking'],
        estado: 'Activa',
        sociosActivos: 85,
        iconoFondo: 'star'
      }
    ];
  }

  cargarSocios(): void {
    this.socios = [
      {
        id: 101,
        nombre: 'Elena Rodriguez',
        email: 'elena.r@example.com',
        fechaRegistro: 'Mar 12, 2023',
        avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=2d3748&color=fff'
      },
      {
        id: 102,
        nombre: 'Julian Vance',
        email: 'j.vance@workmail.com',
        fechaRegistro: 'Jan 05, 2023',
        avatarUrl: 'https://ui-avatars.com/api/?name=Julian+Vance&background=1a202c&color=fff'
      },
      {
        id: 103,
        nombre: 'Sarah Jenkins',
        email: 'sarahj@web.com',
        fechaRegistro: 'Aug 22, 2023',
        avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=4a5568&color=fff'
      },
      {
        id: 104,
        nombre: "Liam O'Connell",
        email: 'liam.oc@mail.com',
        fechaRegistro: 'May 15, 2023',
        avatarUrl: "https://ui-avatars.com/api/?name=Liam+O'Connell&background=0f172a&color=fff"
      },
      {
        id: 105,
        nombre: 'Sophia Martinez',
        email: 'sophia.m@mail.com',
        fechaRegistro: 'Jul 18, 2023',
        avatarUrl: 'https://ui-avatars.com/api/?name=Sophia+Martinez&background=334155&color=fff'
      }
    ];
    this.sociosFiltrados = [...this.socios];
  }

  // ABRIR MODAL
  asignarMembresia(id: number): void {
    const seleccionada = this.membresias.find(m => m.id === id);
    if (seleccionada) {
      this.membresiaSeleccionada = seleccionada;
      this.mostrarModal = true;
      this.searchTerm = '';
      this.sociosFiltrados = [...this.socios];
    }
  }

  // CERRAR MODAL
  cerrarModal(): void {
    this.mostrarModal = false;
    this.membresiaSeleccionada = null;
  }

  // FILTRAR SOCIOS
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTerm = value;
    
    this.sociosFiltrados = this.socios.filter(s => 
      s.nombre.toLowerCase().includes(value) || 
      s.email.toLowerCase().includes(value)
    );
  }

  // CONFIRMAR ASIGNACIÓN
  confirmarAsignacion(socio: Socio): void {
    console.log(`Asignando la membresía "${this.membresiaSeleccionada?.nombre}" al socio:`, socio);
    this.cerrarModal();
  }

  verSocios(id: number): void {
    console.log('Ver socios de membresía ID:', id);
  }
}