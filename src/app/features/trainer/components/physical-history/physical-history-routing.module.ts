import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PhysicalHistoryListComponent } from './physical-history-list/physical-history-list.component';
import { PhysicalHistoryFormComponent } from './physical-history-form/physical-history-form.component';
import { PhysicalHistoryDetailComponent } from './physical-history-detail/physical-history-detail.component';

const routes: Routes = [
  { path: '', component: PhysicalHistoryListComponent },
  { path: 'new', component: PhysicalHistoryFormComponent },
  { path: 'edit/:id', component: PhysicalHistoryFormComponent },
  { path: 'detail/:id', component: PhysicalHistoryDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PhysicalHistoryRoutingModule { }