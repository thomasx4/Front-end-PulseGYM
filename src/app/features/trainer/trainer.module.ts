import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { TrainerRoutingModule } from './trainer-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SharedModule } from '../../shared/shared.module';
import { RutinasComponent } from './components/rutinas/rutinas.component';
import { RutinasSocioComponent } from './components/rutinas/rutinas-socio/rutinas-socio.component';
import { DetalleSocioComponent } from './components/rutinas/detalle-socio/detalle-socio.component';
import { EditarSocioComponent } from './components/rutinas/editar-socio/editar-socio.component';
import { EjerciciosComponent } from './components/ejercicios/ejercicios.component';
import { PerfilMedicoComponent } from './components/perfil-medico/perfil-medico.component';
import { DetalleMedicoComponent } from './components/perfil-medico/detalle-medico/detalle-medico.component';

@NgModule({
  declarations: [
    DashboardComponent,
    RutinasComponent,
    RutinasSocioComponent,
    DetalleSocioComponent,
    EditarSocioComponent,
    EjerciciosComponent,
    PerfilMedicoComponent,
    DetalleMedicoComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    TrainerRoutingModule,
    SharedModule
  ]
})
export class TrainerModule { }