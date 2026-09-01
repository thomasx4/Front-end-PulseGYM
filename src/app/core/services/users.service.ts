import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import {
  WeekDay,
  Routine,
  Exercise,
  WeeklySummary,
  DashboardSocioResponse
} from '../../features/user/models/user.module';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private getJsonHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  getDashboardSocio(): Observable<DashboardSocioResponse> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/seguimiento/dashboard/mi-progreso`;
    return this.http.get<DashboardSocioResponse>(url, { headers: this.getHeaders() });
  }

  getMisRutinas(): Observable<any> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/rutinas/mis-rutinas`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  getMisPlanesNutricionales(): Observable<any[]> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/planes-nutricionales/mis-planes`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  getCaloriasDiarias(): Observable<number> {
    return this.getMisPlanesNutricionales().pipe(
      map((planes) => {
        if (planes && planes.length > 0) {
          const planActual = planes[0];
          return planActual.calorias_diarias || 0;
        }
        return 0;
      })
    );
  }

  getTodayRoutine(): Observable<Routine> {
    const today = new Date().getDay();
    const diaSemana = today === 0 ? 7 : today;

    console.log('Dia de la semana:', diaSemana);

    return this.getMisRutinas().pipe(
      map((response) => {
        let detalles = [];
        let nombreRutina = 'Rutina del dia';

        if (Array.isArray(response) && response.length > 0) {
          const primerElemento = response[0];
          if (primerElemento.detalles && Array.isArray(primerElemento.detalles)) {
            detalles = primerElemento.detalles;
            nombreRutina = primerElemento.nombre || 'Rutina del dia';
          }
        } else if (response && response.detalles) {
          detalles = response.detalles;
          nombreRutina = response.nombre || 'Rutina del dia';
        } else {
          return {
            nombre: 'Sin rutina programada',
            duracion: '--',
            dateStr: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
            ejercicios: []
          };
        }

        const detallesFiltrados = detalles.filter(
          (detalle: any) => detalle.diaSemana === diaSemana
        );

        const ejercicios: Exercise[] = detallesFiltrados.map((detalle: any) => ({
          nombre: detalle.nombreEjercicio || 'Ejercicio',
          sets: (detalle.series || 0) + ' series x ' + (detalle.repeticionesMin || 0) + ' - ' + (detalle.repeticionesMax || 0) + ' repeticiones',
          imageUrl: detalle.urlImagen || '',
          grupoMuscular: detalle.grupoMuscular,
          peso: detalle.pesoSugerido,
          descanso: detalle.descansoSegundos,
          notas: detalle.notas
        }));

        return {
          nombre: nombreRutina,
          duracion: '60 - 75 min',
          dateStr: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
          ejercicios: ejercicios
        };
      })
    );
  }

  getWeekDays(): Observable<WeekDay[]> {
    const days: WeekDay[] = [
      { name: 'Lun', active: false, dayNumber: 1 },
      { name: 'Mar', active: false, dayNumber: 2 },
      { name: 'Mie', active: false, dayNumber: 3 },
      { name: 'Jue', active: false, dayNumber: 4 },
      { name: 'Vie', active: false, dayNumber: 5 },
      { name: 'Sab', active: false, dayNumber: 6 },
      { name: 'Dom', active: false, dayNumber: 7 }
    ];
    return of(days);
  }

  getUserProfile(): Observable<any> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/usuarios/mi-perfil`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getUserProfile:', error);
        return of(null);
      })
    );
  }

  updateUserProfile(data: any): Observable<any> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/usuarios/mi-perfil`;
    return this.http.put<any>(url, data, { headers: this.getJsonHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en updateUserProfile:', error);
        return of(null);
      })
    );
  }

  getPerfilMedico(): Observable<any> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/usuarios/perfil-medico/mi-perfil-medico`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getPerfilMedico:', error);
        return of(null);
      })
    );
  }

  getHistorialFisico(): Observable<any> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/usuarios/historial-fisico/mi-historial`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getHistorialFisico:', error);
        return of(null);
      })
    );
  }

  getEvolucion(): Observable<any> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/usuarios/historial-fisico/mi-evolucion`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getEvolucion:', error);
        return of(null);
      })
    );
  }

  getMiMembresia(): Observable<any> {
    const url = `${this.apiUrl}/pg-ms-users/api/v1/socios-membresias/estado/mi-membresia`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getMiMembresia:', error);
        return of(null);
      })
    );
  }

}