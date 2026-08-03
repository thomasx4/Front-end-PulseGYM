import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';    
import { RegisterCredentialsComponent } from './features/auth/components/register-credentials/register-credentials.component';
import { CredentialsListComponent } from './features/auth/components/credentials-list/credentials-list.component';

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
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }