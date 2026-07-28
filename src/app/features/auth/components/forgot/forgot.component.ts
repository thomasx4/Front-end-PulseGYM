import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

type Step = 'username' | 'token' | 'password' | 'success';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent {
  currentStep: Step = 'username';
  
  usernameForm: FormGroup;
  tokenForm: FormGroup;
  passwordForm: FormGroup;

  submitted = false;
  successMessage = '';

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

  constructor(private fb: FormBuilder) {
    this.usernameForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.tokenForm = this.fb.group({
      token: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  get username() { return this.usernameForm.get('username'); }
  get token() { return this.tokenForm.get('token'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }

  passwordMatchValidator(form: FormGroup) {
    const newPass = form.get('newPassword')?.value;
    const confirmPass = form.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  onSubmitUsername(): void {
    this.submitted = true;
    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      return;
    }

    console.log('Enviando token para usuario:', this.usernameForm.value.username);
    
    this.currentStep = 'token';
    this.submitted = false;
    this.tokenForm.reset();
  }

  onSubmitToken(): void {
    this.submitted = true;
    if (this.tokenForm.invalid) {
      this.tokenForm.markAllAsTouched();
      return;
    }

    console.log('Validando token:', this.tokenForm.value.token);

    this.currentStep = 'password';
    this.submitted = false;
    this.passwordForm.reset();
  }

  onSubmitPassword(): void {
    this.submitted = true;
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const payload = {
      token: this.tokenForm.value.token,
      newPassword: this.passwordForm.value.newPassword,
      confirmPassword: this.passwordForm.value.confirmPassword
    };

    console.log('Payload para backend:', payload);

    this.successMessage = '¡Tu contraseña ha sido actualizada correctamente!';
    this.currentStep = 'success'; 
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  goToStep(step: Step): void {
    this.currentStep = step;
    this.submitted = false;
  }

  resendToken(): void {
    this.submitted = false;
    this.tokenForm.reset();
    console.log('Reenviando token...');
  }
}