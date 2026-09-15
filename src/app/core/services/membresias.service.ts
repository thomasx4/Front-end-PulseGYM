import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Membresia {
  idMembresia: number;
  nombre: string;
  precioTotal: number;
  cantidad: number;
  tipoDuracion: string;        // "MES" | "DIA"
  duracionDescripcion: string; // "1 meses" | "4 días"
  incluyeIA: boolean;
  esFlexible: boolean;
  precioPorDia: number;
  beneficios: string;          // "Acceso por 1 mes" o "Asistente ia, 3 meses..."
  restricciones: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MembresiasService {

  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/membresias`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Lista todas las membresías
   * GET /membresias
   */
  getMembresias(): Observable<Membresia[]> {
    return this.http.get<Membresia[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getMembresias:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene una membresía por ID
   * GET /membresias/{id}
   */
  getMembresiaById(id: number): Observable<Membresia | null> {
    return this.http.get<Membresia>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getMembresiaById:', error);
        return of(null);
      })
    );
  }
}