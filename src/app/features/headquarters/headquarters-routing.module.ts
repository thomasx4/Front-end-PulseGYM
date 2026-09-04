import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HeadquartersListComponent } from '../headquarters/components/headquarters-list/headquarters-list.component';

const routes: Routes = [
  {
    path: '',
    component: HeadquartersListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HeadquartersRoutingModule { }