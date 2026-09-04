import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HeadquartersRoutingModule } from './headquarters-routing.module';
import { HeadquartersListComponent } from './components/headquarters-list/headquarters-list.component'; 
import { RegisterHeadquartersComponent } from './components/register-headquarters/register-headquarters.component';

@NgModule({
  declarations: [
    HeadquartersListComponent,
    RegisterHeadquartersComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HeadquartersRoutingModule
  ],
  exports: [
    HeadquartersListComponent
  ]
})
export class HeadquartersModule { }
