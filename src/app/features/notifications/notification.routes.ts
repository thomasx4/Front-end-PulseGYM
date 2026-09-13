import { Routes } from '@angular/router';
import { AdminPlantillasComponent } from './components/admin-plantillas/admin-plantillas.component';
import { AdminDisenosComponent } from './components/admin-disenos/admin-disenos.component';
import { AdminConfiguracionComponent } from './components/admin-configuracion/admin-configuracion.component';
import { AdminEnvioManualComponent } from './components/admin-envio-manual/admin-envio-manual.component';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: 'plantillas', component: AdminPlantillasComponent },
      { path: 'disenos', component: AdminDisenosComponent },
      { path: 'configuracion', component: AdminConfiguracionComponent },
      { path: 'envio-manual', component: AdminEnvioManualComponent },
      { path: '', redirectTo: 'plantillas', pathMatch: 'full' }
    ]
  }
];