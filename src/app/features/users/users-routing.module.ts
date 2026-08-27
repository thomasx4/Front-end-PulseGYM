import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserProfileListComponent } from './components/user-profile-list/user-profile-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { CredentialsListComponent } from '../auth/components/credentials-list/credentials-list.component';

const routes: Routes = [
  {
    path: '',
    component: CredentialsListComponent,
    pathMatch: 'full'
  },
  {
    path: 'profiles',
    component: UserProfileListComponent
  },
  {
    path: 'documents',
    loadChildren: () =>
      import('./documents/documents.module').then((m) => m.DocumentsModule)
  },
  {
    path: 'certificates',
    loadChildren: () =>
      import('./certificates/certificates.module').then((m) => m.CertificatesModule)
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
  },
  {
    path: 'physical-history',
    loadChildren: () =>
      import('./physical-history/physical-history.module').then((m) => m.PhysicalHistoryModule)
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }