import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // 1. Verificar si el login está bloqueado globalmente
    if (this.authService.isLoginGloballyLocked()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // 2. Verificar si está autenticado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // 3. Verificar si debe cambiar contraseña obligatoriamente
    if (this.authService.debeCambiarContrasena()) {
      if (!state.url.includes('cambiar-contrasena-obligatorio')) {
        this.router.navigate(['/auth/cambiar-contrasena-obligatorio']);
        return false;
      }
      return true;
    }

    // 4. 🔓 Verificar roles permitidos (soporta 'expectedRole' y 'expectedRoles')
    const expectedRole = route.data['expectedRole'] as string | undefined;
    const expectedRoles = route.data['expectedRoles'] as string[] | undefined;

    // Si no hay restricción de rol, permitir
    if (!expectedRole && (!expectedRoles || expectedRoles.length === 0)) {
      return true;
    }

    const userRole = this.authService.getCurrentRole();
    if (!userRole) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Verificar si el rol del usuario está permitido
    let tieneAcceso = false;

    if (expectedRole) {
      tieneAcceso = userRole === expectedRole;
    }

    if (!tieneAcceso && expectedRoles && expectedRoles.length > 0) {
      tieneAcceso = expectedRoles.includes(userRole);
    }

    if (!tieneAcceso) {
      // Redirigir según su rol
      this.redirigirSegunRol(userRole);
      return false;
    }

    return true;
  }

  /**
   * Redirige al usuario a su dashboard según su rol
   */
  private redirigirSegunRol(role: string): void {
    switch (role) {
      case 'administrador':
        this.router.navigate(['/dashboard-admin']);
        break;
      case 'recepcionista':
        this.router.navigate(['/dashboard-admin']);
        break;
      case 'entrenador':
        this.router.navigate(['/trainer']);
        break;
      default:
        this.router.navigate(['/user']);
        break;
    }
  }
}