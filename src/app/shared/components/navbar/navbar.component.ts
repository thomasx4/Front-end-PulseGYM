import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() isOpen: boolean = false;
  @Output() closeMenu = new EventEmitter<void>();

  userRoleLabel = 'SOCIO';
  isTrainer = false;

  equiposOpen = false;

  private routerSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserRole(this.router.url);
    this.equiposOpen = this.isEquiposActive;

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.checkUserRole(url);
      if (this.isEquiposActive) {
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

  get isEquiposActive(): boolean {
    return this.router.url.startsWith('/trainer/equipos');
  }

  toggleEquipos(): void {
    this.equiposOpen = !this.equiposOpen;
  }

  closeMobileMenu(): void {
    this.closeMenu.emit();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}