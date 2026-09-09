export interface Payment {
    idPago: number;
    idSocio: number;
    nombreSocio: string;
    emailSocio: string;
    idSocioMembresia: number;
    nombreMembresia: string;
    monto: number;
    fechaPago: string;
    metodoPago: string;
    numeroComprobante: string;
    idAdminRegistro?: number;
    nombreAdminRegistro?: string;
    observaciones?: string;
    anulado: boolean;
    motivoAnulacion?: string;
    fechaAnulacion?: string;
    estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO' | string;
}

export interface PaymentSummaryDTO {
    ingresosMes: number;
    ingresosMesAnterior: number;
    pagosEsteMes: number;
    pendientesCount: number;
    vencidosCount: number;
    completadosCount: number;
}

export interface RegistrarPagoRequestDTO {
    idSocioMembresia: number;
    monto?: number;
    metodoPago: 'EFECTIVO' | 'TRANSFERENCIA_BANCOLOMBIA' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'OTRO';
    numeroComprobante?: string;
    observaciones?: string;
}

export interface AnularPagoRequestDTO {
    idPago: number;
    motivo: string;
}

export interface IngresosDiariosDTO {
    fecha: string;
    totalIngresos: number;
    cantidadPagos: number;
    mensaje: string | null;
}

export interface IngresosMensualesDTO {
    mes: number;
    anio: number;
    totalIngresos: number;
    totalPagos: number;
    mensaje: string | null;
}