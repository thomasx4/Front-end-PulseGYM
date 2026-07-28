import { Injectable } from '@angular/core';
import { AuthCredentials } from '../models/auth/auth.module';
import { AuthResponse } from '../models/auth/auth.module';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = '';

  constructor(private http: HttpClient) { }

  register(data: AuthCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl + 'auth/register', data);
  }

  login(data: AuthCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl + 'auth/login', data);
  }

  
}
