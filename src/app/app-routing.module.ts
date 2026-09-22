import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
import { CredentialsListComponent } from './features/auth/components/credentials-list/credentials-list.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { ForgotComponent } from '../app/features/auth/components/forgot/forgot.component';
import { AuthGuard } from '../app/core/guards/auth.guard';
import { PaymentDetailComponent } from './features/payments/components/payment-detail/payment-detail.component';
import { LandingPageComponent } from './features/landing/pages/landing-page/landing-page.component';
import { PoliticasPageComponent } from './features/landing/pages/politicas-page/politicas-page.component';
import { AjustesComponent } from './features/ajustes/ajustes.component';
import { ProfileComponent } from './features/profile/profile.component';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

const routes: Routes = [
    { path: '', component: LandingPageComponent },
    { path: 'politicas', component: PoliticasPageComponent },

    {
        path: 'auth',
        loadChildren: () =>
            import('./features/auth/auth.module').then((m) => m.AuthModule),
    },

    {
        path: 'dashboard-admin',
        component: MainLayoutComponent,
        canActivate: [AuthGuard],
        data: { expectedRoles: ['administrador', 'recepcionista'] },
        children: [
            {
                path: '',
                loadChildren: () =>
                    import('./features/admin/admin.module').then((m) => m.AdminModule),
            },
            {
                path: 'profile',
                component: ProfileComponent
            },
            {
                path: 'users',
                children: [
                    {
                        path: '',
                        component: CredentialsListComponent,
                    },
                    {
                        path: 'profiles',
                        loadChildren: () =>
                            import('./features/users/users.module').then((m) => m.UsersModule),
                    }
                ]
            },
            {
                path: 'headquarters',
                children: [
                    {
                        path: '',
                        loadChildren: () =>
                            import('./features/headquarters/headquarters.module').then((m) => m.HeadquartersModule),
                    }
                ]
            },
            {
                path: 'suppliers',
                children: [
                    {
                        path: '',
                        loadChildren: () =>
                            import('./features/suppliers/suppliers.module').then((m) => m.SuppliersModule),
                    }
                ]
            },
            {
                path: 'equipments',
                children: [
                    {
                        path: '',
                        loadChildren: () =>
                            import('./features/equipments/equipments.module').then((m) => m.EquipmentsModule),
                    }
                ]
            },
            {
                path: 'memberships',
                loadChildren: () =>
                    import('./features/membership/membership.module').then((m) => m.MembershipModule),
            },
            {
                path: 'attendance',
                loadChildren: () =>
                    import('./features/attendance/attendance.module').then((m) => m.AttendanceModule),
            },
            {
                path: 'payments',
                loadChildren: () =>
                    import('./features/payments/payments/payments.module').then((m) => m.PaymentsModule),
            },
            {
                path: 'mancuer-ia',
                loadChildren: () =>
                    import('./features/mancuer-ia/mancuer-ia.module').then((m) => m.MancuerIaModule),
            },
            {
                path: 'notifications',
                loadChildren: () =>
                    import('./features/notifications/notification.routes').then((m) => m.NOTIFICATION_ROUTES),
            },
            {
                path: 'ajustes',
                component: AjustesComponent,
                canDeactivate: [pendingChangesGuard]
            }
        ],
    },

    {
        path: 'user',
        canActivate: [AuthGuard],
        loadChildren: () =>
            import('./features/user/user.module').then((m) => m.UserModule),
    },
    {
        path: 'trainer',
        canActivate: [AuthGuard],
        data: { expectedRole: 'entrenador' },
        loadChildren: () =>
            import('./features/trainer/trainer.module').then((m) => m.TrainerModule),
    },
    { path: 'auth/login', component: LoginComponent },
    { path: 'forgot-password', component: ForgotComponent },
    { path: 'comprobante/:idPago', component: PaymentDetailComponent },

    { path: '**', redirectTo: '' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }