// src/app/core/services/sede.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SedeService {
  private apiUrl = `${environment.apiUrl}/pg-ms-operation/api/sedes`;

  constructor(private http: HttpClient) {}

  obtenerSedes(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }
}