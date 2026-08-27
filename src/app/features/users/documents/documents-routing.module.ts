// src/app/features/users/documents/documents-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocumentsListComponent } from '../components/documents/documents-list/documents-list.component';
import { DocumentsFormComponent } from '../components/documents/documents-form/documents-form.component';
import { DocumentsDetailComponent } from '../components/documents/documents-detail/documents-detail.component';

const routes: Routes = [
  {
    path: '',
    component: DocumentsListComponent,
    pathMatch: 'full'
  },
  {
    path: 'new',
    component: DocumentsFormComponent
  },
  {
    path: 'detail/:id',
    component: DocumentsDetailComponent
  },
  {
    path: 'edit/:id',
    component: DocumentsFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentsRoutingModule { }