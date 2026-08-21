import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios`;

    constructor(private http: HttpClient) { }

    /**
     * Completa el perfil de un usuario
     * POST /pg-ms-users/api/v1/usuarios/completar-perfil
     */
    completarPerfil(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/completar-perfil`, data);
    }

    /**
     * Obtiene el perfil de un usuario por email
     * GET /pg-ms-users/api/v1/usuarios/email/{email}
     */
    obtenerPerfilPorEmail(email: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/email/${email}`);
    }

    /**
     * Obtiene el perfil de un usuario por ID
     * GET /pg-ms-users/api/v1/usuarios/{id}
     */
    obtenerPerfilPorId(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    /**
     * Obtiene todos los perfiles de usuarios
     * GET /pg-ms-users/api/v1/usuarios
     */
    obtenerTodosLosPerfiles(): Observable<any> {
        return this.http.get(`${this.apiUrl}`);
    }

    /**
     * Actualiza el perfil de un usuario
     * PUT /pg-ms-users/api/v1/usuarios/{id}
     */
    actualizarPerfil(id: number, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    /**
     * Cambia el estado de un perfil de usuario
     * PATCH /pg-ms-users/api/v1/usuarios/{id}/estado
     */
    cambiarEstadoPerfil(id: number, estado: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/estado?estado=${estado}`, {});
    }
}