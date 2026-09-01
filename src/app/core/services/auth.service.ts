import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { 
  RespuestaPaginadaCredenciales, 
  RegisterRequestDTO, 
  MessageGlobalDTO, 
  HttpGlobalResponse, 
  Credencial, 
  ChangePasswordDTO,
  AuthCredentials, 
  User, 
  RolUsuario,
  FiltrosUsuarios 
} from '../../features/auth/models/auth/auth.model';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { jwtDecode } from 'jwt-decode';

export { FiltrosUsuarios };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/pg-ms-auth/auth`;

  private readonly LOCK_KEY = 'login_lock_end_time';
  private readonly LOCK_DURATION = 30000;
  private readonly REQUIRE_CHANGE_PASS_KEY = 'require_change_pass';

  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  private roleKey = 'user_role';
  private secretKey = 'MiClaveSuperSegura2026!';

  private authStatus = new BehaviorSubject<boolean>(this.isLoggedIn());
  authStatus$ = this.authStatus.asObservable().pipe(distinctUntilChanged());

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  currentUser$ = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());

  private requiereCambioSubject = new BehaviorSubject<boolean>(this.debeCambiarContrasena());
  requiereCambio$ = this.requiereCambioSubject.asObservable().pipe(distinctUntilChanged());

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  registerCredentials(datos: RegisterRequestDTO): Observable<MessageGlobalDTO> {
    return this.http.post<MessageGlobalDTO>(`${this.apiUrl}/register`, datos);
  }

  listarTodosLosUsuarios(
    ordenarPor: string = 'id',
    direccion?: string,
    rol?: string,
    activo?: boolean,
    username?: string
  ): Observable<Credencial[]> {
    let params = new HttpParams().set('ordenarPor', ordenarPor);

    if (rol) params = params.set('rol', rol);
    if (activo !== undefined) params = params.set('activo', activo);
    if (direccion) params = params.set('direccion', direccion);
    if (username) params = params.set('username', username);

    return this.http.get<Credencial[]>(`${this.apiUrl}/usuarios/todos`, { params });
  }

  listarCredenciales(filtros: FiltrosUsuarios = {}): Observable<RespuestaPaginadaCredenciales> {
    let params = new HttpParams();

    if (filtros.username) {
      params = params.set('username', filtros.username);
    }
    if (filtros.email) {
      params = params.set('email', filtros.email);
    }
    if (filtros.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }
    if (filtros.rol) {
      params = params.set('rol', filtros.rol);
    }
    if (filtros.activo !== undefined && filtros.activo !== null) {
      params = params.set('activo', filtros.activo.toString());
    }
    if (filtros.ordenarPor) {
      params = params.set('ordenarPor', filtros.ordenarPor);
    }
    if (filtros.direccion) {
      params = params.set('direccion', filtros.direccion);
    }

    params = params.set('pagina', (filtros.page ?? 0).toString());
    params = params.set('tamanio', (filtros.size ?? 7).toString());

    return this.http.get<RespuestaPaginadaCredenciales>(`${this.apiUrl}/usuarios`, { params });
  }

  cambiarEstado(id: number, nuevoEstado: boolean): Observable<MessageGlobalDTO> {
    return this.http.put<MessageGlobalDTO>(
      `${this.apiUrl}/usuarios/estado/${id}`,
      { estado: nuevoEstado }
    );
  }

  isLoginGloballyLocked(): boolean {
    const lockEndTime = localStorage.getItem(this.LOCK_KEY);
    if (!lockEndTime) return false;

    const endTime = parseInt(lockEndTime, 10);
    const remaining = endTime - Date.now();
    return remaining > 0;
  }

  getLockRemainingSeconds(): number {
    const lockEndTime = localStorage.getItem(this.LOCK_KEY);
    if (!lockEndTime) return 0;

    const endTime = parseInt(lockEndTime, 10);
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  setGlobalLock(): void {
    const endTime = Date.now() + this.LOCK_DURATION;
    localStorage.setItem(this.LOCK_KEY, endTime.toString());
  }

  clearGlobalLock(): void {
    localStorage.removeItem(this.LOCK_KEY);
  }

  login(credentials: AuthCredentials): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials)
      .pipe(
        catchError(this.handleError),
        tap(response => {
          let token: string | null = null;
          let userRole: RolUsuario = RolUsuario.USER;
          let userEmail: string = credentials.email;
          let username: string = '';
          let userFullName: string = 'Usuario';
          let requiereCambio = false;

          if (response && response.data) {
            token = response.data.jwt || response.data.token;
            requiereCambio = !!response.data.requiereCambioContrasena;
          } else if (response && response.token) {
            token = response.token;
          }

          if (token) {
            this.setEncryptedItem(this.tokenKey, token);

            try {
              const decoded: any = jwtDecode(token);

              username = decoded.username || decoded.user || decoded.sub || credentials.email.split('@')[0];
              userEmail = decoded.email || decoded.sub || credentials.email;
              userFullName = decoded.name || decoded.nombre || username;

              const rawRole = decoded.rol || decoded.role || decoded.Rol || decoded.user_role || null;

              if (rawRole === 'administrador' || rawRole === 'admin') {
                userRole = RolUsuario.ADMIN;
              } else if (rawRole === 'entrenador' || rawRole === 'trainer') {
                userRole = RolUsuario.ENTRENADOR;
              } else if (rawRole === 'recepcionista' || rawRole === 'receptionist') {
                userRole = RolUsuario.RECEPCIONISTA;
              } else {
                userRole = RolUsuario.USER;
              }
            } catch (error) {
              username = credentials.email.split('@')[0];
            }

            const user: User = {
              id: '0',
              username: username,
              name: userFullName,
              email: userEmail,
              role: userRole,
              requiereCambioContrasena: requiereCambio
            };

            this.setEncryptedItem(this.userKey, JSON.stringify(user));
            localStorage.setItem(this.roleKey, userRole);
            localStorage.setItem(this.REQUIRE_CHANGE_PASS_KEY, requiereCambio ? 'true' : 'false');

            this.currentUserSubject.next(user);
            this.authStatus.next(true);
            this.requiereCambioSubject.next(requiereCambio);
          }
        })
      );
  }

  debeCambiarContrasena(): boolean {
    return localStorage.getItem(this.REQUIRE_CHANGE_PASS_KEY) === 'true';
  }

  cambiarContrasenaObligatoria(data: ChangePasswordDTO): Observable<MessageGlobalDTO> {
    return this.http.post<MessageGlobalDTO>(`${this.apiUrl}/change-password`, data).pipe(
      tap(() => {
        localStorage.setItem(this.REQUIRE_CHANGE_PASS_KEY, 'false');
        this.requiereCambioSubject.next(false);
        const user = this.getUser();
        if (user) {
          user.requiereCambioContrasena = false;
          this.setEncryptedItem(this.userKey, JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  generarContrasenaTemporalByAdmin(email: string): Observable<HttpGlobalResponse<string>> {
    return this.http.post<HttpGlobalResponse<string>>(`${this.apiUrl}/change-password-by-admin`, {
      email: email,
      newPassword: 'temp',
      confirmPassword: 'temp'
    });
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

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.REQUIRE_CHANGE_PASS_KEY);
    this.clearGlobalLock();
    this.authStatus.next(false);
    this.currentUserSubject.next(null);
    this.requiereCambioSubject.next(false);
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

  getCurrentRole(): RolUsuario | null {
    const role = localStorage.getItem(this.roleKey);
    return role as RolUsuario || null;
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

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error al procesar la solicitud';
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

  obtenerPerfilCompleto(): Observable<User> {
    return this.http.get<any>(`${environment.apiUrl}/pg-ms-users/api/v1/usuarios/mi-perfil`)
      .pipe(
        map(response => {
          const data = response.data || response;

          const user: User = {
            id: data.idUsuario?.toString() || '0',
            username: data.username || data.email?.split('@')[0] || 'usuario',
            name: data.nombre || data.username || 'Usuario',
            email: data.email || '',
            role: this.mapRol(data.rol) || RolUsuario.USER,
            fotoUrl: data.fotoUrl || data.fotoPerfil || data.foto || null
          };

          this.setEncryptedItem(this.userKey, JSON.stringify(user));
          this.currentUserSubject.next(user);

          return user;
        }),
        catchError(error => {
          const currentUser = this.getUser();
          if (currentUser) {
            return new Observable<User>(observer => {
              observer.next(currentUser);
              observer.complete();
            });
          }
          throw error;
        })
      );
  }

  private mapRol(rol: string): RolUsuario {
    if (!rol) return RolUsuario.USER;

    const rolLower = rol.toLowerCase();
    if (rolLower === 'administrador' || rolLower === 'admin') {
      return RolUsuario.ADMIN;
    } else if (rolLower === 'entrenador' || rolLower === 'trainer') {
      return RolUsuario.ENTRENADOR;
    } else if (rolLower === 'recepcionista' || rolLower === 'receptionist') {
      return RolUsuario.RECEPCIONISTA;
    } else {
      return RolUsuario.USER;
    }
  }
}