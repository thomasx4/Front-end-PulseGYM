import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuppliersRoutingModule } from './suppliers-routing.module';
import { SupplierListComponent } from './components/supplier-list/supplier-list.component';
import { RegisterSupplierComponent } from './components/register-supplier/register-supplier.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    SupplierListComponent,
    RegisterSupplierComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SuppliersRoutingModule
  ]
})
export class SuppliersModule { }
