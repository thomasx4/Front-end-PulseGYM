import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MedicalProfileListComponent } from '../components/medical-profile/medical-profile-list/medical-profile-list.component';
import { MedicalProfileFormComponent } from '../components/medical-profile/medical-profile-form/medical-profile-form.component';
import { MedicalProfileDetailComponent } from '../components/medical-profile/medical-profile-detail/medical-profile-detail.component';

const routes: Routes = [
  {
    path: '',
    component: MedicalProfileListComponent
  },
  {
    path: 'new',
    component: MedicalProfileFormComponent
  },
  {
    path: 'edit/:id',
    component: MedicalProfileFormComponent
  },
  {
    path: 'detail/:id',
    component: MedicalProfileDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MedicalProfileRoutingModule { }