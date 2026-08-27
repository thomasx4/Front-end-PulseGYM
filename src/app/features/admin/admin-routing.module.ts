import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    pathMatch: 'full'
  },
  {
    path: 'users',
    loadChildren: () =>
      import('../users/users.module').then((m) => m.UsersModule)
  },
  {
    path: 'memberships',
    loadChildren: () =>
      import('../membership/membership.module').then((m) => m.MembershipModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }