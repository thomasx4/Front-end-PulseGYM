import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MembershipRoutingModule } from './membership-routing.module';
import { AssignMembershipComponent } from './components/assign-membership/assign-membership.component';


@NgModule({
  declarations: [
    AssignMembershipComponent
  ],
  imports: [
    CommonModule,
    MembershipRoutingModule
  ]
})
export class MembershipModule { }
