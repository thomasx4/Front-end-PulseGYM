import { Routes } from '@angular/router';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      { 
        path: 'plantillas', 
        loadComponent: () => import('./components/admin-plantillas/admin-plantillas.component').then(m => m.AdminPlantillasComponent) 
      },
      { 
        path: 'disenos', 
        loadComponent: () => import('./components/admin-disenos/admin-disenos.component').then(m => m.AdminDisenosComponent) 
      },
      { 
        path: 'configuracion', 
        loadComponent: () => import('./components/admin-configuracion/admin-configuracion.component').then(m => m.AdminConfiguracionComponent) 
      },
      { 
        path: 'envio-manual', 
        loadComponent: () => import('./components/admin-envio-manual/admin-envio-manual.component').then(m => m.AdminEnvioManualComponent) 
      },
      { 
        path: 'whatsapp', 
        loadComponent: () => import('./components/admin-whatsapp/admin-whatsapp.component').then(m => m.AdminWhatsappComponent) 
      },
      { path: '', redirectTo: 'plantillas', pathMatch: 'full' }
    ]
  }
];