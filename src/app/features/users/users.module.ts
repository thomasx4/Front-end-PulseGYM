import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { UsersRoutingModule } from './users-routing.module';
import { UserProfileListComponent } from './components/user-profile-list/user-profile-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { DocumentsListComponent } from './components/documents/documents-list/documents-list.component';
import { DocumentsFormComponent } from './components/documents/documents-form/documents-form.component';
import { DocumentsDetailComponent } from './components/documents/documents-detail/documents-detail.component';


@NgModule({
  declarations: [
    UserProfileListComponent,
    UserFormComponent,
    UserDetailComponent,
    DocumentsListComponent,
    DocumentsFormComponent,
    DocumentsDetailComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    FormsModule,
    ReactiveFormsModule 
  ]
})
export class UsersModule { }
