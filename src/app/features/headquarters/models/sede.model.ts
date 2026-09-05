export interface Sede {
  idSede?: number;
  nombreSede: string;
  direccion: string;
  telefono: string;
  ciudad: string;
  cantidadEquipos?: number;
}

export interface ApiResponseSedes<T> {
  data: T;
  success: boolean;
  count?: number;
  message?: string;
}