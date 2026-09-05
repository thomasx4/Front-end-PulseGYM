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
import { RutinasComponent } from './components/rutinas/rutinas.component';
import { CrearRutinaIaComponent } from './components/rutinas/crear-rutina-ia/crear-rutina-ia.component';
import { DetalleRutinaComponent } from './components/rutinas/detalle-rutina/detalle-rutina.component';
import { ExportarRutinaComponent } from './components/rutinas/exportar-rutina/exportar-rutina.component';
import { RutinasService } from '../../core/services/rutinas.service';
import { EditarRutinaComponent } from './components/rutinas/editar-rutina/editar-rutina.component';

@NgModule({
  declarations: [
    DashboardComponent,
    ProfileComponent,
    HistorialFisicoComponent,
    MembresiasComponent,
    RutinasComponent,
    CrearRutinaIaComponent,
    DetalleRutinaComponent,
    ExportarRutinaComponent,
    EditarRutinaComponent
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