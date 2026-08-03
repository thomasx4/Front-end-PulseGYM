import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class IdleService {
    private idleTimer: any;
    private timeoutDuration = 15 * 60 * 1000; // 15 minutos

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    startWatching(): void {
        this.stopWatching();

        const resetTimer = () => {
            this.stopWatching();
            this.startTimer();
        };

        document.addEventListener('mousemove', resetTimer);
        document.addEventListener('keydown', resetTimer);
        document.addEventListener('click', resetTimer);
        document.addEventListener('scroll', resetTimer);

        this.startTimer();
    }

    private startTimer(): void {
        this.idleTimer = setTimeout(() => {
            this.logoutUser();
        }, this.timeoutDuration);
    }

    stopWatching(): void {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    private logoutUser(): void {
        console.warn('Cierre de sesión automático por inactividad.');
        this.authService.logout();
    }
}