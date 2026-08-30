
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