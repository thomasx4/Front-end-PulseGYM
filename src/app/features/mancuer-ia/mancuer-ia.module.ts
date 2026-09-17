import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MancuerIaComponent } from './mancuer-ia.component';
import { MancuerIaRoutingModule } from './mancuer-ia-routing.module';

@NgModule({
  declarations: [MancuerIaComponent],
  imports: [
    CommonModule,
    FormsModule,
    MancuerIaRoutingModule
  ]
})
export class MancuerIaModule { }