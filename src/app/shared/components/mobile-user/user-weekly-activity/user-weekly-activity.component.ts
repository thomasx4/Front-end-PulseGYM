/**
 * Grafico de barras semanal para el dashboard de usuario
 */
import { Component, Input } from '@angular/core';

interface DayActivity {
  day: string;
  value: number;
}

@Component({
  selector: 'app-user-weekly-activity',
  templateUrl: './user-weekly-activity.component.html',
  styleUrls: ['./user-weekly-activity.component.scss']
})
export class UserWeeklyActivityComponent {
  @Input() title: string = '';
  @Input() data: DayActivity[] = [];
}