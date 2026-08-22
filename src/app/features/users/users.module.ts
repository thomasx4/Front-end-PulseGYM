import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 

import { UsersRoutingModule } from './users-routing.module';
import { UserProfileListComponent } from './components/user-profile-list/user-profile-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';


@NgModule({
  declarations: [
    UserProfileListComponent,
    UserFormComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    FormsModule
  ]
})
export class UsersModule { }
