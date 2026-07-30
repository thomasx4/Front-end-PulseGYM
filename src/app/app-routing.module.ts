import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';

import { ForgotComponent } from '../app/features/auth/components/forgot/forgot.component'

const routes: Routes = [
    { path: 'auth/login', component: LoginComponent },
    { path: 'forgot-password', component: ForgotComponent },
    { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }