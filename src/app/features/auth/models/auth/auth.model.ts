// Este archivo sería para el modelo de autenticación
// Podrías exportar interfaces y tipos aquí


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
  name: string;
  role: RolUsuario;
  avatar?: string;
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
  messege: string;
}

export interface MessageGlobalDTO {
  message: string;
}

export interface Credencial {
  id: number;
  email: string;
  username: string;
  rol: string;
  estado: boolean;
}

export interface RespuestaPaginadaCredenciales {
  contenido: Credencial[];
  numeroPagina: number;
  tamanioPagina: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}


export enum RolUsuario {
  ADMIN = 'administrador',
  ENTRENADOR = 'entrenador',
  RECEPCIONISTA = 'recepcionista',
  USER = 'user'
}