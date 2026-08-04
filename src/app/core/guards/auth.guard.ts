import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // 🔥 Verificación directa desde el localStorage (más rápida)
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    // Si no hay token ni usuario, redirigir al login
    if (!token || !userData) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Obtener el rol esperado desde la ruta
    const expectedRole = route.data['expectedRole'];

    // Si no hay rol esperado, permitir el acceso (solo verifica que esté logueado)
    if (!expectedRole) {
      return true;
    }

    // Verificar si el rol del usuario coincide
    let userRole: string | null = null;
    try {
      const user = JSON.parse(userData);
      userRole = user?.role || null;
    } catch (e) {
      userRole = null;
    }

    if (userRole !== expectedRole) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    return true;
  }
}