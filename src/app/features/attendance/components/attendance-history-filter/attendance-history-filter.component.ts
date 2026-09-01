import { Component, EventEmitter, Output } from '@angular/core';
import { FiltrosHistorial } from '../../models/attendance.model';

@Component({
  selector: 'app-attendance-history-filter',
  templateUrl: './attendance-history-filter.component.html',
  styleUrl: './attendance-history-filter.component.scss'
})
export class AttendanceHistoryFilterComponent {

  @Output() filterChange = new EventEmitter<FiltrosHistorial>();

  aplicarFiltros(): void {
    const misFiltros: FiltrosHistorial = { };
    this.filterChange.emit(misFiltros);
  }
}
