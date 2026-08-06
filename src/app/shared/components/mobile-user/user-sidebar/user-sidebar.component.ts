/**
 * Sidebar de navegacion para el panel de usuario
 */
import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-user-sidebar',
  templateUrl: './user-sidebar.component.html',
  styleUrls: ['./user-sidebar.component.scss']
})
export class UserSidebarComponent {
  brand = {
    name: 'Pulse GYM',
    subtitle: 'Elite Performance'
  };

  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/user' },
    { icon: 'profile', label: 'Profile', route: '/user/profile' },
    { icon: 'memberships', label: 'Memberships', route: '/user/memberships' },
    { icon: 'routines', label: 'Routines', route: '/user/workouts' },
    { icon: 'payments', label: 'Payments', route: '/user/payments' }
  ];

  constructor(private router: Router) {}

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}