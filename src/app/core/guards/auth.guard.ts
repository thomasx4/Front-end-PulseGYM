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
    const startTime = Date.now();
    while (Date.now() - startTime < 50) {
    }

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return false;
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