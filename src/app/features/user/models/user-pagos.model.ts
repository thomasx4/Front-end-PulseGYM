export interface PagoSocio {
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
    anulado: boolean;
    motivoAnulacion?: string;
    estado?: string;
}

export interface TokenizedPaymentRequest {
    idSocioMembresia: number;
    token: string;
    paymentMethodId: string;
    issuerId?: string;
    installments: number;
    payerIdentificationType: string;
    payerIdentificationNumber: string;
    payerEmail: string;
    monto?: number;
    metodoPago?: string;
}

export interface FiltroPagosRequest {
    page?: number;
    size?: number;
    search?: string | null;
    idSocio?: number | null;
    metodoPago?: string | null;
    estado?: string | null;
    fechaInicio?: string | null;
    fechaFin?: string | null;
}