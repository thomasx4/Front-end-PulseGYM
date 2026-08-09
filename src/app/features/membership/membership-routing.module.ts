import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssignMembershipComponent } from './components/assign-membership/assign-membership.component';

const routes: Routes = [
  {
    path: '',
    component: AssignMembershipComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MembershipRoutingModule { }