import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { RolUsuario } from '../../models/auth/auth.model';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-force-password-change',
    templateUrl: './force-password-change.component.html',
    styleUrls: ['./force-password-change.component.scss']
})
export class ForcePasswordChangeComponent implements OnInit {
    form: FormGroup;
    cargando: boolean = false;
    errorMensaje: string = '';
    mostrarActual: boolean = false;
    mostrarNueva: boolean = false;
    mostrarConfirmacion: boolean = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.form = this.fb.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.]).+$/)
            ]],
            confirmPassword: ['', [Validators.required]]
        }, { validator: this.validarPasswordsCoinciden });
    }

    ngOnInit(): void { }

    validarPasswordsCoinciden(group: FormGroup) {
        const pass = group.get('newPassword')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return pass === confirm ? null : { noCoinciden: true };
    }

    cambiarContrasena(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.cargando = true;
        this.errorMensaje = '';

        const payload = {
            currentPassword: this.form.value.currentPassword,
            newPassword: this.form.value.newPassword,
            confirmPassword: this.form.value.confirmPassword
        };

        this.authService.cambiarContrasenaObligatoria(payload).subscribe({
            next: () => {
                this.cargando = false;
                Swal.fire({
                    icon: 'success',
                    title: '¡Contraseña Actualizada!',
                    text: 'Tu contraseña se ha configurado con éxito. Ya puedes navegar en el sistema.',
                    confirmButtonColor: '#0f1c3f',
                    confirmButtonText: 'Continuar'
                }).then(() => {
                    this.redirigirSegunRol();
                });
            },
            error: (err) => {
                this.cargando = false;
                this.errorMensaje = err?.error?.message || err?.message || 'Error al actualizar la contraseña.';
            }
        });
    }

    private redirigirSegunRol(): void {
        const role = this.authService.getCurrentRole();
        if (role === RolUsuario.ADMIN) {
            this.router.navigate(['/dashboard-admin']);
        } else {
            this.router.navigate(['/user']);
        }
    }

    cerrarSesion(): void {
        this.authService.logout();
    }
}