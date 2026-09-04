import { Component, EventEmitter, Output } from '@angular/core';
import { FiltrosHistorial } from '../../models/attendance.model';

@Component({
  selector: 'app-attendance-history-filter',
  templateUrl: './attendance-history-filter.component.html',
  styleUrls: ['./attendance-history-filter.component.scss']
})
export class AttendanceHistoryFilterComponent {

  @Output() filterChange = new EventEmitter<FiltrosHistorial>();

  nombreUsuario: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';
  tipoAcceso: string = '';
  resultado: string = '';

  aplicarFiltros(): void {
    const filtros: FiltrosHistorial = {};

    if (this.nombreUsuario && this.nombreUsuario.trim()) {
      filtros.nombreUsuario = this.nombreUsuario.trim();
    }

    if (this.fechaDesde && this.fechaDesde.trim() !== '') {
      filtros.fechaDesde = this.fechaDesde.trim();
    }

    if (this.fechaHasta && this.fechaHasta.trim() !== '') {
      filtros.fechaHasta = this.fechaHasta.trim();
    }

    if (this.tipoAcceso && this.tipoAcceso.trim() !== '') {
      filtros.tipoAcceso = this.tipoAcceso.trim();
    }

    if (this.resultado && this.resultado.trim() !== '') {
      filtros.resultado = this.resultado.trim();
    }

    this.filterChange.emit(filtros);
  }

  limpiarFiltros(): void {
    this.nombreUsuario = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.tipoAcceso = '';
    this.resultado = '';

    this.filterChange.emit({});
  }
}