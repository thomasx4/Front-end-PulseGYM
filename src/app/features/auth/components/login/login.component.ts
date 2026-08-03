import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
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
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        this.loading = false;
        
        if (response && response.message) {
          this.successMessage = response.message || '¡Inicio de sesión exitoso! Redirigiendo...';
          const role = response.role || this.authService.getCurrentRole();

          setTimeout(() => {
            this.redirectUserByRole(role);
          }, 1500);
        } else {
          this.errorMessage = 'Respuesta inesperada del servidor. Inténtalo de nuevo.';
        }
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401 || error.status === 400) {
          this.errorMessage = error.error?.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
        } else {
          this.errorMessage = error.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
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
        this.router.navigate(['']);
        break;
      case RolUsuario.RECEPCIONISTA:
        this.router.navigate(['']);
        break;
      default:
        this.router.navigate(['/auth/login']); 
        break;
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}