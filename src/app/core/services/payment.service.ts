import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment, PaymentSummaryDTO, RegistrarPagoRequestDTO, AnularPagoRequestDTO } from '../models/payment';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/pagos`;

  constructor(private http: HttpClient) {}

  filtrarPagosPaginados(filtro: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/filtrar-paginado`, filtro);
  }

  getResumen(): Observable<PaymentSummaryDTO> {
    return this.http.get<PaymentSummaryDTO>(`${this.apiUrl}/resumen`);
  }

  registrarPago(request: RegistrarPagoRequestDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registrar`, request);
  }

  anularPago(request: AnularPagoRequestDTO): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/anular`, request);
  }

  descargarComprobantePDF(idPago: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/comprobante/${idPago}/pdf`, {
      responseType: 'blob'
    });
  }
}