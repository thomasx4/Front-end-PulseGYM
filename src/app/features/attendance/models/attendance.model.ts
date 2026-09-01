
export interface AsistenciaResponseDTO {
  idAsistencia: number;
  idUsuario: number;
  nombreSede: string;
  fechaHoraEntrada: string;
  tipoAcceso: string;
  estadoAcceso: string;
  motivoDenegacion: string | null;
}

export interface PeakHour {
  etiqueta: string;
  horaInicio: number;
  horaFin: number;
  cantidad: number;
}

export interface HistorialAccesoItem {
  usuarioId: number;
  nombreUsuario: string;
  fechaHora: string;
  tipoAcceso: string;
  resultado: string;
  motivo: string | null;
  sedeId: number;
  nombreSede: string;
}

export interface HistorialAccesoResponse {
  size: number;
  last: boolean;
  success: boolean;
  totalPages: number;
  message: string;
  currentPage: number;
  content: HistorialAccesoItem[];
  first: boolean;
  totalElements: number;
}

export interface FiltrosHistorial {
  usuarioId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoAcceso?: string;
  resultado?: string;
  page?: number;
  size?: number;
}