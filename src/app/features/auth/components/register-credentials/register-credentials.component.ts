import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequestDTO, RolUsuario } from '../../models/auth/auth.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register-credentials',
  templateUrl: './register-credentials.component.html',
  styleUrls: ['./register-credentials.component.scss']
})
export class RegisterCredentialsComponent {
  form: FormGroup;
  enviando = false;
  errorMsg = '';
  exitoMsg = '';

  roles: RolUsuario[] = [
  RolUsuario.ADMIN,
  RolUsuario.ENTRENADOR,
  RolUsuario.RECEPCIONISTA,
  RolUsuario.USER
];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rol: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // fuerza a mostrar errores si intenta enviar vacío
      return;
    }

    const payload: RegisterRequestDTO = {
      ...this.form.value,
      estado: true
    };

    this.enviando = true;
    this.errorMsg = '';
    this.exitoMsg = '';

    this.authService.registerCredentials(payload).subscribe({
      next: () => {
        this.enviando = false;
        this.exitoMsg = '¡Usuario registrado correctamente!';
        this.form.reset();

        setTimeout(() => {
          this.exitoMsg = '';
        }, 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando = false;
        this.errorMsg = 'No se pudo registrar el usuario. Verifica los datos.';
      }
    });
  }
}