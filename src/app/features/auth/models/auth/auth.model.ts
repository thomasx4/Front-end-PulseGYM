export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: RolUsuario;
  avatar?: string;
  fotoUrl?: string | null; 
  fotoPerfil?: string | null;
  requiereCambioContrasena?: boolean;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  username: string;
  rol: RolUsuario;
  estado: boolean;
}

export interface HttpGlobalResponse<T> {
  data: T;
  message?: string;
  messege?: string;
}

export interface MessageGlobalDTO {
  message: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Credencial {
  id: number;
  email: string;
  username: string;
  rol: string;
  estado: boolean;
  fechaRegistro?: string;
  fotoUrl?: string;
  avatarUrl?: string;
  foto?: string;
}

export interface RespuestaPaginadaCredenciales {
  content?: Credencial[];
  contenido?: Credencial[];
  currentPage?: number;
  number?: number;
  numeroPagina?: number;
  size?: number;
  tamanioPagina?: number;
  totalElements?: number;
  totalElementos?: number;
  totalPages?: number;
  totalPaginas?: number;
  last?: boolean;
  ultima?: boolean;
}

export enum RolUsuario {
  ADMIN = 'administrador',
  ENTRENADOR = 'entrenador',
  RECEPCIONISTA = 'recepcionista',
  USER = 'socio'
}