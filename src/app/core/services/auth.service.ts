import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CredencialesListado, RegisterRequestDTO, MessageGlobalDTO, HttpGlobalResponse } from '../../features/auth/models/auth/auth.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { AuthCredentials, AuthResponse, User, RolUsuario } from '../../features/auth/models/auth/auth.model';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/pg-ms-auth/auth`;

  /**
   * Registro de credenciales
   */
  registerCredentials(datos: RegisterRequestDTO): Observable<MessageGlobalDTO> {
    return this.http.post<MessageGlobalDTO>(`${this.apiUrl}/register`, datos);
  }

  /**
   * Listado de credenciales
   */
  listarCredenciales(): Observable<HttpGlobalResponse<CredencialesListado[]>> {
    return this.http.get<HttpGlobalResponse<CredencialesListado[]>>(`${this.apiUrl}/usuarios`);
  }

  /**
   * Cambio de estado de credencial
   */
  cambiarEstado(id: number, nuevoEstado: boolean): Observable<MessageGlobalDTO> {
    return this.http.put<MessageGlobalDTO>(
      `${this.apiUrl}/usuarios/estado/${id}`,
      { estado: nuevoEstado }
    );
  }

  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  private roleKey = 'user_role';

  private secretKey = 'MiClaveSuperSegura2026!';

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
   * Adaptado para extraer el token y el rol desde diferentes estructuras del backend
   */
  login(credentials: AuthCredentials): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials)
      .pipe(
        catchError(this.handleError),
        tap(response => {
          console.log('Respuesta del backend:', response); 

          let token: string | null = null;
          let userRole: RolUsuario = RolUsuario.USER;
          let userEmail: string = credentials.email;

          if (response && response.data && response.data.jwt) {
            token = response.data.jwt;
          } else if (response && response.token) {
            token = response.token;
          }

          if (token) {
            this.setEncryptedItem(this.tokenKey, token);
            
            try {
              const decoded: any = jwtDecode(token);
              console.log('Payload del token:', decoded);
              
              const rawRole = decoded.rol || decoded.role || decoded.Rol || decoded.user_role || null;
              
              if (rawRole === 'administrador' || rawRole === 'admin') {
                userRole = RolUsuario.ADMIN;
              } else if (rawRole === 'entrenador' || rawRole === 'trainer') {
                userRole = RolUsuario.ENTRENADOR;
              } else if (rawRole === 'recepcionista' || rawRole === 'receptionist') {
                userRole = RolUsuario.RECEPCIONISTA;
              } else if (rawRole === 'user' || rawRole === 'socio') {
                userRole = RolUsuario.USER;
              } else {
                console.warn('Rol no reconocido en el token:', rawRole);
                userRole = RolUsuario.USER;
              }
              
              userEmail = decoded.email || decoded.sub || credentials.email;
              
              console.log('Rol extraído del token:', userRole);
            } catch (error) {
              console.warn('No se pudo decodificar el token. Usando rol por defecto.');
            }

            const dummyUser: User = {
              id: '0',
              name: 'Usuario',
              email: userEmail,
              role: userRole
            };

            this.setEncryptedItem(this.userKey, JSON.stringify(dummyUser));
            localStorage.setItem(this.roleKey, userRole); 
            
            this.currentUserSubject.next(dummyUser);
            this.authStatus.next(true);
            
            console.log('Rol guardado en localStorage:', localStorage.getItem(this.roleKey));
          } else {
            console.warn('El backend no envió un token válido.');
          }
        })
      );
  }

  /**
   * Método de cifrado
   */
  private setEncryptedItem(key: string, value: string): void {
    const encrypted = CryptoJS.AES.encrypt(value, this.secretKey).toString();
    localStorage.setItem(key, encrypted);
  }

  /**
   * Método de descifrado
   */
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
    localStorage.removeItem(this.roleKey);
    this.authStatus.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Verifica si el usuario está logueado
   */
  isLoggedIn(): boolean {
    const encryptedToken = localStorage.getItem(this.tokenKey);
    return !!encryptedToken;
  }

  /**
   * Obtiene el token descifrado
   */
  getToken(): string | null {
    return this.getDecryptedItem(this.tokenKey);
  }

  /**
   * Obtiene el usuario descifrado
   */
  getUser(): User | null {
    const userData = this.getDecryptedItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Obtiene el rol del localStorage (sin descifrar)
   */
  getCurrentRole(): RolUsuario | null {
    const role = localStorage.getItem(this.roleKey);
    return role as RolUsuario || null;
  }

  /**
   * Observable del usuario actual
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
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

  /**
   * Manejo de errores
   */
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