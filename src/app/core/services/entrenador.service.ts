import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Usuario {
    idUsuario: number;
    username: string;
    rol: string;
}

export interface RutinaDetalleEjercicio {
    idDetalle: number | null;
    idEjercicio: number;
    orden: number;
    series: number;
    notas: string;
    modificadoPor: string | null;
    nombreEjercicio: string;
    grupoMuscular: string;
    urlImagen: string;
    diaSemana: number;
    repeticionesMin: number;
    repeticionesMax: number;
    pesoSugerido: number;
    descansoSegundos: number;
    equipoRequerido?: string;
    semana?: number;
}

export interface RutinaDetalle {
    idRutina: number;
    nombre: string;
    descripcion: string;
    version: number;
    generadaPorIA: boolean;
    fechaGeneracion: string;
    explicacionIA: string;
    detalles: RutinaDetalleEjercicio[];
}

export interface HistorialVersion {
    idHistorial: number;
    version: number;
    datosJson: {
        idRutina: number;
        nombre: string;
        descripcion: string;
        version: number;
        generadaPorIA: boolean;
        fechaGeneracion: string;
        explicacionIA: string;
        detalles: any[];
    };
    modificadoPor: string;
    motivo: string;
    fechaModificacion: string;
}

@Injectable({
    providedIn: 'root'
})
export class EntrenadorService {

    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1`;

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('auth_token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    }

    getUsuarios(): Observable<Usuario[]> {
        const url = `${this.apiUrl}/usuarios`;
        return this.http.get<Usuario[]>(url, this.getHeaders()).pipe(
            catchError((error: HttpErrorResponse) => {
                console.error('Error en getUsuarios:', error);
                return of([]);
            })
        );
    }

    getRutinasSocio(idSocio: number | string): Observable<RutinaDetalle[]> {
        const url = `${this.apiUrl}/rutinas/socio/${idSocio}`;
        return this.http.get<RutinaDetalle[]>(url, this.getHeaders());
    }

    getMisRutinas(): Observable<RutinaDetalle[]> {
        const url = `${this.apiUrl}/rutinas/mis-rutinas`;
        return this.http.get<RutinaDetalle[]>(url, this.getHeaders());
    }

    getRutinaById(id: number | string): Observable<RutinaDetalle> {
        const url = `${this.apiUrl}/rutinas/${id}`;
        return this.http.get<RutinaDetalle>(url, this.getHeaders());
    }

    getHistorialRutina(idRutina: number | string): Observable<HistorialVersion[]> {
        const url = `${this.apiUrl}/rutinas/${idRutina}/historial`;
        return this.http.get<HistorialVersion[]>(url, this.getHeaders());
    }

    ajustarDetalle(idRutina: number | string, data: any): Observable<any> {
        const url = `${this.apiUrl}/rutinas/${idRutina}/ajustar`;
        return this.http.put<any>(url, data, this.getHeaders());
    }

    /**
     * Exporta la rutina de un socio a PDF (vista entrenador)
     * GET /pg-ms-users/api/v1/seguimiento/rutina/{idSocio}/exportar-pdf?idRutina={idRutina}
     */
    exportarRutinaSocioPDF(idSocio: number | string, idRutina: number | string): Observable<Blob> {
        const params = new HttpParams().set('idRutina', String(idRutina));
        const url = `${this.apiUrl}/seguimiento/rutina/${idSocio}/exportar-pdf`;

        return this.http.get(url, {
            headers: this.getHeaders().headers,
            params,
            responseType: 'blob'
        });
    }
}