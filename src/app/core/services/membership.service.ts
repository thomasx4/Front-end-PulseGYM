import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface FiltrosMembresias {
    pagina?: number;
    tamanio?: number;
    busqueda?: string;
    tipo?: string;
    esFlexible?: boolean;
}

export interface FiltrosSociosMembresias {
    pagina?: number;
    tamanio?: number;
    busqueda?: string;
    incluyeIA?: boolean;
    esFlexible?: boolean;
    idMembresia?: number;
}

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

    /**
     * Obtiene el dashboard con paginación del Backend para socios/membresías
     */
    getDashboardMembresias(filtros?: FiltrosSociosMembresias): Observable<any> {
        let params = new HttpParams();

        if (filtros) {
            if (filtros.pagina !== undefined && filtros.pagina !== null) {
                params = params.set('page', filtros.pagina.toString());
            }
            if (filtros.tamanio !== undefined && filtros.tamanio !== null) {
                params = params.set('size', filtros.tamanio.toString());
            }
            if (filtros.busqueda) {
                params = params.set('busqueda', filtros.busqueda);
            }
            if (filtros.incluyeIA !== undefined && filtros.incluyeIA !== null) {
                params = params.set('incluyeIA', filtros.incluyeIA.toString());
            }
            if (filtros.esFlexible !== undefined && filtros.esFlexible !== null) {
                params = params.set('esFlexible', filtros.esFlexible.toString());
            }
            if (filtros.idMembresia) {
                params = params.set('idMembresia', filtros.idMembresia.toString());
            }
        }

        return this.http.get(`${this.apiUrl}/membresias/dashboard`, { params });
    }

    /**
     * Obtiene los planes de membresías paginados desde el Backend
     */
    getMembresias(filtros?: FiltrosMembresias): Observable<any> {
        let params = new HttpParams();

        if (filtros) {
            if (filtros.pagina !== undefined && filtros.pagina !== null) {
                params = params.set('page', filtros.pagina.toString());
            }
            if (filtros.tamanio !== undefined && filtros.tamanio !== null) {
                params = params.set('size', filtros.tamanio.toString());
            }
            if (filtros.busqueda) {
                params = params.set('busqueda', filtros.busqueda);
            }
            if (filtros.tipo && filtros.tipo !== 'todos') {
                params = params.set('tipo', filtros.tipo);
            }
            if (filtros.esFlexible !== undefined && filtros.esFlexible !== null) {
                params = params.set('esFlexible', filtros.esFlexible.toString());
            }
        }

        return this.http.get(`${this.apiUrl}/membresias`, { params });
    }

    getMembresiaById(idMembresia: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/membresias/${idMembresia}`);
    }

    getMembresiasConSocios(): Observable<any> {
        return this.http.get(`${this.apiUrl}/membresias/todos-con-socios-activos`);
    }

    /**
     * Obtiene los socios activos de una membresía específica con soporte para paginación
     */
    getMembresiaConSociosActivos(
        idMembresia: number,
        filtros?: { pagina?: number; tamanio?: number; busqueda?: string }
    ): Observable<any> {
        let params = new HttpParams();

        if (filtros) {
            if (filtros.pagina !== undefined && filtros.pagina !== null) {
                params = params.set('page', filtros.pagina.toString());
            }
            if (filtros.tamanio !== undefined && filtros.tamanio !== null) {
                params = params.set('size', filtros.tamanio.toString());
            }
            if (filtros.busqueda) {
                params = params.set('busqueda', filtros.busqueda);
            }
        }

        return this.http.get(`${this.apiUrl}/membresias/${idMembresia}/socios-activos`, { params });
    }

    getMembresiasPorCategoria(incluyeIA: boolean): Observable<any> {
        return this.http.get(`${this.apiUrl}/membresias/categoria?incluyeIA=${incluyeIA}`);
    }

    crearMembresia(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/membresias`, data);
    }

    actualizarMembresia(id: number, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/membresias/${id}`, data);
    }

    eliminarMembresia(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/membresias/${id}`);
    }

    // USUARIOS ACTIVOS CON PAGINACIÓN Y BÚSQUEDA REMOTA
    getUsuariosActivos(filtros?: { pagina?: number; tamanio?: number; busqueda?: string }): Observable<any> {
        let params = new HttpParams();

        if (filtros) {
            if (filtros.pagina !== undefined && filtros.pagina !== null) {
                params = params.set('page', filtros.pagina.toString());
            }
            if (filtros.tamanio !== undefined && filtros.tamanio !== null) {
                params = params.set('size', filtros.tamanio.toString());
            }
            if (filtros.busqueda) {
                params = params.set('busqueda', filtros.busqueda);
            }
        }

        return this.http.get(`${this.apiUrl}/usuarios/activo`, { params });
    }

    // ASIGNACIÓN
    asignarMembresia(request: AsignacionRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/socios-membresias/asignar`, request);
    }

    asignarMembresiaFlexible(request: AsignacionFlexibleRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/socios-membresias/asignar-flexible`, request);
    }

    getMembresiasSocio(idSocio: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/socios-membresias/socio/${idSocio}`);
    }

    getMembresiaActivaSocio(idSocio: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/socios-membresias/socio/${idSocio}/activa`);
    }

    // OPERACIONES
    renovarMembresia(request: RenovarRequest): Observable<any> {
        return this.http.put(`${this.apiUrl}/socios-membresias/renovar`, request);
    }

    suspenderMembresia(request: SuspenderRequest): Observable<any> {
        return this.http.put(`${this.apiUrl}/socios-membresias/suspender`, request);
    }

    cancelaMembresia(request: CancelarRequest): Observable<any> {
        const motivoEncoded = encodeURIComponent(request.motivo);
        return this.http.delete(
            `${this.apiUrl}/socios-membresias/${request.idSocioMembresia}/cancelar?motivo=${motivoEncoded}`
        );
    }

    // REPORTES
    getPorVencer(): Observable<any> {
        return this.http.get(`${this.apiUrl}/socios-membresias/por-vencer`);
    }

    getPorVencerRango(diasMinimo: number, diasMaximo: number): Observable<any> {
        return this.http.get(
            `${this.apiUrl}/socios-membresias/por-vencer/rango?diasMinimo=${diasMinimo}&diasMaximo=${diasMaximo}`
        );
    }
}