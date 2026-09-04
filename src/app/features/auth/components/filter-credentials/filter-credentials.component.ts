import { Component, Output, EventEmitter } from '@angular/core';

export interface FiltrosCredenciales {
  username?: string;
  email?: string;
  busqueda?: string;
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
  busquedaTexto = '';
  rolSeleccionado = '';
  estadoSeleccionado = '';
  direccionSeleccionado: string = 'desc';
  roles = ['administrador', 'entrenador', 'recepcionista', 'socio'];

  @Output() aplicar = new EventEmitter<FiltrosCredenciales>();

  toggle(): void {
    this.abierto = !this.abierto;
  }

  onAplicar(): void {
    this.dispararFiltros();
    this.abierto = false;
  }

  private dispararFiltros(): void {
    const texto = this.busquedaTexto.trim();
    const esEmail = texto.includes('@');

    const filtros: FiltrosCredenciales = {
      busqueda: texto ? texto : undefined,
      username: !esEmail && texto ? texto : undefined,
      email: esEmail && texto ? texto : undefined,
      rol: this.rolSeleccionado || undefined,
      activo: this.estadoSeleccionado === '' ? undefined : this.estadoSeleccionado === 'activo',
      direccion: this.direccionSeleccionado
    };

    this.aplicar.emit(filtros);
  }

  onLimpiar(): void {
    this.busquedaTexto = '';
    this.rolSeleccionado = '';
    this.estadoSeleccionado = '';
    this.direccionSeleccionado = 'desc';
    this.aplicar.emit({});
    this.abierto = false;
  }
}