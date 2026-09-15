import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Ejercicio {
    idEjercicio: number;
    nombre: string;
    grupoMuscular: string;
    equipoNecesario: string;
    explicacionTecnica: string;
    urlImagen: string;
    dificultad: number;
    caloriasPorMinuto: number;
    activo: boolean;
}

export interface CrearEjercicioPayload {
    nombre: string;
    grupoMuscular: string;
    equipoNecesario: string;
    explicacionTecnica: string;
    urlImagen: string;
    dificultad: number;
    caloriasPorMinuto: number;
    activo: boolean;
}

export interface FiltrosEjercicios {
    nombre?: string;
    grupoMuscular?: string;
    dificultadMin?: number;
    dificultadMax?: number;
}

@Injectable({
    providedIn: 'root'
})
export class EjerciciosService {

    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/ejercicios`;

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('auth_token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    }

    /**
     * Lista todos los ejercicios con filtros opcionales
     * GET /ejercicios?grupoMuscular=PECHO&dificultadMin=2&dificultadMax=4&nombre=p
     */
    getEjercicios(filtros: FiltrosEjercicios = {}): Observable<any> {
        let params = new HttpParams();

        if (filtros.nombre) {
            params = params.set('nombre', filtros.nombre);
        }
        if (filtros.grupoMuscular) {
            params = params.set('grupoMuscular', filtros.grupoMuscular);
        }
        if (filtros.dificultadMin !== undefined && filtros.dificultadMin !== null) {
            params = params.set('dificultadMin', String(filtros.dificultadMin));
        }
        if (filtros.dificultadMax !== undefined && filtros.dificultadMax !== null) {
            params = params.set('dificultadMax', String(filtros.dificultadMax));
        }

        return this.http.get<any>(this.apiUrl, { ...this.getHeaders(), params });
    }

    /**
     * Buscar ejercicio por ID
     * GET /ejercicios/{id}
     */
    getEjercicioById(id: number): Observable<Ejercicio> {
        return this.http.get<Ejercicio>(`${this.apiUrl}/${id}`, this.getHeaders());
    }

    /**
     * Crear ejercicio
     * POST /ejercicios
     */
    crearEjercicio(payload: CrearEjercicioPayload): Observable<Ejercicio> {
        return this.http.post<Ejercicio>(this.apiUrl, payload, this.getHeaders());
    }

    /**
     * Actualizar ejercicio
     * PUT /ejercicios/{id}
     */
    actualizarEjercicio(id: number, payload: CrearEjercicioPayload): Observable<Ejercicio> {
        return this.http.put<Ejercicio>(`${this.apiUrl}/${id}`, payload, this.getHeaders());
    }

    /**
     * Eliminar ejercicio
     * DELETE /ejercicios/{id}
     */
    eliminarEjercicio(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getHeaders());
    }

    /**
     * Obtener grupos musculares disponibles
     * GET /ejercicios/grupos-musculares
     */
    getGruposMusculares(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/grupos-musculares`, this.getHeaders());
    }

    /**
     * Obtener equipos necesarios disponibles
     * GET /ejercicios/equipos
     */
    getEquipos(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/equipos`, this.getHeaders());
    }
}