import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-attendance-goal-card',
  templateUrl: './attendance-goal-card.component.html',
  styleUrl: './attendance-goal-card.component.scss'
})
export class AttendanceGoalCardComponent implements OnInit {

  @Input() totalAforoActual: number = 0;
  @Input() metaAsistenciaDiaria: number = 0;

  porcentajeCompletado: number = 0;
  personasRestantes: number = 0;

  constructor() { }

  ngOnInit(): void {
    this.calcularMetricas();
  }

  ngOnChanges(): void {
    this.calcularMetricas();
  }

  calcularMetricas(): void {
    if (this.metaAsistenciaDiaria > 0) {
      const porcentajeRaw = (this.totalAforoActual / this.metaAsistenciaDiaria) * 100;
      this.porcentajeCompletado = Math.min(Math.round(porcentajeRaw), 100);

      this.personasRestantes = Math.max(this.metaAsistenciaDiaria - this.totalAforoActual, 0);
    } else {
      this.porcentajeCompletado = 0;
      this.personasRestantes = 0;
    }
  }
}
