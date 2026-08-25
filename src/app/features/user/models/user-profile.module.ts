// Datos personales (completar-perfil)
export interface UserProfile {
  nombre: string;
  apellido: string;
  telefono: string;
  documentoIdentidad: string;
  fotoUrl: string;
  fechaNacimiento: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  objetivoPrincipal: string;
  nivelExperiencia: string;
  idSede: number;
}

// Documentos
export interface UserDocument {
  idUsuario: number;
  tipoDocumento: string;
  urlArchivoFirmado: string;
}

// Perfil médico
export interface MedicalProfile {
  idSocio: number;
  pesoKg: number;
  estaturaCm: number;
  alergias: string;
  condicionesCronicas: string;
}

// Historial físico
export interface PhysicalRecord {
    id?: number; 
  idSocio: number;
  idRecepcionista: number;
  pesoKg: number;
  porcentajeGrasa: number;
  porcentajeMusculo: number;
  cinturaCm: number;
  pechoCm: number;
  brazoIzqCm: number;
  brazoDerCm: number;
  piernaIzqCm: number;
  piernaDerCm: number;
}

// Membresía
export interface MembershipInfo {
  planName: string;
  price: string;
  startDate: string;
  nextPaymentDate: string;
  daysRemaining: number;
  progress: number;
  active: boolean;
}

interface PerfilMedico {
  idSocio: number;
  pesoKg: number;
  estaturaCm: number;
  alergias: string;
  condicionesCronicas: string;
}

interface HistorialFisico {
  idSocio: number;
  idRecepcionista: number;
  pesoKg: number;
  porcentajeGrasa: number;
  porcentajeMusculo: number;
  cinturaCm: number;
  pechoCm: number;
  brazoIzqCm: number;
  brazoDerCm: number;
  piernaIzqCm: number;
  piernaDerCm: number;
}