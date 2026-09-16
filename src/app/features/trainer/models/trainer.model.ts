export interface EvolucionDiaria {
    fecha: string;
    peso: number;
    porcentajeGrasa: number;
    masaMuscular: number;
}

export interface SocioEvolucion {
    socioId: number;
    nombreSocio: string;
    evolucionHistorica: EvolucionDiaria[];
}

export interface TrainerDashboard {
    entrenadorId: number;
    nombreEntrenador: string;
    totalSociosActivos: number;
    sociosEvolucion: SocioEvolucion[];
}

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

export interface RegistrarFallaPayload {
    urgencia: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'NINGUNA';
    descripcion: string;
}

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

export interface Supplier {
    idProveedor?: number;
    nombreEmpresa: string;
    contactoNombre: string;
    telefono: string;
    email: string;
    cantidadEquipos?: number;
}

export interface ApiResponseSuppliers<T> {
    data: T;
    success: boolean;
    count?: number;
    message?: string;
}
