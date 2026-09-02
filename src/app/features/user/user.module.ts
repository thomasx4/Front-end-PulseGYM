import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UserRoutingModule } from './user-routing.module';
import { FormsModule } from '@angular/forms';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SharedModule } from '../../shared/shared.module';
import { HistorialFisicoComponent } from './components/historial-fisico/historial-fisico.component';
import { MembresiasComponent } from './components/membresias/membresias.component';

@NgModule({
  declarations: [
    DashboardComponent,
    ProfileComponent,
    HistorialFisicoComponent,
    MembresiasComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    UserRoutingModule,
    SharedModule
  ]
})
export class UserModule { }