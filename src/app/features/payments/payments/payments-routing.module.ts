import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentListComponent } from '../components/payment-list/payment-list.component';
import { PaymentFormComponent } from '../components/payment-form/payment-form.component';
import { PaymentReportsComponent } from '../components/payment-reports/payment-reports.component';

const routes: Routes = [
  {
    path: '',
    component: PaymentListComponent
  },
  {
    path: 'new',
    component: PaymentFormComponent
  },
  {
    path: 'reports',
    component: PaymentReportsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentsRoutingModule { }