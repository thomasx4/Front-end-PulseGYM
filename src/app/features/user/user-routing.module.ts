import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { HistorialFisicoComponent } from './components/historial-fisico/historial-fisico.component';
import { MembresiasComponent } from './components/membresias/membresias.component';
import { RutinasComponent } from './components/rutinas/rutinas.component';
import { CrearRutinaIaComponent } from './components/rutinas/crear-rutina-ia/crear-rutina-ia.component';
import { DetalleRutinaComponent } from './components/rutinas/detalle-rutina/detalle-rutina.component';
import { ExportarRutinaComponent } from './components/rutinas/exportar-rutina/exportar-rutina.component';
import { EditarRutinaComponent } from './components/rutinas/editar-rutina/editar-rutina.component';
import { PerfilMedicoComponent } from './components/perfil-medico/perfil-medico.component';
import { PlanNutricionalComponent } from './components/plan-nutricional/plan-nutricional.component';
import { CrearPlanComponent } from './components/plan-nutricional/crear-plan/crear-plan.component';
import { DetallePlanComponent } from './components/plan-nutricional/detalle-plan/detalle-plan.component';
import { EditarPlanComponent } from './components/plan-nutricional/editar-plan/editar-plan.component';
import { ExportarPlanComponent } from './components/plan-nutricional/exportar-plan/exportar-plan.component';
import { AjustesComponent } from './components/ajustes/ajustes.component';
import { PagosListComponent } from './components/pagos-list/pagos-list.component';
import { PagosFormComponent } from './components/pagos-form/pagos-form.component';
import { PagosDetailComponent } from './components/pagos-detail/pagos-detail.component';
import { AsistenciaComponent } from './components/asistencia/asistencia.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'historial-fisico', component: HistorialFisicoComponent },
  { path: 'membresias', component: MembresiasComponent },
  { path: 'rutinas', component: RutinasComponent },
  { path: 'rutinas/exportar', component: ExportarRutinaComponent },
  { path: 'rutinas/crear-ia', component: CrearRutinaIaComponent },
  { path: 'rutinas/detalle/:id', component: DetalleRutinaComponent },
  { path: 'rutinas/editar/:id', component: EditarRutinaComponent },
  { path: 'perfil-medico', component: PerfilMedicoComponent },
  { path: 'plan-nutricional', component: PlanNutricionalComponent },
  { path: 'plan-nutricional/crear-plan', component: CrearPlanComponent },
  { path: 'plan-nutricional/detalle/:id', component: DetallePlanComponent },
  { path: 'plan-nutricional/editar/:id', component: EditarPlanComponent },
  { path: 'plan-nutricional/exportar', component: ExportarPlanComponent },
  { path: 'ajustes', component: AjustesComponent },
  { path: 'pagos', component: PagosListComponent },
  { path: 'pagos/form', component: PagosFormComponent },
  { path: 'pagos/detail/:id', component: PagosDetailComponent },
  { path: 'asistencia', component: AsistenciaComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule {}