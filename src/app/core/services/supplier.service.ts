import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier, ApiResponseSuppliers } from '../../features/suppliers/models/suppliers.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = `${environment.apiUrl}/pg-ms-operation/api/proveedores`;

  constructor(private http: HttpClient) { }

  obtenerTodos(): Observable<Supplier[]> {
    return this.http.get<ApiResponseSuppliers<Supplier[]>>(`${this.apiUrl}/todos`).pipe(
      map(res => res.data || [])
    );
  }

  obtenerPorId(id: number): Observable<Supplier> {
    return this.http.get<ApiResponseSuppliers<Supplier>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  buscarPorNombre(nombre: string): Observable<Supplier[]> {
    const params = new HttpParams().set('nombre', nombre.trim());
    return this.http.get<ApiResponseSuppliers<Supplier[]>>(`${this.apiUrl}/buscar`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  registrarProveedor(proveedor: Supplier): Observable<ApiResponseSuppliers<any>> {
    return this.http.post<ApiResponseSuppliers<any>>(`${this.apiUrl}/registrar`, proveedor);
  }
}
