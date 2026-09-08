export interface Exercise {
  nombre: string;
  sets: string;
  imageUrl?: string;
  grupoMuscular?: string;
  diaSemana?: number;
}

export interface Routine {
  nombre: string;
  duracion: string;
  dateStr: string;
  ejercicios: Exercise[];
}

export interface WeekDay {
  name: string;
  active: boolean;
  dayNumber: number;
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

export interface Estadisticas {
  totalSesiones: number;
  promedioDuracion: number;
}

export interface DashboardSocioResponse {
  nombreSocio: string;
  rachaDiasEntrenando: number;
  porcentajeCumplimientoSemanal: number;
  caloriasDiarias: number;
  estadisticas: Estadisticas;
}