export type EstadoReporteFalla = 'PENDIENTE' | 'EN_REVISION' | 'EN_REPARACION' | 'RESUELTO';
export type UrgenciaFalla = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'NINGUNA';

export interface ReporteFallaItem {
  idEquipo: number;
  nombre: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  fechaAdquisicion: string;
  fechaGarantia: string;
  ubicacion: string;
  estado: string;
  urgenciaFalla: UrgenciaFalla;
  descripcionFalla: string;
  estadoReporte: EstadoReporteFalla;
}

export interface ReportesFallaResponse {
  data: ReporteFallaItem[];
  success: boolean;
  count: number;
  message: string;
}

export interface RegistrarFallaRequest {
  urgencia: UrgenciaFalla;
  descripcion: string;
}

export interface ActualizarEstadoFallaRequest {
  estado: EstadoReporteFalla;
}

export interface FiltrosFalla {
  idEquipo?: number;
  estado?: EstadoReporteFalla | '';
  urgencia?: UrgenciaFalla | '';
}