import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
    providedIn: 'root'
})
export class MedicalProfileService {
    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/perfil-medico`;

    constructor(private http: HttpClient) { }

    listarPerfilesPaginados(busqueda?: string, page: number = 0, size: number = 10): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (busqueda && busqueda.trim()) {
            params = params.set('busqueda', busqueda.trim());
        }

        return this.http.get<any>(this.apiUrl, { params });
    }

    consultarPerfilPorId(idSocio: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${idSocio}`);
    }

    consultarMiPerfil(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/mi-perfil-medico`);
    }

    registrarPerfil(data: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, data);
    }

    actualizarPerfil(idSocio: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${idSocio}`, data);
    }

    actualizarMiPerfil(data: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/mi-perfil-medico`, data);
    }

    eliminarPerfil(idSocio: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${idSocio}`);
    }
}