import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthCredentials, AuthResponse, User, RolUsuario } from '../../features/auth/models/auth/auth.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/pg-ms-auth/auth`;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  
  // Subjects para mantener el estado en tiempo real
  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());
  authStatus$ = this.authStatus.asObservable().pipe(distinctUntilChanged());
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  currentUser$ = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Inicio de sesión
   * Retorna el objeto User completo para que el componente pueda leer el rol
   */
  login(credentials: AuthCredentials): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => this.handleSuccessfulLogin(response)),
        map(response => response.user),
        catchError(this.handleError)
      );
  }

  /**
   * Maneja el almacenamiento de datos al hacer login exitoso
   */
  private handleSuccessfulLogin(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    
    if (response.user) {
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }
    
    this.authStatus.next(true);
  }

  /**
   * Cierre de sesión
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.authStatus.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // --- Getters de estado (Sincrónicos y Observables) ---

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


  /**
   * Verifica si el usuario tiene un rol específico (Sincrónico)
   * Útil para Guards o condicionales en el HTML
   */
  hasRole(role: RolUsuario): boolean {
    const user = this.getUser();
    return user ? user.role === role : false;
  }

  /**
   * Verifica si el usuario tiene el rol de Administrador
   */
  isAdmin(): boolean {
    return this.hasRole(RolUsuario.ADMIN);
  }

  /**
   * Verifica si el usuario tiene el rol de Entrenador
   */
  isTrainer(): boolean {
    return this.hasRole(RolUsuario.ENTRENADOR);
  }

  /**
   * Verifica si el usuario tiene el rol de Recepcionista
   */
  isReceptionist(): boolean {
    return this.hasRole(RolUsuario.RECEPCIONISTA);
  }

  /**
   * Obtiene el rol actual del usuario como string (para el Router)
   */
  getCurrentRole(): RolUsuario | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  // --- Manejo de Errores Mejorado ---

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error al procesar la solicitud';
    
    console.error('Error del servidor:', error);
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de conexión: ${error.error.message}`;
    } else {
      const serverError = error.error as any;
      
      // Intenta obtener el mensaje del backend (diferentes formatos comunes)
      const message = serverError?.message || serverError?.error || serverError?.mensaje;
      
      switch (error.status) {
        case 0:
          errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
          break;
        case 400:
          errorMessage = message || 'Solicitud incorrecta. Verifica los datos.';
          break;
        case 401:
          errorMessage = message || 'Credenciales inválidas.';
          break;
        case 403:
          errorMessage = message || 'Acceso denegado. No tienes permisos suficientes.';
          break;
        case 404:
          errorMessage = message || 'Recurso no encontrado.';
          break;
        case 409:
          errorMessage = message || 'Conflicto con los datos existentes.';
          break;
        case 422:
          errorMessage = message || 'Datos inválidos. Verifica el formato.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Error del servidor. Intenta más tarde.';
          break;
        default:
          errorMessage = message || `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}