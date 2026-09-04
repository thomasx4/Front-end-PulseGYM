import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Payment, PaymentSummaryDTO } from '../models/payment';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/pg-ms-payments/api/v1/pagos`;

  constructor(private http: HttpClient) { }

  getPaginados(
    page: number = 0,
    size: number = 7,
    estado?: string,
    metodoPago?: string,
    tipoPago?: string,
    fechaInicio?: string,
    fechaFin?: string,
    search?: string,
    sortBy: string = 'fechaPago',
    direction: string = 'desc'
  ): Observable<any> {
    let params = new HttpParams()
      .set('pagina', page)
      .set('tamanio', size)
      .set('sortBy', sortBy)
      .set('direction', direction);

    if (estado && estado !== 'TODOS') params = params.set('estado', estado);
    if (metodoPago && metodoPago !== 'TODOS') params = params.set('metodoPago', metodoPago);
    if (tipoPago && tipoPago !== 'TODOS') params = params.set('tipoPago', tipoPago);
    if (fechaInicio) params = params.set('fechaInicio', `${fechaInicio}T00:00:00`);
    if (fechaFin) params = params.set('fechaFin', `${fechaFin}T23:59:59`);
    if (search && search.trim() !== '') params = params.set('search', search.trim());

    return this.http.get<any>(`${this.apiUrl}/paginados`, { params });
  }

  getResumen(): Observable<PaymentSummaryDTO> {
    return this.http.get<PaymentSummaryDTO>(`${this.apiUrl}/resumen`);
  }

  getById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }
}