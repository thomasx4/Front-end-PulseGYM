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
