export interface PhysicalHistory {
    idHistorialFisico: number;
    id?: number;
    idHistorial?: number;
    idSocio: number;
    nombreSocio: string;
    idRecepcionista?: number;
    nombreRecepcionista?: string;
    fechaMedicion: string;
    pesoKg: number;
    alturaCm?: number;
    imc?: number;
    porcentajeGrasa: number;
    porcentajeMusculo: number;
    cuelloCm?: number;
    cinturaEscapularCm?: number;
    cinturaCm: number;
    caderaCm?: number;
    toraxCm?: number;
    pechoCm: number;
    brazoIzqCm?: number;
    brazoDerCm?: number;
    piernaIzqCm?: number;
    piernaDerCm?: number;
    pantorrillaIzqCm?: number;
    pantorrillaDerCm?: number;
    tendenciaPeso?: 'UP' | 'DOWN' | 'EQUAL';
    tendenciaGrasa?: 'UP' | 'DOWN' | 'EQUAL';
    tendenciaMusculo?: 'UP' | 'DOWN' | 'EQUAL';
}

export interface PhysicalHistoryRequest {
    idSocio: number;
    idRecepcionista?: number;
    fechaMedicion?: string;
    pesoKg: number;
    alturaCm?: number;
    porcentajeGrasa?: number;
    porcentajeMusculo?: number;
    cuelloCm?: number;
    cinturaEscapularCm?: number;
    cinturaCm?: number;
    caderaCm?: number;
    toraxCm?: number;
    pechoCm?: number;
    brazoIzqCm?: number;
    brazoDerCm?: number;
    piernaIzqCm?: number;
    piernaDerCm?: number;
    pantorrillaIzqCm?: number;
    pantorrillaDerCm?: number;
}

export interface PhysicalHistoryEvolutionItem {
    fecha: string;
    valor: number;
}

export interface PhysicalHistoryEvolutionResponse {
    idSocio: number;
    nombreSocio: string;
    evolucionPeso: PhysicalHistoryEvolutionItem[];
    evolucionGrasa: PhysicalHistoryEvolutionItem[];
    evolucionMusculo: PhysicalHistoryEvolutionItem[];
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface SocioSimpleDTO {
    id: number;
    nombre: string;
}

export interface HistorialResumenDTO {
    totalRecords: number;
    primeraFecha: string | null;
    ultimaFecha: string | null;
    socios: SocioSimpleDTO[];
}