import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TrainerDashboard } from '../../features/trainer/models/trainer.model';

@Injectable({
  providedIn: 'root'
})
export class TrainerService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getTrainerDashboard(entrenadorId: number, socioIdSeleccionado?: number): Observable<TrainerDashboard | null> {
    let url = `${this.apiUrl}/pg-ms-users/api/v1/dashboard/entrenador/${entrenadorId}`;

    let params = new HttpParams();
    if (socioIdSeleccionado) {
      params = params.set('socioIdSeleccionado', socioIdSeleccionado.toString());
    }

    return this.http.get<TrainerDashboard>(url, { headers: this.getHeaders(), params }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getTrainerDashboard:', error);
        return of(null);
      })
    );
  }

  getSociosAsignados(entrenadorId: number = 1): Observable<any[]> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/entrenador/socios/${entrenadorId}`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getSociosAsignados:', error);
        return of([]);
      })
    );
  }
}