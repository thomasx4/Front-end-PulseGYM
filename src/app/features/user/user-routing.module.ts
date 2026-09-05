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
    
  ]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule {}