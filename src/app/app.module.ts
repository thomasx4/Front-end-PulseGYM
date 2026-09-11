import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthModule } from './features/auth/auth.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { RouterModule } from '@angular/router';
import { IdleService } from './core/services/idle.service';
import { AdminModule } from './features/admin/admin.module'; 
import { MembershipModule } from './features/membership/membership.module';
import { AttendanceModule } from './features/attendance/attendance.module';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
import { ThemeInitializerService } from './core/services/theme-initializer.service';
import { PaymentReportsComponent } from './features/payments/components/payment-reports/payment-reports.component';
import { NotificationLayoutComponent } from './features/notifications/notification-layout/notification-layout.component';
import { PreferenciasUsuarioComponent } from './features/notifications/components/preferencias-usuario/preferencias-usuario.component';
import { AdminPlantillasComponent } from './features/notifications/components/admin-plantillas/admin-plantillas.component';
import { AdminDisenosComponent } from './features/notifications/components/admin-disenos/admin-disenos.component';
import { AdminConfiguracionComponent } from './features/notifications/components/admin-configuracion/admin-configuracion.component';
import { AdminEnvioManualComponent } from './features/notifications/components/admin-envio-manual/admin-envio-manual.component';

export function initializeTheme(themeInitializer: ThemeInitializerService) {
  return () => themeInitializer.initializeTheme();
}

@NgModule({
  declarations: [
    AppComponent,
    NotificationLayoutComponent,
    PreferenciasUsuarioComponent,
    AdminPlantillasComponent,
    AdminDisenosComponent,
    AdminConfiguracionComponent,
    AdminEnvioManualComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule,
    SharedModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    AuthModule,
    AdminModule,
    MembershipModule,
    AttendanceModule,
  ],
  providers: [
    IdleService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTheme,
      deps: [ThemeInitializerService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }