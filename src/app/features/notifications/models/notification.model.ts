export type EnumCanalNotificacion = 'EMAIL' | 'WHATSAPP';
export type EnumPreferenciaUsuario = 'EMAIL' | 'WHATSAPP' | 'AMBOS' | 'NINGUNO';
export type EnumEstadoNotificacion = 'ENVIADO' | 'RECHAZADO' | 'PENDIENTE';
export type EnumEventoAsociado =
    | 'WELCOME'
    | 'REGISTRO_USUARIO'
    | 'LOGIN_USUARIO'
    | 'PAYMENT_REMINDER'
    | 'ACHIEVEMENT'
    | 'MAINTENANCE_ALERT'
    | 'PROMOTION'
    | 'CHANGE_PASSWORD';

export interface PlantillaNotificacion {
    idPlantilla?: number;
    nombre: string;
    titulo: string;
    descripcion: string;
    contenido: string;
    tipoPlantilla: EnumCanalNotificacion;
    eventoAsociado: EnumEventoAsociado;
    eventosAsociados: EnumEventoAsociado[];
    estado?: boolean;
    eliminada?: boolean;
    fechaCreacion?: string;
}

export interface PlantillaDisenoEmail {
    idDiseno?: number;
    nombre: string;
    eventoAsociado: EnumEventoAsociado;
    canal: EnumCanalNotificacion;
    colorPrincipal: string;
    colorSecundario: string;
    tituloHeader: string;
    subtituloHeader: string;
    activo: boolean;
    eliminado?: boolean;
    fechaCreacion?: string;
    fechaActualizacion?: string;
}
export interface ConfiguracionGlobal {
    maxNotificacionesPorDia: number;
    maxNotificacionesPorMinuto: number;
    emailHabilitado?: boolean;
    whatsappHabilitado?: boolean;
    estadoSistema?: string;
    mensajeEstado?: string;
}

export interface EnvioNotificacion {
    usuarioId: number;
    destinatario: string;
    asunto?: string;
    contenido: string;
    canal: string;
    tipoEvento?: string;
    plantillaId?: number;
}