export interface Document {
    id: number;
    nombre: string;
    categoria: string;
    version: string;
    fechaActualizacion: string;
    fechaVencimiento?: string;
    estado: 'ACTIVO' | 'POR_VENCER' | 'VENCIDO';
    contenido: string;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
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
    categoria?: string;
    estado?: string;
}