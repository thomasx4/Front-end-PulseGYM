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
    estado?: string;
}

export interface PaymentSummaryDTO {
    ingresosMes: number;
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