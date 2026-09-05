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
    pagePorVencer?: number;
    sizePorVencer?: number;
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

export interface DashboardResponse {
    membresiasPaginadas: PageResponse<MembresiaDashboard>;
    membresiasPorVencer: PageResponse<any>;
    usuariosActivos?: any[];
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

export interface MembresiaDashboard {
    idMembresia: number;
    nombre: string;
    precioTotal: number;
    incluyeIA: boolean;
    esFlexible: boolean;
    sociosAsignados: SocioAsignado[];
    totalSociosAsignados: number;
}

export interface SocioAsignado {
    idSocioMembresia: number;
    idSocio: number;
    nombreCompleto: string;
    email: string;
    telefono: string;
    precioTotal: number;
    precioReal: number;
    esFlexible: boolean;
    precioPorDia: number;
    cantidadDias: number;
    tipoMembresiaDescripcion: string;
    fechaInicio: string;
    fechaVencimiento: string;
    estado: string;
    diasRestantes: number;
    estaActiva: boolean;
    estaVencida: boolean;
    observaciones: string;
    fechaCreacion: string;
    fechaActualizacion: string;
    fotoUrl?: string | null;
    avatarUrl?: string;
    membresia?: {
        idMembresia: number;
        nombre: string;
        incluyeIA: boolean;
        esFlexible: boolean;
    };
}

@Injectable({
    providedIn: 'root',
})
export class MembershipService {
    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1`;

    constructor(private http: HttpClient) { }

    getSociosAsignadosPaginados(
        idMembresia: number,
        page: number = 0,
        size: number = 6,
        busqueda?: string
    ): Observable<PageResponse<SocioAsignado>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (busqueda) {
            params = params.set('busqueda', busqueda);
        }

        return this.http.get<PageResponse<SocioAsignado>>(
            `${this.apiUrl}/socios-membresias/membresia/${idMembresia}/socios-paginados`,
            { params }
        );
    }

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
            if (filtros.pagePorVencer !== undefined && filtros.pagePorVencer !== null) {
                params = params.set('pagePorVencer', filtros.pagePorVencer.toString());
            }
            if (filtros.sizePorVencer !== undefined && filtros.sizePorVencer !== null) {
                params = params.set('sizePorVencer', filtros.sizePorVencer.toString());
            }
        }

        return this.http.get(`${this.apiUrl}/membresias/dashboard`, { params });
    }

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

    getPorVencer(): Observable<any> {
        return this.http.get(`${this.apiUrl}/socios-membresias/por-vencer`);
    }

    getPorVencerRango(diasMinimo: number, diasMaximo: number): Observable<any> {
        return this.http.get(
            `${this.apiUrl}/socios-membresias/por-vencer/rango?diasMinimo=${diasMinimo}&diasMaximo=${diasMaximo}`
        );
    }

    getSociosActivosPaginadosServer(filtros: FiltrosSociosMembresias = {}): Observable<PageResponse<SocioAsignado>> {
        let params = new HttpParams();
        params = params.set('page', (filtros.pagina ?? 0).toString());
        params = params.set('size', (filtros.tamanio ?? 6).toString());
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
        return this.http.get<PageResponse<SocioAsignado>>(
            `${this.apiUrl}/socios-membresias/socios-activos-paginados`,
            { params }
        );
    }
}