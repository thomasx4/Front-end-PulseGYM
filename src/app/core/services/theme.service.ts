// src/app/core/services/theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<Theme>('light');
  public currentTheme$ = this.currentThemeSubject.asObservable();
  private currentUserId: string | null = null;

  constructor() {}

  // 👈 Inicializar el tema cuando el usuario inicia sesión
  initializeThemeForUser(userId: string): void {
    this.currentUserId = userId;
    const storageKey = `theme_${userId}`;
    const savedTheme = localStorage.getItem(storageKey) as Theme || 'light';
    this.setTheme(savedTheme, false);
  }

  setTheme(theme: Theme, saveToStorage: boolean = true): void {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(theme === 'dark' ? 'dark-mode' : 'light-mode');
    
    if (saveToStorage && this.currentUserId) {
      const storageKey = `theme_${this.currentUserId}`;
      localStorage.setItem(storageKey, theme);
    }
    
    this.currentThemeSubject.next(theme);
    console.log('Tema aplicado para usuario', this.currentUserId, ':', theme);
  }

  toggleTheme(): void {
    const current = this.currentThemeSubject.getValue();
    this.setTheme(current === 'light' ? 'dark' : 'light');
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.getValue();
  }

  isDarkMode(): boolean {
    return this.getCurrentTheme() === 'dark';
  }

  clearTheme(): void {
    this.currentUserId = null;
  }
}