import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EquipmentListComponent } from './components/equipment-list/equipment-list.component';
import { FaultReportsComponent } from './components/fault-reports/fault-reports.component';

const routes: Routes = [
  {
    path: '',
    component: EquipmentListComponent
  },
  {
    path: 'faults',
    component: FaultReportsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EquipmentsRoutingModule { }
