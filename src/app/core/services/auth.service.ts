import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthCredentials, AuthResponse, User } from '../../features/auth/models/auth/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://api.pulsegym.uk/pg-ms-auth/auth';
  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  
  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());
  authStatus$ = this.authStatus.asObservable();
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: AuthCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => this.handleSuccessfulLogin(response)),
        catchError(this.handleError)
      );
  }

  private handleSuccessfulLogin(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    
    if (response.user) {
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }
    
    this.authStatus.next(true);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error al iniciar sesión';
    
    console.error('Error detallado:', error);
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
          break;
        case 400:
          errorMessage = 'Correo o contraseña incorrectos';
          break;
        case 401:
          errorMessage = 'Credenciales inválidas';
          break;
        case 403:
          errorMessage = 'Acceso denegado. No tienes permisos suficientes.';
          break;
        case 404:
          errorMessage = 'Usuario no encontrado';
          break;
        case 422:
          errorMessage = 'Datos inválidos. Verifica el formato.';
          break;
        case 500:
          errorMessage = 'Error del servidor. Intenta más tarde.';
          break;
        default:
          errorMessage = error.error?.message || error.error?.error || `Error ${error.status}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.authStatus.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user ? user.role === role : false;
  }
}