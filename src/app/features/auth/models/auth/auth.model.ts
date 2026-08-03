// Este archivo sería para el modelo de autenticación
// Podrías exportar interfaces y tipos aquí

export type RolUsuario = 'administrador' | 'entrenador' | 'recepcionista' | 'socio';

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
  role: 'admin' | 'user' | 'trainer';
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

export interface CredencialesListado {
  id: number;
  username: string;
  email: string;
  rol: string;
  estado: boolean;
}