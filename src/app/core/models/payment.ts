export interface Payment {
    idPago: number;
    id?: number;
    idSocio: number;
    nombreSocio: string;
    fotoSocio?: string;
    planConcepto?: string;
    monto: number;
    fechaPago: string;
    metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'NEQUI' | 'PSE';
    estado: 'COMPLETADO' | 'PENDIENTE' | 'VENCIDO' | 'ANULADO';
    proximoPago?: string;
    referencia?: string;
    ultimosDigitos?: string;
    tipoPago?: string;
    periodo?: string;
    registradoPor?: string;
    notas?: string;
}

export interface PaymentSummaryDTO {
    ingresosMes: number;
    porcentajeIngresosCambio?: string;
    pagosEsteMes: number;
    porcentajePagosCambio?: string;
    pendientesCount: number;
    pendientesMonto?: number;
    vencidosCount: number;
    vencidosMonto?: number;
    completadosCount: number;
    completadosMonto?: number;
}