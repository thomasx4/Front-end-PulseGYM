import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ForgotComponent } from '../app/features/auth/components/forgot/forgot.component'

const routes: Routes = [
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/forgot-password', component: ForgotComponent },
    { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/auth/login' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }