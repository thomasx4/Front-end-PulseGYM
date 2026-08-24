import { Component, OnInit } from '@angular/core';
import { IdleService } from './core/services/idle.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'pulse-gym';

  constructor(
    private idleService: IdleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.idleService.startWatching();
    //this.authService.logout();
  }
}