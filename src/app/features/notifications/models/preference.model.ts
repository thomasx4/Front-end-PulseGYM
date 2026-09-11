import { EnumPreferenciaUsuario } from './notification.model';

export interface PreferenciaUsuario {
    idUsuario?: number;
    preferencia: EnumPreferenciaUsuario;
    logrosHabilitado: boolean;
    mantenimientosHabilitado: boolean;
    promocionesHabilitado: boolean;
}