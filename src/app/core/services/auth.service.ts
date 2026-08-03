import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CredencialesListado, RegisterRequestDTO, MessageGlobalDTO, HttpGlobalResponse } from '../../features/auth/models/auth/auth.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js'; // <--- IMPORTANTE: Importamos la librería
import { AuthCredentials, AuthResponse, User, RolUsuario } from '../../features/auth/models/auth/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/pg-ms-auth/auth`;

  registerCredentials(datos: RegisterRequestDTO): Observable<MessageGlobalDTO> {
    return this.http.post<MessageGlobalDTO>(`${this.apiUrl}/register`, datos);
  }

  listarCredenciales(): Observable<HttpGlobalResponse<CredencialesListado[]>> {
    return this.http.get<HttpGlobalResponse<CredencialesListado[]>>(`${this.apiUrl}/usuarios`);
  }

  cambiarEstado(id: number, nuevoEstado: boolean): Observable<MessageGlobalDTO> {
  return this.http.put<MessageGlobalDTO>(
    `${this.apiUrl}/usuarios/estado/${id}`,
    { estado: nuevoEstado }
  );
}

  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  
  private secretKey = 'MiClaveSuperSegura2026!';

  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());
  authStatus$ = this.authStatus.asObservable().pipe(distinctUntilChanged());
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  currentUser$ = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: AuthCredentials): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials)
      .pipe(
        catchError(this.handleError),
        tap(response => {
          console.log('Respuesta del backend:', response); 

          if (response && response.token) {
            console.log('Token original:', response.token);
            
            this.setEncryptedItem(this.tokenKey, response.token);
            
            console.log('Token guardado en localStorage:', localStorage.getItem(this.tokenKey));
            console.log('Token descifrado (getToken):', this.getToken());
            
            if (response.user) {
              this.setEncryptedItem(this.userKey, JSON.stringify(response.user));
              this.currentUserSubject.next(response.user);
            }
            this.authStatus.next(true);
          }
        })
      );
  }
  private setEncryptedItem(key: string, value: string): void {
    const encrypted = CryptoJS.AES.encrypt(value, this.secretKey).toString();
    localStorage.setItem(key, encrypted);
  }

  private getDecryptedItem(key: string): string | null {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, this.secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      return null;
    }
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

  isLoggedIn(): boolean {
    const encryptedToken = localStorage.getItem(this.tokenKey);
    return !!encryptedToken;
  }

  getToken(): string | null {
    return this.getDecryptedItem(this.tokenKey);
  }

  getUser(): User | null {
    const userData = this.getDecryptedItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  hasRole(role: RolUsuario): boolean {
    const user = this.getUser();
    return user ? user.role === role : false;
  }

  isAdmin(): boolean {
    return this.hasRole(RolUsuario.ADMIN);
  }

  isTrainer(): boolean {
    return this.hasRole(RolUsuario.ENTRENADOR);
  }

  isReceptionist(): boolean {
    return this.hasRole(RolUsuario.RECEPCIONISTA);
  }

  getCurrentRole(): RolUsuario | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error al procesar la solicitud';
    console.error('Error del servidor:', error);
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de conexión: ${error.error.message}`;
    } else {
      const serverError = error.error as any;
      const message = serverError?.message || serverError?.error || serverError?.mensaje;
      switch (error.status) {
        case 0: errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.'; break;
        case 400: errorMessage = message || 'Solicitud incorrecta. Verifica los datos.'; break;
        case 401: errorMessage = message || 'Credenciales inválidas.'; break;
        case 403: errorMessage = message || 'Acceso denegado. No tienes permisos suficientes.'; break;
        case 404: errorMessage = message || 'Recurso no encontrado.'; break;
        case 409: errorMessage = message || 'Conflicto con los datos existentes.'; break;
        case 422: errorMessage = message || 'Datos inválidos. Verifica el formato.'; break;
        case 500: case 502: case 503: case 504: errorMessage = 'Error del servidor. Intenta más tarde.'; break;
        default: errorMessage = message || `Error ${error.status}: ${error.statusText}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
