import { Component } from '@angular/core';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})

export class SidebarComponent {
  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'grid', route: '/dashboard' },
    { label: 'Users', icon: 'users', route: '/users' },
    { label: 'Memberships', icon: 'id-card', route: '/memberships' },
    { label: 'Attendance', icon: 'clipboard', route: '/attendance' },
    { label: 'Payments', icon: 'credit-card', route: '/payments' },
    { label: 'Equipment', icon: 'tool', route: '/equipment' },
    { label: 'Reports', icon: 'bar-chart', route: '/reports' }
  ];

  onLogout() {
    
  }
}