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
  name: string;
  email: string;
  role: RolUsuario;
}


export enum RolUsuario {
  ADMIN = 'administrador',
  ENTRENADOR = 'entrenador',
  RECEPCIONISTA = 'recepcionista',
  USER = 'user'
}