import { Component, EventEmitter, Output } from '@angular/core';
import { FiltrosAsistencia } from '../../models/attendance-filter.model';

@Component({
  selector: 'app-attendance-filter',
  templateUrl: './attendance-filter.component.html',
  styleUrl: './attendance-filter.component.scss'
})
export class AttendanceFilterComponent {
  abierto = false

  textoBusqueda = '';
  tipoAccesoSeleccionado = '';
  estadoSeleccionado = '';
  ordenSeleccionado = 'desc';

  @Output() aplicar = new EventEmitter<FiltrosAsistencia>();

  toggle(): void {
    this.abierto = !this.abierto;
  }

  onSearchInput(event: Event): void {
    this.textoBusqueda = (event.target as HTMLInputElement).value;
    this.dispararFiltros();
  }

  onAplicar(): void {
    this.dispararFiltros();
    this.abierto = false;
  }

  private dispararFiltros(): void {
    const filtros: FiltrosAsistencia = {};

    if (this.textoBusqueda.trim()) {
      filtros.textoBusqueda = this.textoBusqueda.trim();
    }
    if (this.tipoAccesoSeleccionado) {
      filtros.tipoAcceso = this.tipoAccesoSeleccionado;
    }
    if (this.estadoSeleccionado) {
      filtros.estadoAcceso = this.estadoSeleccionado;
    }
    filtros.ordenFecha = this.ordenSeleccionado;

    this.aplicar.emit(filtros);
  }

  onLimpiar(): void {
    this.textoBusqueda = '';
    this.tipoAccesoSeleccionado = '';
    this.estadoSeleccionado = '';
    this.ordenSeleccionado = 'desc';
    this.aplicar.emit({ ordenFecha: 'desc' });
    this.abierto = false;
  }
}
