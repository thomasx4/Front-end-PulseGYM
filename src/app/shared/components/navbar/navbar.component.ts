import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isMobileOpen = false;

  constructor(private authService: AuthService) {}

  toggleMobileMenu(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  /**
   * Cerrar sesión - Usa el AuthService que ya tiene el método logout()
   */
  logout(): void {
    this.authService.logout();
  }
}