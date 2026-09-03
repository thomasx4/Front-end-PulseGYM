import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UsersRoutingModule } from './users-routing.module';
import { UserProfileListComponent } from './components/user-profile-list/user-profile-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { CertificatesListComponent } from './components/certificates/certificates-list/certificates-list.component';
import { CertificatesFormComponent } from './components/certificates/certificates-form/certificates-form.component';
import { CertificatesDetailComponent } from './components/certificates/certificates-detail/certificates-detail.component';
import { AuthModule } from '../auth/auth.module';
import { PhysicalHistoryListComponent } from './components/physical-history/physical-history-list/physical-history-list.component';
import { PhysicalHistoryFormComponent } from './components/physical-history/physical-history-form/physical-history-form.component';
import { PhysicalHistoryDetailComponent } from './components/physical-history/physical-history-detail/physical-history-detail.component';
import { MedicalProfileListComponent } from './components/medical-profile/medical-profile-list/medical-profile-list.component';
import { MedicalProfileDetailComponent } from './components/medical-profile/medical-profile-detail/medical-profile-detail.component';
import { MedicalProfileFormComponent } from './components/medical-profile/medical-profile-form/medical-profile-form.component';

@NgModule({
  declarations: [
    UserProfileListComponent,
    UserFormComponent,
    UserDetailComponent,
    CertificatesListComponent,
    CertificatesFormComponent,
    CertificatesDetailComponent,
    PhysicalHistoryListComponent,
    PhysicalHistoryFormComponent,
    PhysicalHistoryDetailComponent,
    MedicalProfileListComponent,
    MedicalProfileDetailComponent,
    MedicalProfileFormComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AuthModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UsersModule { }