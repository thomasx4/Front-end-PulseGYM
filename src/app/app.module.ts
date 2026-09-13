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

export function initializeTheme(themeInitializer: ThemeInitializerService) {
  return () => themeInitializer.initializeTheme();
}

@NgModule({
  declarations: [
    AppComponent,
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