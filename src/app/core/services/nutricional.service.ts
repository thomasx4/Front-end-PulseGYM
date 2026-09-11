import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Suggestion {
  nombre: string;
  descripcion: string;
  calorias: number;
  ingredientes: string;
  preparacion: string;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export interface ComidasSugeridas {
  desayuno: Suggestion[];
  almuerzo: Suggestion[];
  cena: Suggestion[];
  colaciones: Suggestion[];
}

export interface PlanNutricionalReal {
  idPlanNutricional: number;
  version: number;
  generadoPorIA: boolean;
  fechaGeneracion: string;
  modificadoPor: string | null;
  fechaModificacion: string | null;
  motivoModificacion: string | null;
  calorias_diarias: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  restricciones_dieteticas: string[];
  sugerencias_comidas: ComidasSugeridas;
  explicacion_ia: string;
}

export interface GenerarPlanPayload {
  restricciones_dieteticas: string[];
  alergias: string[];
  intolerancias: string[];
  objetivo_especifico: string;
}

export interface GenerarPlanPayloadCamel {
  restriccionesDieteticas: string[];
  alergias: string[];
  intolerancias: string[];
  objetivoEspecifico: string;
}

export interface EditarPlanPayload {
  caloriasDiarias: number;
  proteinasG: number;
  carbohidratosG: number;
  grasasG: number;
  restriccionesDieteticas: string[];
  motivo: string;
}

// Estructura real del endpoint de historial
export interface HistorialPlanVersion {
  idHistorial: number;
  version: number;
  datosJson: {
    idPlanNutricional: number;
    version: number;
    generadoPorIA: boolean;
    fechaGeneracion: string;
    modificadoPor: string | null;
    fechaModificacion: string | null;
    motivoModificacion: string | null;
    calorias_diarias: number;
    proteinas_g: number;
    carbohidratos_g: number;
    grasas_g: number;
    restricciones_dieteticas: string[];
    sugerencias_comidas: ComidasSugeridas;
    explicacion_ia: string;
  };
  modificadoPor: string;
  motivo: string;
  fechaModificacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class NutricionalService {

  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/planes-nutricionales`;
  private exportUrl = `${environment.apiUrl}/pg-ms-users/api/v1/seguimiento/plan-nutricional`;

  constructor(private http: HttpClient) { }

  getMisPlanes(): Observable<PlanNutricionalReal[]> {
    return this.http.get<PlanNutricionalReal[]>(`${this.apiUrl}/mis-planes`);
  }

  getPlanById(id: number): Observable<PlanNutricionalReal> {
    return this.http.get<PlanNutricionalReal>(`${this.apiUrl}/${id}`);
  }

  generarPlan(payload: GenerarPlanPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/mi-plan/generar`, payload);
  }

  editarPlan(payload: EditarPlanPayload): Observable<any> {
    return this.http.put(`${this.apiUrl}/mi-plan/ajustar`, payload);
  }

  exportarPlanPDF(idPlan: number): Observable<Blob> {
    return this.http.get(`${this.exportUrl}/exportar-pdf/${idPlan}`, {
      responseType: 'blob'
    });
  }

  exportarUltimoPlanPDF(): Observable<Blob> {
    return this.http.get(`${this.exportUrl}/exportar-pdf`, {
      responseType: 'blob'
    });
  }

  // Historial de versiones de un plan nutricional
  getHistorialPlan(idPlan: number | string): Observable<HistorialPlanVersion[]> {
    return this.http.get<HistorialPlanVersion[]>(`${this.apiUrl}/${idPlan}/historial`);
  }
}