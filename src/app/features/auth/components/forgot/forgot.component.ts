import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.prod';

type Step = 'username' | 'password' | 'success';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent {
  currentStep: Step = 'username';
  
  usernameForm: FormGroup;
  resetForm: FormGroup;

  submitted = false;
  successMessage = '';
  errorMessage = '';

  private currentUsername: string = '';
  private apiUrl = `${environment.apiUrl}/pg-ms-auth/auth`;

  slides = [
    {
      title: 'PULSE GYM',
      subtitle: 'Precision tracking for the elite athlete. Experience fitness curated through data and design.'
    },
    {
      title: 'RECUPERA TU ACCESO',
      subtitle: 'Sigue los pasos para restablecer tu contraseña de forma segura.'
    },
    {
      title: 'DISEÑO ÉLITE',
      subtitle: 'Una experiencia diseñada para atletas que buscan lo mejor.'
    }
  ];
  currentSlide = 0;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.usernameForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.resetForm = this.fb.group({
      token: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  get username() { return this.usernameForm.get('username'); }
  get token() { return this.resetForm.get('token'); }
  get newPassword() { return this.resetForm.get('newPassword'); }
  get confirmPassword() { return this.resetForm.get('confirmPassword'); }

  passwordMatchValidator(form: FormGroup) {
    const newPass = form.get('newPassword')?.value;
    const confirmPass = form.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  onSubmitUsername(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      return;
    }

    const username = this.usernameForm.value.username;
    this.currentUsername = username;

    console.log('Enviando a URL:', `${this.apiUrl}/forgot-password`);
    console.log('Payload:', { username });

    this.http.post(`${this.apiUrl}/forgot-password`, { username }).subscribe({
      next: (response: any) => {
        console.log('Token enviado correctamente:', response);
        this.currentStep = 'password';
        this.submitted = false;
        this.resetForm.reset();
      },
      error: (error) => {
        console.error('Error al enviar el token:', error);
        if (error.status === 530 || (error.error && error.error.includes('mail'))) {
          this.errorMessage = 'El servidor de correo no está disponible en este momento. Por favor, inténtalo más tarde o contacta a soporte.';
        } else {
          this.errorMessage = error.error?.message || 'El usuario no existe o hubo un error en el servidor.';
        }
      }
    });
  }

  onSubmitReset(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const payload = {
      token: this.resetForm.value.token,
      username: this.currentUsername,
      newPassword: this.resetForm.value.newPassword,
      confirmPassword: this.resetForm.value.confirmPassword
    };

    console.log('Enviando todo al endpoint final:', `${this.apiUrl}/reset-password`);
    console.log('Payload unificado:', payload);

    this.http.post(`${this.apiUrl}/reset-password`, payload).subscribe({
      next: (response: any) => {
        console.log('Contraseña cambiada con éxito:', response);
        this.successMessage = '¡Tu contraseña ha sido actualizada correctamente!';
        this.currentStep = 'success';
      },
      error: (error) => {
        console.error('Error al cambiar la contraseña:', error);
        this.errorMessage = error.error?.message || 'El código es incorrecto o hubo un error al cambiar la contraseña.';
      }
    });
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  goToStep(step: Step): void {
    this.currentStep = step;
    this.submitted = false;
    this.errorMessage = '';
  }

  resendToken(): void {
    this.submitted = false;
    this.resetForm.reset();
    this.errorMessage = '';
    console.log('Reenviando token...');
    this.onSubmitUsername();
  }
}