import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserProfileListComponent } from './components/user-profile-list/user-profile-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
const routes: Routes = [
  {
    path: '',
    component: UserProfileListComponent
  },
  {
    path: 'new',
    component: UserFormComponent
  },
  {
    path: 'detail/:id',
    component: UserDetailComponent
  },
  {
    path: 'edit/:id',
    component: UserFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }