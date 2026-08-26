import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CertificatesListComponent } from '../components/certificates/certificates-list/certificates-list.component';
import { CertificatesFormComponent } from '../components/certificates/certificates-form/certificates-form.component';
import { CertificatesDetailComponent } from '../components/certificates/certificates-detail/certificates-detail.component';

const routes: Routes = [
  {
    path: '',
    component: CertificatesListComponent
  },
  {
    path: 'new',
    component: CertificatesFormComponent
  },
  {
    path: 'detail/:id',
    component: CertificatesDetailComponent
  },
  {
    path: 'edit/:id',
    component: CertificatesFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CertificatesRoutingModule { }