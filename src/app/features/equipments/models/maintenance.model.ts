export type TipoMantenimiento = 'PREVENTIVO' | 'CORRECTIVO';

export interface MantenimientoItem {
  idMantenimiento: number;
  fechaServicio: string;
  tipo: TipoMantenimiento;
  descripcion: string;
  costo: number;
  tecnicoResponsable: string;
  proveedorNombre?: string;
  proximoMantenimiento?: string;
}

export interface RegistrarMantenimientoPayload {
  idEquipo: number;
  fechaServicio: string;
  tipo: TipoMantenimiento;
  descripcion: string;
  costo: number;
  tecnicoResponsable: string;
  proximoMantenimiento?: string;
}

export interface HistorialMantenimientoResponse {
  data: MantenimientoItem[];
  success: boolean;
  count: number;
  message: string;
}