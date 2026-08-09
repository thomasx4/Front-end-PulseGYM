import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
import { RegisterCredentialsComponent } from './features/auth/components/register-credentials/register-credentials.component';
import { CredentialsListComponent } from './features/auth/components/credentials-list/credentials-list.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { ForgotComponent } from '../app/features/auth/components/forgot/forgot.component';
import { HomeComponent } from './features/user/components/home/home.component';
import { AuthGuard } from '../app/core/guards/auth.guard';

const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () =>
            import('./features/auth/auth.module').then((m) => m.AuthModule),
    },
    {
        path: 'dashboard-admin',
        component: MainLayoutComponent,
        canActivate: [AuthGuard],
        data: { expectedRole: 'administrador' },
        children: [
            {
                path: '',
                loadChildren: () =>
                    import('./features/admin/admin.module').then((m) => m.AdminModule),
            },
            {
                path: 'users',
                component: CredentialsListComponent,
            },
        ],
    },
    {
        path: 'user',
        canActivate: [AuthGuard],
        loadChildren: () =>
            import('./features/user/user.module').then((m) => m.UserModule),
    },
    {
        path: 'dashboard-admin/memberships',
        component: MainLayoutComponent,
        canActivate: [AuthGuard],
        data: { expectedRole: 'administrador' },
        children: [
            {
                path: '',
                loadChildren: () =>
                    import('./features/membership/membership.module').then(
                        (m) => m.MembershipModule,
                    ),
            },
        ],
    },

    { path: 'auth/login', component: LoginComponent },
    { path: 'forgot-password', component: ForgotComponent },
    { path: 'user', component: HomeComponent },
    { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }