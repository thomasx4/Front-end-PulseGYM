/**
 * Dashboard principal del usuario
 */
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  username: string = '';
  greeting: string = '';

  stats: any[] = [];
  weeklyActivity: any[] = [];
  quickActions: any[] = [];
  promo: any = null;

  ngOnInit(): void {
    this.setGreeting();
    // TODO: Cargar datos desde el backend
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Good morning';
    } else if (hour < 18) {
      this.greeting = 'Good afternoon';
    } else {
      this.greeting = 'Good evening';
    }
  }
}