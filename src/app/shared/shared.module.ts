import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { HeaderComponent } from './components/main-layout/header/header.component';
import { SidebarComponent } from './components/main-layout/sidebar/sidebar.component';



@NgModule({
  declarations: [
    StatusBadgeComponent,
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    StatusBadgeComponent
  ]
})
export class SharedModule { }
