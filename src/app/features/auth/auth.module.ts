import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './components/login/login.component';
import { RegisterCredentialsComponent } from './components/register-credentials/register-credentials.component';
import { CredentialsListComponent } from './components/credentials-list/credentials-list.component';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterCredentialsComponent,
    CredentialsListComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule
  ]
})
export class AuthModule { }