import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DocumentsRoutingModule } from './documents-routing.module';
import { DocumentsListComponent } from '../components/documents/documents-list/documents-list.component';
import { DocumentsFormComponent } from '../components/documents/documents-form/documents-form.component';
import { DocumentsDetailComponent } from '../components/documents/documents-detail/documents-detail.component';

@NgModule({
  declarations: [
    DocumentsListComponent,
    DocumentsFormComponent,
    DocumentsDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DocumentsRoutingModule
  ]
})
export class DocumentsModule { }