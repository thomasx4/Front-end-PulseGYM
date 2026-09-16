import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMobileOpen = false;
  userRoleLabel = 'SOCIO';
  isTrainer = false;

  // 👇 Submenú de Equipos
  equiposOpen = false;

  // 👇 Para limpiar la suscripción al destruir el componente
  private routerSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserRole(this.router.url);

    // Abrir submenú de equipos si ya estamos en esa ruta
    this.equiposOpen = this.router.url.startsWith('/trainer/equipos');

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.checkUserRole(url);

      // 👇 Abrir automáticamente el submenú si entramos a /trainer/equipos/*
      if (url.startsWith('/trainer/equipos')) {
        this.equiposOpen = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private checkUserRole(url: string): void {
    if (url.includes('/trainer')) {
      this.userRoleLabel = 'ENTRENADOR';
      this.isTrainer = true;
    } else {
      this.userRoleLabel = 'SOCIO';
      this.isTrainer = false;
    }
  }

  // ==========================================
  // SUBMENÚ EQUIPOS
  // ==========================================

  /**
   * Marca "Equipos" como activo si estás en cualquier ruta de equipos
   */
  get isEquiposActive(): boolean {
    return this.router.url.startsWith('/trainer/equipos');
  }

  /**
   * Abre/cierra el submenú de equipos
   */
  toggleEquipos(): void {
    this.equiposOpen = !this.equiposOpen;
  }

  // ==========================================
  // MENÚ MÓVIL
  // ==========================================
  toggleMobileMenu(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  closeMobileMenu(): void {
    this.isMobileOpen = false;
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}