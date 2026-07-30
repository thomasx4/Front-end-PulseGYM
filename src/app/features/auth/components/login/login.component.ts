import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RolUsuario } from '../../models/auth/auth.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,                     
  imports: [ReactiveFormsModule, CommonModule ],  
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  hidePassword = true;
  loading = false;
  errorMessage = '';
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
  ) {}

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getCurrentRole();
      this.redirectUserByRole(role);
      return;
    }

    this.initForm();
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

    this.authService.login(this.loginForm.value).subscribe({
      next: (user) => {
        this.loading = false;
        
        const role = this.authService.getCurrentRole();

        this.redirectUserByRole(role);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message;
      }
    });
  }

  private redirectUserByRole(role: RolUsuario | null): void {
    if (!role) {
      this.router.navigate(['/home']);
      return;
    }

    switch (role) {
      case RolUsuario.ADMIN:
        this.router.navigate(['/admin']);
        break;
      case RolUsuario.ENTRENADOR:
        this.router.navigate(['/trainer']);
        break;
      case RolUsuario.RECEPCIONISTA:
        this.router.navigate(['/reception']);
        break;
      default:
        this.router.navigate(['/home']); 
        break;
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}