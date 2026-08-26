import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UsersRoutingModule } from './users-routing.module';
import { UserProfileListComponent } from './components/user-profile-list/user-profile-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { CertificatesListComponent } from './components/certificates/certificates-list/certificates-list.component';
import { CertificatesFormComponent } from './components/certificates/certificates-form/certificates-form.component';
import { CertificatesDetailComponent } from './components/certificates/certificates-detail/certificates-detail.component';
import { AuthModule } from '../auth/auth.module';

@NgModule({
  declarations: [
    UserProfileListComponent,
    UserFormComponent,
    UserDetailComponent,
    CertificatesListComponent,
    CertificatesFormComponent,
    CertificatesDetailComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AuthModule
  ]
})
export class UsersModule { }