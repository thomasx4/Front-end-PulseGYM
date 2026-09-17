import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MancuerIaComponent } from './mancuer-ia.component';

const routes: Routes = [
    { path: '', component: MancuerIaComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MancuerIaRoutingModule { }