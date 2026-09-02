import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { AttendanceRoutingModule } from './attendance-routing.module';
import { AttendanceListComponent } from './components/attendance-list/attendance-list.component';
import { AttendanceHistoryComponent } from './components/attendance-history/attendance-history.component';
import { AttendanceGoalCardComponent } from './components/attendance-goal-card/attendance-goal-card.component';
import { AttendanceFilterComponent } from './components/attendance-filter/attendance-filter.component';
import { AttendanceHistoryFilterComponent } from './components/attendance-history-filter/attendance-history-filter.component';


@NgModule({
  declarations: [
    AttendanceListComponent,
    AttendanceHistoryComponent,
    AttendanceGoalCardComponent,
    AttendanceFilterComponent,
    AttendanceHistoryFilterComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AttendanceRoutingModule,
    FormsModule,
  ]
})
export class AttendanceModule { }
