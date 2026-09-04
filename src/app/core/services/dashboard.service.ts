import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface DashboardResumenDTO {
    totalUsuarios: number;
    usuariosActivos: number;
    usuariosInactivos: number;
    nuevosDelMes: number;
    afluenciaHoy?: {
        totalSocios?: number;
        mensaje?: string;
    };
    afluenciaAyer?: {
        totalSocios?: number;
        mensaje?: string;
    };
    totalEquipos?: number;
    equiposEnMantenimiento?: number;
    equiposCriticos?: any[];
    ingresosSeisMeses?: {
        meses?: Array<{
            mes: number;
            anio: number;
            totalGeneral: number;
            detalle: any[];
        }>;
        totalAcumulado?: number;
    };
    membresiasPorVencer?: any[];
}

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private usersApi = `${environment.apiUrl}/pg-ms-users/api/v1`;

    constructor(private http: HttpClient) { }

    getDashboardResumen(): Observable<DashboardResumenDTO> {
        return this.http.get<DashboardResumenDTO>(`${this.usersApi}/dashboard/resumen`);
    }
}