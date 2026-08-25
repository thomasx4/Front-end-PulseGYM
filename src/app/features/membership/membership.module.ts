import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms'; 

import { MembershipRoutingModule } from './membership-routing.module';
import { AssignMembershipComponent } from './components/assign-membership/assign-membership.component';
import { SharedModule } from '../../shared/shared.module';
import { MembershipListComponent } from './components/membership-list/membership-list.component';
import { MembershipFormComponent } from './components/membership-form/membership-form.component';
import { MembershipDetailComponent } from './components/membership-detail/membership-detail.component';

@NgModule({
  declarations: [
    AssignMembershipComponent,
    MembershipListComponent,
    MembershipFormComponent,
    MembershipDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MembershipRoutingModule,
    SharedModule,
    FormsModule
  ]
})
export class MembershipModule { }