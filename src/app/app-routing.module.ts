import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';    
import { RegisterCredentialsComponent } from './features/auth/components/register-credentials/register-credentials.component';
import { CredentialsListComponent } from './features/auth/components/credentials-list/credentials-list.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { ForgotComponent } from '../app/features/auth/components/forgot/forgot.component'

const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
    },
    {
        path: 'dashboard-admin',
        component: MainLayoutComponent,
        children: [
            {
                path: 'users',
                component: CredentialsListComponent
            }
        ]
    },
    {
        path: '',
        redirectTo: '/auth',
        pathMatch: 'full'
    },

        { path: 'auth/login', component: LoginComponent },
    { path: 'forgot-password', component: ForgotComponent },
    { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
]

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }