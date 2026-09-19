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

  constructor() {
    const savedGlobalTheme = (localStorage.getItem('theme_default') as Theme) || 'light';
    this.setTheme(savedGlobalTheme, false);
  }

  initializeThemeForUser(userId: string): void {
    this.currentUserId = userId;
    const storageKey = `theme_${userId}`;
    const savedTheme = (localStorage.getItem(storageKey) as Theme) || (localStorage.getItem('theme_default') as Theme) || 'light';
    this.setTheme(savedTheme, false);
  }

  setTheme(theme: Theme, saveToStorage: boolean = true): void {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(theme === 'dark' ? 'dark-mode' : 'light-mode');
    
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    if (saveToStorage) {
      if (this.currentUserId) {
        localStorage.setItem(`theme_${this.currentUserId}`, theme);
      }
      localStorage.setItem('theme_default', theme);
    }
    
    this.currentThemeSubject.next(theme);
  }

  toggleTheme(): void {
    const current = this.currentThemeSubject.getValue();
    const newTheme: Theme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme, true);
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