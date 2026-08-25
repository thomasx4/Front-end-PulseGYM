import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequestDTO, RolUsuario } from '../../models/auth/auth.model';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-credentials',
  templateUrl: './register-credentials.component.html',
  styleUrls: ['./register-credentials.component.scss']
})
export class RegisterCredentialsComponent {
  form: FormGroup;
  enviando = false;

  roles: RolUsuario[] = [RolUsuario.ADMIN, RolUsuario.ENTRENADOR, RolUsuario.RECEPCIONISTA, RolUsuario.USER];

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordValidator
      ]],
      rol: ['', Validators.required]
    });
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const passwordValid = hasUpperCase && hasNumeric && hasSpecial;
    return !passwordValid ? { passwordStrength: true } : null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.authService.registerCredentials({ ...this.form.value, estado: true }).subscribe({
      next: (response: any) => {
        this.enviando = false;

        if (response && response.message && response.message.includes('en uso')) {
          Swal.fire({
            title: 'Atención',
            text: response.message,
            icon: 'warning',
            confirmButtonColor: '#0E3B72'
          });
          return;
        }

        Swal.fire({
          title: '¡Éxito!',
          text: 'El usuario se ha registrado correctamente.',
          icon: 'success',
          confirmButtonColor: '#0E3B72'
        });
        this.form.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando = false;

        let errorMessage = 'No se pudo registrar el usuario. Verifica los datos.';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        }

        Swal.fire({
          title: 'Atención',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#0E3B72'
        });
      }
    });
  }
}