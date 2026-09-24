import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { HeaderComponent } from './components/main-layout/header/header.component';
import { SidebarComponent } from './components/main-layout/sidebar/sidebar.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { FingerprintScannerComponent } from './components/fingerprint-scanner/fingerprint-scanner.component';

@NgModule({
  declarations: [
    StatusBadgeComponent,
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    StatCardComponent,
    NavbarComponent,
    LoadingSpinnerComponent,
    FingerprintScannerComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    StatusBadgeComponent,
    StatCardComponent,
    NavbarComponent,
    LoadingSpinnerComponent,
    FingerprintScannerComponent
  ]
})
export class SharedModule { }