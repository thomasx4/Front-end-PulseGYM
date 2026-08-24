import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendanceHistoryComponent } from './components/attendance-history/attendance-history.component';
import { AttendanceListComponent } from './components/attendance-list/attendance-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'history', pathMatch: 'full' },
  { path: 'list', component: AttendanceListComponent },
  { path: 'history', component: AttendanceHistoryComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttendanceRoutingModule { }
