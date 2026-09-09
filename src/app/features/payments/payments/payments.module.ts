import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentsRoutingModule } from './payments-routing.module';
import { PaymentListComponent } from '../components/payment-list/payment-list.component';
import { PaymentFormComponent } from '../components/payment-form/payment-form.component';
import { PaymentReportsComponent } from '../components/payment-reports/payment-reports.component';

@NgModule({
  declarations: [
    PaymentListComponent,
    PaymentFormComponent,
    PaymentReportsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaymentsRoutingModule
  ]
})
export class PaymentsModule { }