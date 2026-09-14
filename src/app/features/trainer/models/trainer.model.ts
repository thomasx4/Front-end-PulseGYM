export interface EvolucionDiaria {
    fecha: string;
    peso: number;
    porcentajeGrasa: number;
    masaMuscular: number;
}

export interface SocioEvolucion {
    socioId: number;
    nombreSocio: string;
    evolucionHistorica: EvolucionDiaria[];
}

export interface TrainerDashboard {
    entrenadorId: number;
    nombreEntrenador: string;
    totalSociosActivos: number;
    sociosEvolucion: SocioEvolucion[];
}