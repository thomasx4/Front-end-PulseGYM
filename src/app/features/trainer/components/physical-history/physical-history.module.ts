// Front-end-PulseGYM/src/app/features/trainer/components/physical-history/physical-history.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PhysicalHistoryRoutingModule } from './physical-history-routing.module';
import { PhysicalHistoryListComponent } from './physical-history-list/physical-history-list.component';
import { PhysicalHistoryFormComponent } from './physical-history-form/physical-history-form.component';
import { PhysicalHistoryDetailComponent } from './physical-history-detail/physical-history-detail.component';

// 1. IMPORTAR EL SHARED MODULE
import { SharedModule } from '../../../../shared/shared.module';

@NgModule({
  declarations: [
    PhysicalHistoryListComponent,
    PhysicalHistoryFormComponent,
    PhysicalHistoryDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PhysicalHistoryRoutingModule,
    SharedModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PhysicalHistoryModule { }