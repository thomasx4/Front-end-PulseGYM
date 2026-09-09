import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenizedPaymentRequest, FiltroPagosRequest } from '../../features/user/models/user-pagos.model';

@Injectable({
    providedIn: 'root'
})
export class UserPaymentService {
    private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/pagos`;

    constructor(private http: HttpClient) { }

    procesarPagoToken(request: TokenizedPaymentRequest): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/pago-app-token`, request);
    }

    obtenerMiHistorialPagos(page: number = 0, size: number = 10): Observable<any> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<any>(`${this.apiUrl}/mi-historial-pagos`, { params });
    }

    filtrarMisPagosPaginados(filtro: FiltroPagosRequest, userRol: string = 'socio', userEmail: string = ''): Observable<any> {
        const headers = {
            'X-User-Rol': userRol,
            'X-User-Email': userEmail
        };
        return this.http.post<any>(`${this.apiUrl}/mis-pagos/filtrar-paginado`, filtro, { headers });
    }

    descargarComprobantePDFPropio(idPago: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/mi-comprobante/${idPago}/pdf`, {
            responseType: 'blob'
        });
    }
}