import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isMobileOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMobileMenu(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  logout(): void {
    // 1. Limpiar todo
    this.authService.logout();
    // 2. Redirigir al login (reemplazar historial para evitar volver atrás)
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}