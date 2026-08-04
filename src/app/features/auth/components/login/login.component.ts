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
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  errorMessage = '';
  successMessage = '';
  private subscription?: Subscription;

  private idleService = inject(IdleService);

  private failedAttempts = 0;
  private maxAttempts = 3;
  private lockTime = 30000; 
  private lockEndTime: number | null = null;

  slides = [
    {
      title: 'Bienvenido a PulseGym',
      subtitle: 'Transforma tu cuerpo, transforma tu vida. Únete a la comunidad fitness más grande.'
    },
    {
      title: 'Entrena con los mejores',
      subtitle: 'Accede a entrenamientos personalizados y alcanza tus metas más rápido.'
    },
    {
      title: 'Sigue tu progreso',
      subtitle: 'Monitorea tus avances y celebra cada logro en tu camino fitness.'
    }
  ];
  currentSlide = 0;
  private slideInterval?: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initForm();
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  ngOnInit(): void {
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
    this.idleService.stopWatching();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
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

  isLoginLocked(): boolean {
    if (this.lockEndTime) {
      const remaining = this.lockEndTime - Date.now();
      return remaining > 0;
    }
    return false;
  }

  getRemainingSeconds(): number {
    if (this.lockEndTime) {
      const remaining = this.lockEndTime - Date.now();
      return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }
    return 0;
  }

  onSubmit() {
    if (this.isLoginLocked()) {
      const seconds = this.getRemainingSeconds();
      this.errorMessage = `Demasiados intentos. Espera ${seconds} segundos.`;
      this.loading = false;
      return;
    }

    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        this.loading = false;
        
        if (response && response.message && response.message.includes('no se encuentra registrado')) {
          this.failedAttempts++;
          
          if (this.failedAttempts >= this.maxAttempts) {
            this.lockEndTime = Date.now() + this.lockTime;
            this.errorMessage = `Has excedido los intentos. Bloqueado por ${this.lockTime / 1000} segundos.`;
            this.failedAttempts = 0;
          } else {
            this.errorMessage = `Credenciales incorrectas. Intento ${this.failedAttempts} de ${this.maxAttempts}.`;
          }
          return;
        }

        this.failedAttempts = 0;
        this.lockEndTime = null;
        
        this.successMessage = response.message || '¡Inicio de sesión exitoso! Redirigiendo...';
        const role = response?.user?.role || this.authService.getCurrentRole();

                console.log('Rol obtenido:', role);

        setTimeout(() => {
          this.redirectUserByRole(role);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        this.failedAttempts++;
        
        if (error.status === 401 || error.status === 400) {
          this.errorMessage = error.error?.message || 'Credenciales incorrectas.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor.';
        } else {
          this.errorMessage = error.message || 'Error inesperado.';
        }

        if (this.failedAttempts >= this.maxAttempts) {
          this.lockEndTime = Date.now() + this.lockTime;
          this.errorMessage = `Has excedido los intentos. Bloqueado por ${this.lockTime / 1000} segundos.`;
          this.failedAttempts = 0;
        }
      }
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

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}