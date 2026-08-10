import { Component, Output, EventEmitter } from '@angular/core';

export interface FiltrosCredenciales {
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
  rolSeleccionado = '';
  estadoSeleccionado = '';
  direccionSeleccionado: string = 'desc';
  roles = ['administrador', 'entrenador', 'recepcionista', 'socio'];

  @Output() aplicar = new EventEmitter<{ rol?: string; activo?: boolean; direccion?: string }>();

  toggle(): void {
    this.abierto = !this.abierto;
  }

  onAplicar(): void {
    const filtros: { rol?: string; activo?: boolean; direccion?: string } = {};
    if (this.rolSeleccionado) filtros.rol = this.rolSeleccionado;
    if (this.estadoSeleccionado) filtros.activo = this.estadoSeleccionado === 'activo';
    filtros.direccion = this.direccionSeleccionado;

    this.aplicar.emit(filtros);
    this.abierto = false;
  }

  onLimpiar(): void {
    this.rolSeleccionado = '';
    this.estadoSeleccionado = '';
    this.direccionSeleccionado = '';
    this.aplicar.emit({});
    this.abierto = false;
  }
}