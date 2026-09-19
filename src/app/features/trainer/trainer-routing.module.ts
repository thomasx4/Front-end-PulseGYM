import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RutinasComponent } from './components/rutinas/rutinas.component';
import { RutinasSocioComponent } from './components/rutinas/rutinas-socio/rutinas-socio.component';
import { DetalleSocioComponent } from './components/rutinas/detalle-socio/detalle-socio.component';
import { EditarSocioComponent } from './components/rutinas/editar-socio/editar-socio.component';
import { EjerciciosComponent } from './components/ejercicios/ejercicios.component';
import { PerfilMedicoComponent } from './components/perfil-medico/perfil-medico.component';
import { DetalleMedicoComponent } from './components/perfil-medico/detalle-medico/detalle-medico.component';
import { DetalleEjerciciosComponent } from './components/ejercicios/detalle-ejercicios/detalle-ejercicios.component';
import { MembresiasComponent } from './components/membresias/membresias.component';
import { EquipmentListComponent } from './components/equipments/equipment-list/equipment-list.component';
import { FaultReportsComponent } from './components/equipments/fault-reports/fault-reports.component';
import { ProgresoComponent } from './components/progreso/progreso.component';
import { DetalleProgresoComponent } from './components/progreso/detalle-progreso/detalle-progreso.component';
import { AjustesComponent } from './components/ajustes/ajustes.component';
import { ProfileComponent } from './components/profile/profile.component'; // 👈 Importa el componente profile

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'profile', component: ProfileComponent }, // 👈 Ruta para el perfil del entrenador
  {
    path: 'physical-history',
    loadChildren: () => import('./components/physical-history/physical-history.module').then(m => m.PhysicalHistoryModule)
  },
  { path: 'rutinas', component: RutinasComponent },
  { path: 'rutinas/socio/:idSocio', component: RutinasSocioComponent },
  { path: 'rutinas/socio/:idSocio/rutina/:idRutina', component: DetalleSocioComponent },
  { path: 'rutinas/socio/:idSocio/rutina/:idRutina/editar', component: EditarSocioComponent },
  { path: 'ejercicios', component: EjerciciosComponent },
  { path: 'ejercicios/:id', component: DetalleEjerciciosComponent },
  { path: 'perfil-medico', component: PerfilMedicoComponent },
  { path: 'perfil-medico/:idSocio', component: DetalleMedicoComponent },
  { path: 'membresias', component: MembresiasComponent },
  { path: 'membresias/:id', component: MembresiasComponent },
  { path: 'equipos', component: EquipmentListComponent },
  { path: 'equipos/fallas', component: FaultReportsComponent },
  { path: 'progreso', component: ProgresoComponent },
  { path: 'progreso/:idSocio', component: DetalleProgresoComponent },
  { path: 'ajustes', component: AjustesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrainerRoutingModule { }