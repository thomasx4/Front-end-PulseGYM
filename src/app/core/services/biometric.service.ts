import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH } from '../constants/http-context';

export interface HuellaLocal {
  userId: number;
  deviceId: string;
  nombre?: string;
}

interface JwtDTOResponse {
  jwt: string;
  requiereCambioContrasena?: boolean;
}

interface RespuestaAsistenciaBiometrica {
  message: string;
}

/**
 * Simula la captura de una huella digital en el navegador para marcar la
 * asistencia de un socio al llegar al gimnasio (no para iniciar sesión en la web).
 * El backend (pg-ms-users / pg-ms-auth / pg-ms-operation) ya expone el contrato
 * biométrico completo pero no hay lector de huella real conectado: aquí generamos
 * un deviceId de dispositivo (equivalente al identificador que entregaría un SDK
 * biométrico real) y lo persistimos en localStorage para simular "este dispositivo
 * tiene la huella de este socio activada".
 */
@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private readonly apiAuth = `${environment.apiUrl}/pg-ms-auth/auth`;
  private readonly apiUsuarios = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios`;
  private readonly apiAsistencias = `${environment.apiUrl}/pg-ms-operation/api/asistencias`;
  private readonly STORAGE_KEY = 'pulsegym_huella_dispositivo';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el idUsuario del PERFIL del socio en pg-ms-users (no el id de pg-ms-auth).
   * Los endpoints de huella (/usuarios/{idUsuario}/huella/...) validan que ese id
   * corresponda, por email, al usuario autenticado, así que es obligatorio usar
   * el id de este perfil y no el id devuelto por el login/JWT (pg-ms-auth).
   */
  obtenerIdPerfil(): Observable<number> {
    return this.http.get<{ idUsuario: number }>(`${this.apiUsuarios}/mi-perfil`).pipe(
      map((perfil) => {
        if (!perfil?.idUsuario) {
          throw new Error('No se pudo identificar tu perfil de socio.');
        }
        return perfil.idUsuario;
      })
    );
  }

  private generarDeviceId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  obtenerHuellaLocal(): HuellaLocal | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  hayHuellaEnEsteDispositivo(userId?: number): boolean {
    const local = this.obtenerHuellaLocal();
    if (!local) {
      return false;
    }
    return userId != null ? local.userId === userId : true;
  }

  private guardarHuellaLocal(local: HuellaLocal): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(local));
  }

  private borrarHuellaLocal(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Registra (activa) la huella para el usuario autenticado en este dispositivo/navegador.
   */
  registrarHuella(userId: number, nombre?: string): Observable<string> {
    const deviceId = this.generarDeviceId();
    return this.http.post<{ message: string }>(
      `${this.apiUsuarios}/${userId}/huella/registrar`,
      { deviceId }
    ).pipe(
      map(resp => {
        this.guardarHuellaLocal({ userId, deviceId, nombre });
        return resp.message || 'Huella registrada correctamente';
      })
    );
  }

  /**
   * Elimina la huella del usuario autenticado y borra el registro local del dispositivo.
   */
  eliminarHuella(userId: number): Observable<string> {
    const local = this.obtenerHuellaLocal();
    const deviceId = local?.deviceId || `sin-dispositivo-0`;
    return this.http.request<{ message: string }>(
      'delete',
      `${this.apiUsuarios}/${userId}/huella/eliminar`,
      { body: { deviceId } }
    ).pipe(
      map(resp => {
        this.borrarHuellaLocal();
        return resp.message || 'Huella eliminada correctamente';
      })
    );
  }

  /**
   * Registra la asistencia (entrada al gimnasio) del socio enrolado en este dispositivo:
   * 1) Genera un token biométrico corto (userId + deviceId del dispositivo enrolado).
   * 2) Lo usa para marcar la entrada en pg-ms-operation.
   * Ambas llamadas se marcan con SKIP_AUTH: el dispositivo de marcación no necesita sesión web.
   */
  registrarAsistencia(): Observable<string> {
    const local = this.obtenerHuellaLocal();
    if (!local) {
      return throwError(() => new Error('No has activado tu huella en este dispositivo.'));
    }

    const ctx = new HttpContext().set(SKIP_AUTH, true);

    return this.http.post<JwtDTOResponse>(
      `${this.apiAuth}/biometric/token`,
      { userId: local.userId, deviceId: local.deviceId },
      { context: ctx }
    ).pipe(
      catchError((err) => throwError(() => new Error(
        err?.error?.jwt || 'No se pudo generar el token biométrico. Verifica tu conexión.'
      ))),
      switchMap((tokenResp) => {
        if (!tokenResp?.jwt) {
          return throwError(() => new Error('No se pudo generar el token biométrico.'));
        }
        return this.http.post<RespuestaAsistenciaBiometrica>(
          `${this.apiAsistencias}/entrada-biometrica`,
          { idUsuario: local.userId, token: tokenResp.jwt },
          { context: ctx }
        ).pipe(
          catchError((err) => throwError(() => new Error(
            err?.error?.message || err?.error?.error || 'Huella no reconocida. Intenta de nuevo.'
          )))
        );
      }),
      map((resp) => resp?.message || 'Asistencia registrada correctamente')
    );
  }
}
