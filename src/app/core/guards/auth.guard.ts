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
    if (this.authService.isLoginGloballyLocked()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (this.authService.debeCambiarContrasena()) {
      if (!state.url.includes('cambiar-contrasena-obligatorio')) {
        this.router.navigate(['/auth/cambiar-contrasena-obligatorio']);
        return false;
      }
      return true;
    }

    const expectedRole = route.data['expectedRole'];
    if (!expectedRole) {
      return true;
    }

    const userRole = this.authService.getCurrentRole();
    if (userRole !== expectedRole) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    return true;
  }
}