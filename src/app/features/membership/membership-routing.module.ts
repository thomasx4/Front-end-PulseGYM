import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssignMembershipComponent } from './components/assign-membership/assign-membership.component';
import { MembershipListComponent } from './components/membership-list/membership-list.component';

const routes: Routes = [
  {
    path: 'assign',
    component: AssignMembershipComponent,
  },
  {
    path: 'list',
    component: MembershipListComponent,
  },
  {
    path: '',
    redirectTo: 'assign',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MembershipRoutingModule {}