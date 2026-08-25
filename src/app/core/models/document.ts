export interface Document {
    idDocumento: number;
    idUsuario: number;
    nombreUsuario: string;
    tipoDocumento: 'CONSENTIEMIENTO_INFORMADO' | 'CONTRATO' | 'EXONERACION';
    fechaFirma: string;
    urlArchivoFirmado: string;
    estado: 'VIGENTE' | 'VENCIDO';
}

export interface DocumentMetric {
    activos: number;
    nuevosEsteMes: number;
    porVencer: number;
    vencidos: number;
    categoriasOrganizadas: number;
}

export interface DocumentFilter {
    search?: string;
    tipoDocumento?: string;
    estado?: string;
}

export const TIPO_DOCUMENTO_LABELS: Record<string, string> = {
    'CONSENTIEMIENTO_INFORMADO': 'Consentimiento Informado',
    'CONTRATO': 'Contrato',
    'EXONERACION': 'Exoneración'
};

export const ESTADO_DOCUMENTO_LABELS: Record<string, string> = {
    'VIGENTE': 'Vigente',
    'VENCIDO': 'Vencido'
};

export function getTipoDocumentoLabel(tipo: string): string {
    return TIPO_DOCUMENTO_LABELS[tipo] || tipo;
}

export function getEstadoDocumentoLabel(estado: string): string {
    return ESTADO_DOCUMENTO_LABELS[estado] || estado;
}