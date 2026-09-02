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

export interface RespuestaPaginadaPerfiles {
    content?: any[];
    contenido?: any[];
    currentPage?: number;
    number?: number;
    numeroPagina?: number;
    size?: number;
    tamanioPagina?: number;
    totalElements?: number;
    totalElementos?: number;
    totalPages?: number;
    totalPaginas?: number;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios`;

    constructor(private http: HttpClient) { }

listarPerfilesPaginados(filtros: FiltrosPerfiles = {}): Observable<RespuestaPaginadaPerfiles> {
    let params = new HttpParams();

    if (filtros.busqueda) {
        params = params.set('busqueda', filtros.busqueda);
        params = params.set('search', filtros.busqueda); // Alias por compatibilidad
    }
    if (filtros.rol && filtros.rol !== 'todos') {
        params = params.set('rol', filtros.rol.toUpperCase());
    }
    if (filtros.estado && filtros.estado !== 'todos') {
        params = params.set('estado', filtros.estado.toUpperCase());
    }

    params = params.set('pagina', (filtros.pagina ?? 0).toString());
    params = params.set('page', (filtros.pagina ?? 0).toString());
    params = params.set('tamanio', (filtros.tamanio ?? 7).toString());
    params = params.set('size', (filtros.tamanio ?? 7).toString());

    return this.http.get<RespuestaPaginadaPerfiles>(this.apiUrl, { params }).pipe(
        catchError((error) => {
            console.error('❌ Error al listar perfiles paginados:', error);
            throw error;
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

    obtenerTodosLosPerfiles(): Observable<any> {
        return this.http.get(`${this.apiUrl}`).pipe(
            map((response: any) => response.data || response),
            catchError((error) => {
                console.error('❌ Error al obtener todos los perfiles:', error);
                return of(null);
            })
        );
    }

    obtenerTodosLosPerfilesActivos(): Observable<any> {
        return this.http.get(`${this.apiUrl}/activo`).pipe(
            map((response: any) => response.data || response),
            catchError((error) => {
                console.error('❌ Error al obtener perfiles activos:', error);
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
}