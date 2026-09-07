import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UserRoutingModule } from './user-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
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
import { PerfilMedicoComponent } from './components/perfil-medico/perfil-medico.component';
import { PlanNutricionalComponent } from './components/plan-nutricional/plan-nutricional.component';
import { CrearPlanComponent } from './components/plan-nutricional/crear-plan/crear-plan.component';
import { DetallePlanComponent } from './components/plan-nutricional/detalle-plan/detalle-plan.component';
import { EditarPlanComponent } from './components/plan-nutricional/editar-plan/editar-plan.component';
import { ExportarPlanComponent } from './components/plan-nutricional/exportar-plan/exportar-plan.component';

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
    EditarRutinaComponent,
    PerfilMedicoComponent,
    PlanNutricionalComponent,
    CrearPlanComponent,
    DetallePlanComponent,
    EditarPlanComponent,
    ExportarPlanComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    UserRoutingModule,
    SharedModule
  ]
})
export class UserModule { }