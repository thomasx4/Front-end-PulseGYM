import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class DashboardService {

    // URLs DE LOS MICROSERVICIOS
    private usersApi = `${environment.apiUrl}/pg-ms-users/api/v1`;
    private operationApi = `${environment.apiUrl}/pg-ms-operation/api`;
    private reportsApi = `${environment.apiUrl}/pg-ms-reports/api/reportes`;

    constructor(private http: HttpClient) { }

    // USUARIOS (pg-ms-users)
    getTotalUsuarios(): Observable<any> {
        return this.http.get(`${this.usersApi}/usuarios`);
    }

    getUsuariosActivos(): Observable<any> {
        return this.http.get(`${this.usersApi}/usuarios/activo`);
    }

    getUsuariosInactivos(): Observable<any> {
        return this.http.get(`${this.usersApi}/usuarios/inactivo`);
    }

    getNuevosDelMes(): Observable<any> {
        const fechaInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const params = new HttpParams().set('fechaCreacion', fechaInicio.toISOString().split('T')[0]);
        return this.http.get(`${this.usersApi}/usuarios`, { params });
    }

    // INGRESOS (pg-ms-reports)
    getIngresosMensuales(mes: number, anio: number): Observable<any> {
        return this.http.get(`${this.reportsApi}/ingresos/mensuales?mes=${mes}&anio=${anio}`);
    }

    getIngresosDiarios(fecha: string): Observable<any> {
        return this.http.get(`${this.reportsApi}/ingresos/diarios?fecha=${fecha}`);
    }

    getIngresosPorMembresia(fechaInicio: string, fechaFin: string): Observable<any> {
        return this.http.get(
            `${this.reportsApi}/ingresos/por-membresia?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
        );
    }

    // ASISTENCIA (pg-ms-reports)
    getAfluenciaHoy(): Observable<any> {
        return this.http.get(`${this.reportsApi}/afluencia/hoy`);
    }

    getTendencia(tipoReporte: string, fechaReferencia: string): Observable<any> {
        return this.http.get(
            `${this.reportsApi}/tendencia?tipoReporte=${tipoReporte}&fechaReferencia=${fechaReferencia}`
        );
    }

    getAfluenciaPorFecha(fecha: string): Observable<any> {
        return this.http.get(`${this.reportsApi}/afluencia/socios-por-dia?fecha=${fecha}`);
    }

    // MORA / POR VENCER (pg-ms-reports)
    getSociosEnMora(fechaInicio?: string, fechaFin?: string): Observable<any> {
        let url = `${this.reportsApi}/mora`;
        if (fechaInicio && fechaFin) {
            url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
        }
        return this.http.get(url);
    }

    // EQUIPOS (pg-ms-operation)
    getEstadoEquipos(): Observable<any> {
        return this.http.get(`${this.operationApi}/equipos/todos`);
    }

    // ASISTENCIA (pg-ms-operation)
    getAsistenciasHoy(): Observable<any> {
        return this.http.get(`${this.operationApi}/asistencias/hoy`);
    }
}