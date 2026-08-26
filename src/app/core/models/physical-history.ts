export interface PhysicalHistory {
    idHistorialFisico: number;
    idSocio: number;
    nombreSocio: string;
    idRecepcionista?: number;
    nombreRecepcionista?: string;
    fechaMedicion: string;
    pesoKg: number;
    porcentajeGrasa: number;
    porcentajeMusculo: number;
    cinturaCm: number;
    pechoCm: number;
    brazoIzqCm?: number;
    brazoDerCm?: number;
    piernaIzqCm?: number;
    piernaDerCm?: number;
    tendenciaPeso?: 'UP' | 'DOWN' | 'EQUAL';
    tendenciaGrasa?: 'UP' | 'DOWN' | 'EQUAL';
    tendenciaMusculo?: 'UP' | 'DOWN' | 'EQUAL';
}

export interface PhysicalHistoryRequest {
    idSocio: number;
    idRecepcionista?: number;
    fechaMedicion?: string;
    pesoKg: number;
    porcentajeGrasa: number;
    porcentajeMusculo: number;
    cinturaCm: number;
    pechoCm: number;
    brazoIzqCm?: number;
    brazoDerCm?: number;
    piernaIzqCm?: number;
    piernaDerCm?: number;
}