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
  role: 'admin' | 'user' | 'trainer';
  avatar?: string;
}