/**
 * Tarjeta de estadistica reutilizable para el dashboard de usuario
 */
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-stat-card',
  templateUrl: './user-stat-card.component.html',
  styleUrls: ['./user-stat-card.component.scss']
})
export class UserStatCardComponent {
  @Input() title: string = '';
  @Input() value: string = '';
  @Input() subtitle: string = '';
  @Input() extra: string = '';
  @Input() icon: string = '';
  @Input() progress: number = 0;
  @Input() progressSegments: number[] = [];
}