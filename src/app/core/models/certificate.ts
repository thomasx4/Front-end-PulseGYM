export interface Certificate {
    idCertificacion: number;
    idEntrenador: number;
    nombreEntrenador: string;
    nombreCertificacion: string;
    urlPdf: string;
    fechaSubida: string;
}

export interface CertificateRequest {
    idEntrenador: number;
    nombre: string;
    urlPdf: string;
}

export interface CertificateUpdate {
    nombre: string;
    urlPdf: string;
}

export interface CertificateFilter {
    pagina?: number;
    tamanio?: number;
    search?: string;
    certificacion?: string;
}

export interface CertificateMetric {
    totalCertificaciones: number;
    entrenadoresCertificados: number;
}