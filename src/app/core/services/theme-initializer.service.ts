// src/app/core/services/theme-initializer.service.ts
import { Injectable } from '@angular/core';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeInitializerService {
  constructor(private themeService: ThemeService) {}

  initializeTheme(): Promise<void> {
    return new Promise((resolve) => {
      // Obtener userId del localStorage (guardado por AuthService)
      const userId = localStorage.getItem('userId');
      
      if (userId) {
        // Si hay usuario, inicializar su tema
        this.themeService.initializeThemeForUser(userId);
        console.log('Tema inicializado para usuario:', userId);
      } else {
        // Si no hay usuario, usar el tema por defecto (light)
        this.themeService.setTheme('light');
        console.log('Tema inicializado por defecto (light)');
      }
      
      resolve();
    });
  }
}