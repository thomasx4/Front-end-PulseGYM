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

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent },
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrainerRoutingModule { }