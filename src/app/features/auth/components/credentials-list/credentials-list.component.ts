import { Component, OnInit } from '@angular/core';
import { RespuestaPaginadaCredenciales, Credencial } from '../../models/auth/auth.model';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';


@Component({
  selector: 'app-credentials-list',
  templateUrl: './credentials-list.component.html',
  styleUrls: ['./credentials-list.component.scss']
})
export class CredentialsListComponent implements OnInit {
  credenciales: Credencial[] = [];
  cargando: boolean = false;
  errorMensaje: string = '';

  numeroPagina: number = 0;
  tamanioPagina: number = 5;
  totalElementos: number = 0;
  totalPaginas: number = 0;
  esUltimaPagina: boolean = false;

  mostrarFormulario: boolean = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.cargarCredenciales();
  }

  cargarCredenciales(pagina: number = 0): void {
    this.cargando = true;
    this.errorMensaje = '';

    this.authService.listarCredenciales(pagina, this.tamanioPagina).subscribe({
      next: (res: RespuestaPaginadaCredenciales) => {
        this.credenciales = res.contenido;
        this.numeroPagina = res.numeroPagina;
        this.tamanioPagina = res.tamanioPagina;
        this.totalElementos = res.totalElementos;
        this.totalPaginas = res.totalPaginas;
        this.esUltimaPagina = res.ultima;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener credenciales:', err);
        this.errorMensaje = 'No se pudo cargar el listado de credenciales.';
        this.cargando = false;
      }
    });
  }

  toggleEstado(item: Credencial): void {
    const nuevoEstado = !item.estado;

    this.authService.cambiarEstado(item.id, nuevoEstado).subscribe({
      next: (res) => {
        item.estado = nuevoEstado;
      },
      error: (err) => {
        console.error('Error al cambiar el estado:', err);
        this.errorMensaje = 'No se pudo cambiar el estado del usuario.';
      }
    });
  }

  paginaSiguiente(): void {
    if (!this.esUltimaPagina) {
      this.cargarCredenciales(this.numeroPagina + 1);
    }
  }

  paginaAnterior(): void {
    if (this.numeroPagina > 0) {
      this.cargarCredenciales(this.numeroPagina - 1);
    }
  }

  irAPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas) {
      this.cargarCredenciales(pagina);
    }
  }

  abrirFormulario(): void {
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }
}