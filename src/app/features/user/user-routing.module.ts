import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { HistorialFisicoComponent } from './components/historial-fisico/historial-fisico.component';
import { MembresiasComponent } from './components/membresias/membresias.component';


const routes: Routes = [
  { path: '', component: DashboardComponent },

    { path: 'profile', component: ProfileComponent },
  
    { path: 'historial-fisico', component: HistorialFisicoComponent },

    { path: 'membresias', component: MembresiasComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule {}