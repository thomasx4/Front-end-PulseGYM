import { Component, Output, EventEmitter } from '@angular/core';

export interface FiltrosCredenciales {
  username?: string;
  rol?: string;
  activo?: boolean;
  direccion?: string;
}

@Component({
  selector: 'app-filter-credentials',
  templateUrl: './filter-credentials.component.html',
  styleUrls: ['./filter-credentials.component.scss']
})
export class FilterCredentialsComponent {
  abierto = false;
  usernameBusqueda = '';
  rolSeleccionado = '';
  estadoSeleccionado = '';
  direccionSeleccionado: string = 'desc';
  roles = ['administrador', 'entrenador', 'recepcionista', 'socio'];

  @Output() aplicar = new EventEmitter<FiltrosCredenciales>();

  toggle(): void {
    this.abierto = !this.abierto;
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.usernameBusqueda = value;
    this.dispararFiltros();
  }

  onAplicar(): void {
    this.dispararFiltros();
    this.abierto = false;
  }

  private dispararFiltros(): void {
    const filtros: FiltrosCredenciales = {};

    if (this.usernameBusqueda.trim()) {
      filtros.username = this.usernameBusqueda.trim();
    }
    if (this.rolSeleccionado) {
      filtros.rol = this.rolSeleccionado;
    }
    if (this.estadoSeleccionado) {
      filtros.activo = this.estadoSeleccionado === 'activo';
    }
    filtros.direccion = this.direccionSeleccionado;

    this.aplicar.emit(filtros);
  }

  onLimpiar(): void {
    this.usernameBusqueda = '';
    this.rolSeleccionado = '';
    this.estadoSeleccionado = '';
    this.direccionSeleccionado = 'desc';
    this.aplicar.emit({});
    this.abierto = false;
  }
}