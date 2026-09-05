import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentsRoutingModule } from './payments-routing.module';
import { PaymentListComponent } from '../components/payment-list/payment-list.component';
import { PaymentFormComponent } from '../components/payment-form/payment-form.component';

@NgModule({
  declarations: [
    PaymentListComponent,
    PaymentFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaymentsRoutingModule
  ]
})
export class PaymentsModule { }