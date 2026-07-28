import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  currentSlide = 0;

  slides = [
    {
      title: 'PULSE GYM',
      subtitle: 'Seguimiento de precisión para atletas de élite. Experimenta un entrenamiento optimizado mediante datos y diseño.'
    }
  ];

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Login:', this.loginForm.value);
      
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }
}