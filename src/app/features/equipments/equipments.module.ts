import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EquipmentsRoutingModule } from './equipments-routing.module';
import { EquipmentListComponent } from './components/equipment-list/equipment-list.component';
import { RegisterEquipmentComponent } from './components/register-equipment/register-equipment.component';
import { EquipmentDetailComponent } from './components/equipment-detail/equipment-detail.component';


@NgModule({
  declarations: [
    EquipmentListComponent,
    RegisterEquipmentComponent,
    EquipmentDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EquipmentsRoutingModule
  ]
})
export class EquipmentsModule { }
