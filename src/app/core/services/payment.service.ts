import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment, PaymentSummaryDTO, RegistrarPagoRequestDTO, AnularPagoRequestDTO, IngresosMensualesDTO, IngresosDiariosDTO } from '../models/payment';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/pagos`;
  private reportsApiUrl = `${environment.apiUrl}/pg-ms-reports/api/reportes/ingresos`;

  constructor(private http: HttpClient) { }

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


  obtenerIngresosDiarios(fecha: string): Observable<IngresosDiariosDTO> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<IngresosDiariosDTO>(`${this.reportsApiUrl}/diarios`, { params });
  }

  exportarIngresosDiariosPdf(fecha: string): Observable<Blob> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get(`${this.reportsApiUrl}/diarios/pdf`, { params, responseType: 'blob' });
  }

  exportarIngresosDiariosExcel(fecha: string): Observable<Blob> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get(`${this.reportsApiUrl}/diarios/excel`, { params, responseType: 'blob' });
  }

  obtenerIngresosMensuales(mes: number, anio: number): Observable<IngresosMensualesDTO> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());

    return this.http.get<IngresosMensualesDTO>(`${this.reportsApiUrl}/mensuales`, { params });
  }

  exportarIngresosMensualesPdf(mes: number, anio: number): Observable<Blob> {
    const params = new HttpParams().set('mes', mes.toString()).set('anio', anio.toString());
    return this.http.get(`${this.reportsApiUrl}/mensuales/pdf`, { params, responseType: 'blob' });
  }

  exportarIngresosMensualesExcel(mes: number, anio: number): Observable<Blob> {
    const params = new HttpParams().set('mes', mes.toString()).set('anio', anio.toString());
    return this.http.get(`${this.reportsApiUrl}/mensuales/excel`, { params, responseType: 'blob' });
  }
}