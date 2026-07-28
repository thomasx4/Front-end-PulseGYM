import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { HeaderComponent } from './components/main-layout/header/header.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    StatusBadgeComponent,
    MainLayoutComponent,
    HeaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class SharedModule { }
