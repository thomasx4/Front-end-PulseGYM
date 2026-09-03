import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';

export interface FiltrosPerfiles {
    pagina?: number;
    tamanio?: number;
    busqueda?: string;
    rol?: string;
    estado?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface UsuarioPerfilResponseDTO {
    idUsuario: number;
    nombre: string;
    apellido: string;
    email: string;
    sexo?: string;
    telefono?: string;
    documentoIdentidad?: string;
    fotoUrl?: string;
    fechaContratacion?: string;
    especialidad?: string;
    anosExperiencia?: number;
    horarioDisponibilidad?: string;
    tarifaHora?: number;
    turno?: string;
    fechaNacimiento?: string;
    contactoEmergenciaNombre?: string;
    contactoEmergenciaTelefono?: string;
    objetivoPrincipal?: string;
    nivelExperiencia?: string;
    fechaRegistro?: string;
    idSede?: number;
    estado: string;
    biometricDeviceId?: string;
    rol?: string;
    username?: string;
    nombreCompleto?: string;
    fechaCreacion?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios`;

    constructor(private http: HttpClient) { }

    listarPerfilesPaginados(filtros: FiltrosPerfiles = {}): Observable<PageResponse<UsuarioPerfilResponseDTO>> {
        let params = new HttpParams()
            .set('page', (filtros.pagina ?? 0).toString())
            .set('size', (filtros.tamanio ?? 10).toString());

        if (filtros.estado && filtros.estado !== 'todos') {
            params = params.set('estado', filtros.estado.toUpperCase());
        }

        if (filtros.busqueda) {
            params = params.set('busqueda', filtros.busqueda);
        }

        return this.http.get<PageResponse<UsuarioPerfilResponseDTO>>(
            `${this.apiUrl}/paginados`,
            { params }
        ).pipe(
            catchError((error) => {
                console.error('❌ Error al listar perfiles paginados:', error);
                throw error;
            })
        );
    }

    obtenerTodosLosUsuariosActivos(): Observable<UsuarioPerfilResponseDTO[]> {
        return this.http.get<UsuarioPerfilResponseDTO[]>(`${this.apiUrl}/activo`).pipe(
            map((response: any) => response.data || response || []),
            catchError((error) => {
                console.error('❌ Error al obtener perfiles activos:', error);
                return of([]);
            })
        );
    }

    obtenerTodosLosPerfiles(): Observable<UsuarioPerfilResponseDTO[]> {
        return this.http.get<UsuarioPerfilResponseDTO[]>(`${this.apiUrl}`).pipe(
            map((response: any) => response.data || response || []),
            catchError((error) => {
                console.error('❌ Error al obtener todos los perfiles:', error);
                return of([]);
            })
        );
    }

    completarPerfil(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/completar-perfil`, data);
    }

    obtenerMiPerfil(): Observable<any> {
        return this.http.get(`${this.apiUrl}/mi-perfil`).pipe(
            map((response: any) => response.data || response),
            catchError((error) => {
                console.error('❌ Error al obtener perfil:', error);
                return of(null);
            })
        );
    }

    obtenerPerfilPorId(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`).pipe(
            map((response: any) => response.data || response),
            catchError((error) => {
                console.error('❌ Error al obtener perfil por ID:', error);
                return of(null);
            })
        );
    }

    actualizarPerfil(id: number, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data).pipe(
            catchError((error) => {
                console.error('❌ Error al actualizar perfil:', error);
                throw error;
            })
        );
    }

    cambiarEstadoPerfil(id: number, estado: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/estado?estado=${estado}`, {}).pipe(
            catchError((error) => {
                console.error('❌ Error al cambiar estado:', error);
                throw error;
            })
        );
    }

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

    listarPerfiles(filtros?: FiltrosPerfiles): Observable<any> {
        return this.listarPerfilesPaginados(filtros || {});
    }
}