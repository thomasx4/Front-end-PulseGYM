export type EstadoEquipo = 'OPERATIVO' | 'MANTENIMIENTO' | 'FUERA_DE_SERVICIO' | 'RETIRADO';

export interface Equipo {
  idEquipo?: number;
  id?: number;
  idProveedor?: number;
  idSede?: number;
  nombre: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  fechaAdquisicion?: string;
  fechaGarantia?: string;
  ubicacion?: string;
  estado: EstadoEquipo;
  urgenciaFalla?: string;
  descripcionFalla?: string;
  estadoReporte?: string;
}

export interface ApiResponseEquipos<T> {
  data: T;
  success: boolean;
  count?: number;
  message?: string;
}

export interface ApiResponseSimple {
  message: string;
}

export interface ConsultaEquipoRequest {
  nombre?: string;
  marca?: string;
  ubicacion?: string;
  estado?: string;
  idSede?: number | null;
}
