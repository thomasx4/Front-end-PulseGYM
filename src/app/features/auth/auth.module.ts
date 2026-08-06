import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './components/login/login.component';
import { RegisterCredentialsComponent } from './components/register-credentials/register-credentials.component';
import { CredentialsListComponent } from './components/credentials-list/credentials-list.component';
import { ForgotComponent } from './components/forgot/forgot.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterCredentialsComponent,
    CredentialsListComponent,
    ForgotComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AuthRoutingModule,
    SharedModule
  ],
  exports: [
    LoginComponent,
    ForgotComponent
  ]
})
export class AuthModule { }