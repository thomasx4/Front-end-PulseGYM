import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ConfiguracionGlobal, PlantillaDisenoEmail, PlantillaNotificacion, EnvioNotificacion } from '../models/notification.model';
import { PreferenciaUsuario } from '../models/preference.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pg-ms-notifications`;

  private getHeaders(rol: string, userId?: number) {
    let headers = new HttpHeaders().set('X-User-Rol', rol);
    if (userId) {
      headers = headers.set('X-User-Id', userId.toString());
    }
    return headers;
  }

  // --- PREFERENCIAS (SOCIO) ---
  obtenerMisPreferencias(rol: string, userId: number): Observable<{ success: boolean; data: PreferenciaUsuario }> {
    return this.http.get<{ success: boolean; data: PreferenciaUsuario }>(`${this.apiUrl}/preferencias/mis-preferencias`, {
      headers: this.getHeaders(rol, userId)
    });
  }

  actualizarMisPreferencias(rol: string, userId: number, data: PreferenciaUsuario): Observable<any> {
    return this.http.put(`${this.apiUrl}/preferencias/mis-preferencias`, data, {
      headers: this.getHeaders(rol, userId)
    });
  }

  // --- PLANTILLAS (ADMIN) ---
  listarPlantillas(rol: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/plantilla/leer`, { headers: this.getHeaders(rol) });
  }

  crearPlantilla(rol: string, data: PlantillaNotificacion): Observable<any> {
    return this.http.post(`${this.apiUrl}/plantilla/crear`, data, { headers: this.getHeaders(rol) });
  }

  actualizarPlantilla(rol: string, id: number, data: PlantillaNotificacion): Observable<any> {
    return this.http.put(`${this.apiUrl}/plantilla/actualizar/${id}`, data, { headers: this.getHeaders(rol) });
  }

  cambiarEstadoPlantilla(rol: string, id: number, activar: boolean): Observable<any> {
    const endpoint = activar ? `activar` : `inactivar`;
    return this.http.post(`${this.apiUrl}/plantilla/${endpoint}/${id}`, {}, { headers: this.getHeaders(rol) });
  }

  vistaPreviaPlantilla(rol: string, contenido: string, valoresPrueba?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/plantilla/vista-previa`, { contenido, valoresPrueba }, { headers: this.getHeaders(rol) });
  }

  // --- CONFIGURACIÓN GLOBAL & DISEÑOS (ADMIN) ---
  obtenerConfiguracionGlobal(rol: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/configuracion-global`, { headers: this.getHeaders(rol) });
  }

  actualizarConfiguracionGlobal(rol: string, data: ConfiguracionGlobal): Observable<any> {
    return this.http.put(`${this.apiUrl}/configuracion-global`, data, { headers: this.getHeaders(rol) });
  }

  // --- ENVÍOS (ADMIN) ---
  enviarNotificacionManual(rol: string, data: EnvioNotificacion): Observable<any> {
    return this.http.post(`${this.apiUrl}/notificaciones/enviar`, data, { headers: this.getHeaders(rol) });
  }

  // --- DISEÑOS DE EMAIL (ADMIN) ---
  listarDisenos(rol: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/diseno-email/leer`, { headers: this.getHeaders(rol) });
  }

  crearDiseno(rol: string, data: PlantillaDisenoEmail): Observable<any> {
    return this.http.post(`${this.apiUrl}/diseno-email/crear`, data, { headers: this.getHeaders(rol) });
  }

  actualizarDiseno(rol: string, id: number, data: PlantillaDisenoEmail): Observable<any> {
    return this.http.put(`${this.apiUrl}/diseno-email/actualizar/${id}`, data, { headers: this.getHeaders(rol) });
  }

  eliminarPlantilla(rol: string, id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/plantilla/eliminar/${id}`, {}, { headers: this.getHeaders(rol) });
  }

  eliminarDiseno(rol: string, id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/diseno-email/eliminar/${id}`, {}, { headers: this.getHeaders(rol) });
  }
}