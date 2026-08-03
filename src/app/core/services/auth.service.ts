import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CredencialesListado, RegisterRequestDTO, MessageGlobalDTO, HttpGlobalResponse } from '../../features/auth/models/auth/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/pg-ms-auth/auth`;

  constructor(private http: HttpClient) { }

  registerCredentials(datos: RegisterRequestDTO): Observable<MessageGlobalDTO> {
    return this.http.post<MessageGlobalDTO>(`${this.apiUrl}/register`, datos);
  }

  listarCredenciales(): Observable<HttpGlobalResponse<CredencialesListado[]>> {
    return this.http.get<HttpGlobalResponse<CredencialesListado[]>>(`${this.apiUrl}/usuarios`);
  }

  cambiarEstado(id: number, nuevoEstado: boolean): Observable<MessageGlobalDTO> {
  return this.http.put<MessageGlobalDTO>(
    `${this.apiUrl}/usuarios/estado/${id}`,
    { estado: nuevoEstado }
  );
}
}
