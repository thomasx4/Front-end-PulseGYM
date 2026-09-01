export interface UserData {
  calories: number;
  caloriesChange: number;
  mealsRegistered: number;
  nextPayment: number;
  paymentDue: number;
}

export interface WeekDay {
  name: string;
  active: boolean;
  dayNumber: number;
}

export interface Exercise {
  nombre: string;
  sets: string;
  imageUrl?: string;
  grupoMuscular?: string;
  peso?: number;
  descanso?: number;
  notas?: string;
}

export interface Routine {
  nombre: string;
  duracion: string;
  dateStr?: string;
  ejercicios: Exercise[];
}

export interface DetalleRutina {
  idDetalle: number;
  idEjercicio: number;
  orden: number;
  series: number;
  notas: string;
  modificadoPor: string;
  nombreEjercicio: string;
  grupoMuscular: string;
  urlImagen: string;
  diaSemana: number;
  repeticionesMin: number;
  repeticionesMax: number;
  pesoSugerido: number;
  descansoSegundos: number;
}

export interface RutinaResponse {
  idRutina: number;
  nombre: string;
  descripcion: string;
  version: number;
  generadaPorIA: boolean;
  fechaGeneracion: string;
  explicacionIA: string;
  detalles: DetalleRutina[];
}

export interface WeeklySummary {
  totalTime: string;
  timeProgress: number;
  caloriesBurned: number;
  caloriesProgress: number;
  workouts: number;
  workoutsProgress: number;
  weeklyCalories: number;
  weeklyCaloriesGoal: number;
  caloriesPercentage: number;
}

export interface DashboardSocioResponse {
  idSocio: number;
  nombreSocio: string;
  rachaDiasEntrenando: number;
  porcentajeCumplimientoSemanal: number;
  porcentajeCumplimientoSemanaAnterior: number;
  evolucionEjercicios: EvolucionEjercicio[];
  estadisticas: Estadisticas;
  calorias?: number;
}

export interface EvolucionEjercicio {
  nombreEjercicio: string;
  progreso: number;
  estado: string;
}

export interface Estadisticas {
  totalSesiones: number;
  promedioDuracion: number;
}

export interface UserProfile {
  nombreCompleto: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  edad: number;
  genero: string;
  direccion: string;
  tipoMembresia: string;
  objetivo: string;
}

export interface Medidas {
  peso: number;
  pesoCambio: string;
  masaMuscular: number;
  masaMuscularCambio: string;
  grasaCorporal: number;
  grasaCorporalCambio: string;
  imc: number;
  imcEstado: string;
  fechaActualizacion: string;
}

export interface Contacto {
  nombre: string;
  telefono: string;
  parentesco: string;
}