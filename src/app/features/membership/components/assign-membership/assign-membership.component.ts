import { Component, OnInit } from '@angular/core';

interface Membresia {
  id: number;
  nombre: string;
  precio: number;
  periodo: string;
  beneficios: string[];
  estado: 'Activa' | 'Inactiva';
  sociosActivos: number;
  color: string;
}

@Component({
  selector: 'app-assign-membership',
  templateUrl: './assign-membership.component.html',
  styleUrls: ['./assign-membership.component.scss']
})
export class AssignMembershipComponent implements OnInit {

  // LISTA DE MEMBRESÍAS
  membresias: Membresia[] = [];

  constructor() { }

  ngOnInit(): void {
    this.cargarMembresias();
  }

  // CARGAR MEMBRESÍAS (datos mock para diseño)
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
        color: '#0a2a4a'
      },
      {
        id: 2,
        nombre: 'ELITE PERFORMANCE',
        precio: 89,
        periodo: 'mo',
        beneficios: ['Everything in Essential', '4 Personal Training sessions'],
        estado: 'Activa',
        sociosActivos: 342,
        color: '#1e4a75'
      },
      {
        id: 3,
        nombre: 'VIP SANCTUARY',
        precio: 199,
        periodo: 'mo',
        beneficios: ['Unlimited PT Sessions', 'Private Lounge & Spa', 'Priority Equipment Booking'],
        estado: 'Activa',
        sociosActivos: 85,
        color: '#2d6a9f'
      }
    ];
  }

  // ASIGNAR MEMBRESÍA A UN SOCIO
  asignarMembresia(id: number): void {
    console.log('Asignar membresía ID:', id);
    // TODO: Abrir modal de asignación
  }

  // VER SOCIOS DE UNA MEMBRESÍA
  verSocios(id: number): void {
    console.log('Ver socios de membresía ID:', id);
    // TODO: Navegar a lista de socios filtrada
  }
}