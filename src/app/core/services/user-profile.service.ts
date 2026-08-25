import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserProfile, UserDocument, MedicalProfile, PhysicalRecord, MembershipInfo } from '../../features/user/models/user-profile.module';

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {
    private apiUrl = `${environment.apiUrl}/pg-ms-auth/auth`;

    constructor(private http: HttpClient) { }

    // 1. Obtener y completar perfil
    getProfile(): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/perfil`);
    }
    updateProfile(data: UserProfile): Observable<any> {
        return this.http.put(`${this.apiUrl}/completar-perfil`, data);
    }

    // 2. Obtener documentos
    getDocuments(): Observable<UserDocument[]> {
        return this.http.get<UserDocument[]>(`${this.apiUrl}/documentos`);
    }
    downloadDocument(url: string): void {
        window.open(url, '_blank');
    }

    // 3. Obtener perfil médico
    getMedicalProfile(): Observable<MedicalProfile> {
        return this.http.get<MedicalProfile>(`${this.apiUrl}/perfil-medico`);
    }

    // 4. Obtener historial físico
    getPhysicalHistory(): Observable<PhysicalRecord[]> {
        return this.http.get<PhysicalRecord[]>(`${this.apiUrl}/historial-fisico`);
    }

    // 5. Obtener membresía
    getMembership(): Observable<MembershipInfo> {
        return this.http.get<MembershipInfo>(`${this.apiUrl}/membresia`);
    }

    /**
 * Actualizar un registro de historial físico existente
 */
    updatePhysicalRecord(id: number, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/historial-fisico/${id}`, data);
    }
}