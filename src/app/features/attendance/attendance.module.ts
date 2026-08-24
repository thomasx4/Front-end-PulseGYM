import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AttendanceRoutingModule } from './attendance-routing.module';
import { AttendanceListComponent } from './components/attendance-list/attendance-list.component';
import { AttendanceHistoryComponent } from './components/attendance-history/attendance-history.component';


@NgModule({
  declarations: [
    AttendanceListComponent,
    AttendanceHistoryComponent,
  ],
  imports: [
    CommonModule,
    AttendanceRoutingModule
  ]
})
export class AttendanceModule { }
