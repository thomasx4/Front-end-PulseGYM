import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { IdleService } from '../../../../core/services/idle.service';
import { RolUsuario } from '../../models/auth/auth.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  errorMessage = '';
  successMessage = '';
  private subscription?: Subscription;

  private idleService = inject(IdleService);

  lockRemainingSeconds: number = 0;
  private lockTimer: any;

  slides = [
    {
      title: 'Bienvenido a Pulse GYM',
      subtitle: 'Transforma tu cuerpo, transforma tu vida. Únete a la comunidad fitness más grande.',
      image: 'assets/img/login-slide-1.jpg'
    },
    {
      title: 'Entrena con los mejores',
      subtitle: 'Accede a entrenamientos personalizados y alcanza tus metas más rápido.',
      image: 'assets/img/login-slide-2.jpg'
    },
    {
      title: 'Sigue tu progreso',
      subtitle: 'Monitorea tus avances y celebra cada logro en tu camino fitness.',
      image: 'assets/img/login-slide-3.jpg'
    },
  ];
  currentSlide = 0;
  private slideInterval?: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.initForm();
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  ngOnInit(): void {
    if (this.authService.isLoginGloballyLocked()) {
      this.startLockTimer();
    }

    if (this.authService.isLoggedIn()) {
      const role = this.authService.getCurrentRole();
      this.redirectUserByRole(role);
      return;
    }

    this.startSlideShow();
    this.idleService.startWatching();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
    }
    this.idleService.stopWatching();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private startSlideShow(): void {
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }, 5000);
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    clearInterval(this.slideInterval);
    this.startSlideShow();
  }

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  private startLockTimer(): void {
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
    }
    
    this.lockTimer = setInterval(() => {
      this.lockRemainingSeconds = this.authService.getLockRemainingSeconds();
      
      if (this.lockRemainingSeconds <= 0) {
        clearInterval(this.lockTimer);
        this.lockTimer = null;
        if (this.errorMessage.includes('bloqueada')) {
          this.errorMessage = '';
        }
      }
    }, 1000);
  }

  isLoginLocked(): boolean {
    return this.authService.isLoginGloballyLocked();
  }

  getRemainingSeconds(): number {
    return this.lockRemainingSeconds;
  }

  private extractBlockTimeFromMessage(message: string): number | null {
    const match = message.match(/bloqueada por (\d+) segundos/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  onSubmit() {
    if (this.isLoginLocked()) {
      const seconds = this.getRemainingSeconds();
      this.errorMessage = `⏳ Cuenta bloqueada. Espera ${seconds} segundos.`;
      this.loading = false;
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        this.loading = false;

        const message = response?.message || '';

        if (message.includes('no se encuentra registrado')) {
          this.errorMessage = message;
          return;
        }

        if (message.includes('bloqueada por')) {
          this.authService.setGlobalLock();
          this.startLockTimer();
          this.errorMessage = message;
          return;
        }

        if (message.includes('incorrectas') || message.includes('quedan')) {
          this.errorMessage = message;

          if (message.includes('quedan 0 intentos')) {
            this.authService.setGlobalLock();
            this.startLockTimer();
          }
          return;
        }

        this.authService.clearGlobalLock();
        if (this.lockTimer) {
          clearInterval(this.lockTimer);
          this.lockTimer = null;
        }
        this.lockRemainingSeconds = 0;

        this.successMessage =
          message || '¡Inicio de sesión exitoso! Redirigiendo...';
        const role = this.authService.getCurrentRole();

        setTimeout(() => {
          this.redirectUserByRole(role);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 401 || error.status === 400) {
          const message = error.error?.message || 'Credenciales incorrectas.';

          if (message.includes('bloqueada por')) {
            this.authService.setGlobalLock();
            this.startLockTimer();
          }

          this.errorMessage = message;
        } else if (error.status === 0) {
          this.errorMessage =
            'No se puede conectar al servidor. Verifica tu conexión.';
        } else {
          this.errorMessage =
            error.message || 'Error inesperado. Intenta nuevamente.';
        }
      },
    });
  }

  private redirectUserByRole(role: RolUsuario | null): void {
    if (!role) {
      this.router.navigate(['/auth/login']);
      return;
    }

    switch (role) {
      case RolUsuario.ADMIN:
        this.router.navigate(['/dashboard-admin']);
        break;
      case RolUsuario.ENTRENADOR:
        this.router.navigate(['/dashboard-entrenador']);
        break;
      case RolUsuario.RECEPCIONISTA:
        this.router.navigate(['/dashboard-recepcionista']);
        break;
      case RolUsuario.USER:
        this.router.navigate(['/user']);
        break;
      default:
        this.router.navigate(['/auth/login']);
        break;
    }
  }

  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }
}