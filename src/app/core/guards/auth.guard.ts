import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data['expectedRole'];
    const userRole = localStorage.getItem('role');

    if (!userRole) {
      this.router.navigate(['auth/login']);
      return false;
    }

    if (expectedRole && userRole !== expectedRole) {
      this.router.navigate(['auth/login']); 
      return false;
    }

    return true;
  }
}