import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// INTERFACES

export interface AsignacionRequest {
    idSocio: number;
    idMembresia: number;
    observaciones?: string;
}

export interface AsignacionFlexibleRequest {
    idSocio: number;
    idMembresia: number;
    cantidadDias: number;
    observaciones?: string;
}

export interface RenovarRequest {
    idSocioMembresia: number;
    renovacionAutomatica?: boolean;
    cantidadDias?: number;
    observaciones?: string;
}

export interface SuspenderRequest {
    idSocioMembresia: number;
    motivo: string;
}

export interface CancelarRequest {
    idSocioMembresia: number;
    motivo: string;
}

@Injectable({
    providedIn: 'root',
})
export class MembershipService {
    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1`;

    constructor(private http: HttpClient) { }

    getDashboardMembresias(page: number = 0, size: number = 6): Observable<any> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get(`${this.apiUrl}/membresias/dashboard`, { params });
    }

    /**
     * Obtiene todas las membresías activas
     */
    getMembresias(): Observable<any> {
        return this.http.get(`${this.apiUrl}/membresias`);
    }

    /**
     * Obtiene una membresía por ID (siempre devuelve la membresía, incluso sin socios)
     */
    getMembresiaById(idMembresia: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/membresias/${idMembresia}`);
    }
    
    /**
     * Obtiene todas las membresías con sus socios activos asignados
     */
    getMembresiasConSocios(): Observable<any> {
        return this.http.get(`${this.apiUrl}/membresias/todos-con-socios-activos`);
    }

    /**
     * Obtiene una membresía con sus socios ACTIVOS asignados
     */
    getMembresiaConSociosActivos(idMembresia: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/membresias/${idMembresia}/socios-activos`);
    }

    /**
     * Obtiene membresías filtradas por categoría (IA)
     */
    getMembresiasPorCategoria(incluyeIA: boolean): Observable<any> {
        return this.http.get(`${this.apiUrl}/membresias/categoria?incluyeIA=${incluyeIA}`);
    }

    /**
     * Crea una nueva membresía
     */
    crearMembresia(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/membresias`, data);
    }

    /**
     * Actualiza una membresía existente
     */
    actualizarMembresia(id: number, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/membresias/${id}`, data);
    }

    /**
     * Elimina/desactiva una membresía
     */
    eliminarMembresia(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/membresias/${id}`);
    }

    // 3. USUARIOS (SOCIOS)

    /**
     * Obtiene todos los usuarios activos para asignar membresía
     */
    getUsuariosActivos(): Observable<any> {
        return this.http.get(`${this.apiUrl}/usuarios/activo`);
    }

    // 4. ASIGNACIÓN DE MEMBRESÍAS

    /**
     * Asigna una membresía a un socio
     */
    asignarMembresia(request: AsignacionRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/socios-membresias/asignar`, request);
    }

    /**
     * Asigna una membresía flexible a un socio
     */
    asignarMembresiaFlexible(request: AsignacionFlexibleRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/socios-membresias/asignar-flexible`, request);
    }

    /**
     * Consulta las membresías de un socio
     */
    getMembresiasSocio(idSocio: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/socios-membresias/socio/${idSocio}`);
    }

    /**
     * Consulta la membresía activa de un socio
     */
    getMembresiaActivaSocio(idSocio: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/socios-membresias/socio/${idSocio}/activa`);
    }

    // 5. OPERACIONES SOBRE MEMBRESÍAS DE SOCIOS

    /**
     * Renueva una membresía (PUT)
     */
    renovarMembresia(request: RenovarRequest): Observable<any> {
        return this.http.put(`${this.apiUrl}/socios-membresias/renovar`, request);
    }

    /**
     * Suspende una membresía (PUT)
     */
    suspenderMembresia(request: SuspenderRequest): Observable<any> {
        return this.http.put(`${this.apiUrl}/socios-membresias/suspender`, request);
    }

    /**
     * Cancela una membresía (DELETE)
     */
    cancelaMembresia(request: CancelarRequest): Observable<any> {
        const motivoEncoded = encodeURIComponent(request.motivo);
        return this.http.delete(
            `${this.apiUrl}/socios-membresias/${request.idSocioMembresia}/cancelar?motivo=${motivoEncoded}`
        );
    }

    // 6. REPORTES

    /**
     * Obtiene membresías por vencer (1-5 días)
     */
    getPorVencer(): Observable<any> {
        return this.http.get(`${this.apiUrl}/socios-membresias/por-vencer`);
    }

    /**
     * Obtiene membresías por vencer con rango de días
     */
    getPorVencerRango(diasMinimo: number, diasMaximo: number): Observable<any> {
        return this.http.get(
            `${this.apiUrl}/socios-membresias/por-vencer/rango?diasMinimo=${diasMinimo}&diasMaximo=${diasMaximo}`
        );
    }
}