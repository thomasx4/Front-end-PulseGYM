import { Component, OnInit } from '@angular/core';
import { CredencialesListado, MessageGlobalDTO } from '../../models/auth/auth.model';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';


@Component({
  selector: 'app-credentials-list',
  templateUrl: './credentials-list.component.html',
  styleUrl: './credentials-list.component.scss'
})
export class CredentialsListComponent implements OnInit {
  credenciales: CredencialesListado[] = [];
  cargando = true;
  errorMensaje = '';
  mostrarFormulario = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.cargarCredenciales();
  }

  cargarCredenciales(): void {
    this.cargando = true;
    this.errorMensaje = '';

    this.authService.listarCredenciales().subscribe({
      next: (respuesta) => {
        this.credenciales = respuesta;
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMensaje = 'No se pudo cargar la lista de usuarios.';
        this.cargando = false;
      }
    });
  }

  get totalActivos(): number {
    return this.credenciales.filter(u => u.estado).length;
  }

  CredencialesEstado(usuario: CredencialesListado): void {
    const nuevoEstado = !usuario.estado;

    this.authService.cambiarEstado(usuario.id, nuevoEstado).subscribe({
      next: () => {
        usuario.estado = nuevoEstado;
      },
      error: (err: HttpErrorResponse) => {
        console.error('No se pudo cambiar el estado', err);
      }
    });
  }

  abrirFormulario(): void {
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.cargarCredenciales();
  }
}
