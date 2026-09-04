import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsRoutingModule } from './payments-routing.module';
import { PaymentListComponent } from '../components/payment-list/payment-list.component';

@NgModule({
  declarations: [
    PaymentListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PaymentsRoutingModule
  ]
})
export class PaymentsModule { }