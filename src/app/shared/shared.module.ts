import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { HeaderComponent } from './components/main-layout/header/header.component';
import { SidebarComponent } from './components/main-layout/sidebar/sidebar.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { UserSidebarComponent } from './components/mobile-user/user-sidebar/user-sidebar.component';
import { UserStatCardComponent } from './components/mobile-user/user-stat-card/user-stat-card.component';
import { UserWeeklyActivityComponent } from './components/mobile-user/user-weekly-activity/user-weekly-activity.component';
import { UserQuickActionsComponent } from './components/mobile-user/user-quick-actions/user-quick-actions.component';
import { UserPromoCardComponent } from './components/mobile-user/user-promo-card/user-promo-card.component';



@NgModule({
  declarations: [
    StatusBadgeComponent,
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    StatCardComponent,
    UserSidebarComponent,
    UserStatCardComponent,
    UserWeeklyActivityComponent,
    UserQuickActionsComponent,
    UserPromoCardComponent,
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
    UserSidebarComponent,
    UserStatCardComponent,
    UserWeeklyActivityComponent,
    UserQuickActionsComponent,
    UserPromoCardComponent
  ]
})
export class SharedModule { }
