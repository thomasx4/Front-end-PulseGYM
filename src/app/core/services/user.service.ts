// src/app/core/services/user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios`;

    constructor(private http: HttpClient) { }

    /**
     * Completa el perfil de un usuario
     */
    completarPerfil(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/completar-perfil`, data);
    }

    /**
     * Obtiene el perfil del usuario autenticado (usando el token)
     * Este es el método principal para obtener el perfil del usuario logueado
     */
    obtenerMiPerfil(): Observable<any> {
        return this.http.get(`${this.apiUrl}/mi-perfil`).pipe(
            map((response: any) => {
                // Ajustar según la estructura de respuesta del backend
                return response.data || response;
            }),
            catchError((error) => {
                console.error('❌ Error al obtener perfil:', error);
                return of(null);
            })
        );
    }


    /**
     * Obtiene el perfil de un usuario por ID (solo admin/recepcionista)
     */
    obtenerPerfilPorId(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`).pipe(
            map((response: any) => response.data || response),
            catchError((error) => {
                console.error('❌ Error al obtener perfil por ID:', error);
                return of(null);
            })
        );
    }

    /**
     * Obtiene todos los perfiles de usuarios (solo admin/recepcionista)
     */
    obtenerTodosLosPerfiles(): Observable<any> {
        return this.http.get(`${this.apiUrl}`).pipe(
            map((response: any) => response.data || response),
            catchError((error) => {
                console.error('❌ Error al obtener todos los perfiles:', error);
                return of(null);
            })
        );
    }

    /**
     * Obtiene todos los perfiles de usuarios activos (solo admin/recepcionista)
     */
    obtenerTodosLosPerfilesActivos(): Observable<any> {
        return this.http.get(`${this.apiUrl}/activo`).pipe(
            map((response: any) => response.data || response),
            catchError((error) => {
                console.error('❌ Error al obtener perfiles activos:', error);
                return of(null);
            })
        );
    }

    /**
     * Actualiza el perfil de un usuario
     */
    actualizarPerfil(id: number, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data).pipe(
            catchError((error) => {
                console.error('❌ Error al actualizar perfil:', error);
                throw error;
            })
        );
    }

    /**
     * Cambia el estado de un perfil de usuario (solo admin/recepcionista)
     */
    cambiarEstadoPerfil(id: number, estado: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/estado?estado=${estado}`, {}).pipe(
            catchError((error) => {
                console.error('❌ Error al cambiar estado:', error);
                throw error;
            })
        );
    }

    /**
     * Verificar usuario en Auth (solo admin/recepcionista)
     */
    verificarUsuarioAuth(email: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/auth/verificar-usuario`, {
            params: { email }
        }).pipe(
            catchError((error) => {
                console.error('❌ Error al verificar usuario:', error);
                throw error;
            })
        );
    }
}