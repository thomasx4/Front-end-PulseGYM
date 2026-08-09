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

@Component({
  selector: 'app-assign-membership',
  templateUrl: './assign-membership.component.html',
  styleUrls: ['./assign-membership.component.scss']
})
export class AssignMembershipComponent implements OnInit {

  membresias: Membresia[] = [];

  constructor() { }

  ngOnInit(): void {
    this.cargarMembresias();
  }

  cargarMembresias(): void {
    this.membresias = [
      {
        id: 1,
        nombre: 'ESSENTIAL',
        precio: 49,
        periodo: 'mo',
        beneficios: [
          '24/7 Gym Access',
          'Locker Room Access'
        ],
        estado: 'Activa',
        sociosActivos: 120,
        iconoFondo: 'dumbbell'
      },
      {
        id: 2,
        nombre: 'ELITE PERFORMANCE',
        precio: 89,
        periodo: 'mo',
        beneficios: [
          'Everything in Standard',
          '4 Personal Training sessions',
          'Nutritional Consultations'
        ],
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
        beneficios: [
          'Unlimited PT Sessions',
          'Private Lounge & Spa',
          'Priority Equipment Booking'
        ],
        estado: 'Activa',
        sociosActivos: 85,
        iconoFondo: 'star'
      }
    ];
  }

  asignarMembresia(id: number): void {
    console.log('Asignar membresía ID:', id);
  }

  verSocios(id: number): void {
    console.log('Ver socios de membresía ID:', id);
  }
}