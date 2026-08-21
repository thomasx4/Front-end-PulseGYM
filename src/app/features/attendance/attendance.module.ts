import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AttendanceRoutingModule } from './attendance-routing.module';
import { AttendanceListComponent } from './components/attendance-list/attendance-list.component';
import { AttendanceSummaryComponent } from './components/attendance-summary/attendance-summary.component';


@NgModule({
  declarations: [
    AttendanceListComponent,
    AttendanceSummaryComponent
  ],
  imports: [
    CommonModule,
    AttendanceRoutingModule
  ]
})
export class AttendanceModule { }
