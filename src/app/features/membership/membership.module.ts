import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { MembershipRoutingModule } from './membership-routing.module';
import { AssignMembershipComponent } from './components/assign-membership/assign-membership.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    AssignMembershipComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MembershipRoutingModule,
    SharedModule
  ]
})
export class MembershipModule { }