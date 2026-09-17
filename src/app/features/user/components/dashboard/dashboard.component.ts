import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  WeekDay,
  Routine,
  WeeklySummary,
  DashboardSocioResponse
} from '../../models/user.module';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  dashboardData!: DashboardSocioResponse;

  weekDays: WeekDay[] = [];

  todayRoutine: Routine = {
    nombre: 'Cargando...',
    duracion: '--',
    dateStr: '',
    ejercicios: []
  };

  weeklySummary: WeeklySummary = {
    totalTime: '0h',
    timeProgress: 0,
    caloriesBurned: 0,
    caloriesProgress: 0,
    workouts: 0,
    workoutsProgress: 0,
    weeklyCalories: 0,
    weeklyCaloriesGoal: 0,
    caloriesPercentage: 0
  };

  caloriasDiarias: number = 0;
  isLoading: boolean = true;
  error: string | null = null;
  bestStreak: number = 0;

  userName: string = 'Usuario';
  userRole: string = 'Socio';
  avatarUrl: string = '';

  mostrarModalError: boolean = false;
  modalErrorMessage: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.updateWeekDaysFromBackend([]);
  }

  loadUserInfo(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          this.userName = user.name || 'Usuario';
          this.userRole = user.role || 'Socio';
          this.avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.userName) + '&background=0F1C3F&color=fff&bold=true';
        }
        this.loadDashboardData();
      },
      error: () => {
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    this.modalErrorMessage = '';

    this.userService.getDashboardSocio().subscribe({
      next: (data) => {
        console.log('Datos del dashboard:', data);
        this.dashboardData = data;

        if (data.nombreSocio) {
          this.userName = data.nombreSocio;
          this.avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.userName) + '&background=0F1C3F&color=fff&bold=true';
        }

        this.bestStreak = data.rachaDiasEntrenando || 0;
        
        this.updateWeekDaysFromBackend(data.diasEntrenadosSemana || []);
        
        this.updateWeeklySummary(data);

        this.isLoading = false;
        this.loadTodayRoutine();
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        this.isLoading = false;
        this.bestStreak = 0;
        this.updateWeekDaysFromBackend([]);
        this.mostrarErrorModal('Ocurrió un error al cargar tu panel. Por favor, intenta de nuevo.');
        this.loadTodayRoutine(); 
      }
    });
  }

  loadTodayRoutine(): void {
    this.userService.getLastRoutine().subscribe({
      next: (routine) => {
        console.log('Última rutina recibida:', routine);
        if (routine) {
          this.todayRoutine = routine;
        } else {
          this.todayRoutine = {
            nombre: 'Sin rutina generada',
            duracion: '--',
            dateStr: this.getTodayDateStr(),
            ejercicios: []
          };
        }
      },
      error: (err) => {
        console.error('Error al cargar rutina:', err);
        this.todayRoutine = {
          nombre: 'No se pudo cargar tu rutina',
          duracion: '--',
          dateStr: this.getTodayDateStr(),
          ejercicios: []
        };
      }
    });
  }

  getTodayDateStr(): string {
    const today = new Date();
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${diasSemana[today.getDay()]} ${today.getDate()} de ${meses[today.getMonth()]}`;
  }

  updateWeekDaysFromBackend(diasEntrenados: number[]): void {
    const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    this.weekDays = days.map((name, index) => {
      const dayNumber = index + 1;
      const isActive = diasEntrenados.includes(dayNumber);
      
      return {
        name: name,
        active: isActive,
        dayNumber: dayNumber
      };
    });
  }

  updateWeeklySummary(data: DashboardSocioResponse): void {
    const estadisticas = data.estadisticas || {};
    const porcentajeSemanal = data.porcentajeCumplimientoSemanal || 0;

    const totalSesiones = (estadisticas as any)['totalSesiones'] || 0;
    const promedioDuracion = (estadisticas as any)['promedioDuracion'] || 0;

    const totalMinutos = totalSesiones * promedioDuracion;
    const horas = Math.floor(totalMinutos / 60);
    const minutos = Math.round(totalMinutos % 60);
    const tiempoTotal = `${horas}h ${minutos}m`;

    const metaMinutos = 300;
    const timeProgress = Math.min(Math.round((totalMinutos / metaMinutos) * 100), 100);

    const metaCalorias = 2500;
    const caloriasQuemadas = Math.round(totalSesiones * 350);
    const caloriesProgress = Math.min(Math.round((caloriasQuemadas / metaCalorias) * 100), 100);

    const metaEntrenamientos = 3;
    const workoutsProgress = Math.min(Math.round((totalSesiones / metaEntrenamientos) * 100), 100);

    this.weeklySummary = {
      totalTime: tiempoTotal || '0h 0m',
      timeProgress: timeProgress,
      caloriesBurned: caloriasQuemadas,
      caloriesProgress: caloriesProgress,
      workouts: totalSesiones,
      workoutsProgress: workoutsProgress,
      weeklyCalories: caloriasQuemadas,
      weeklyCaloriesGoal: metaCalorias,
      caloriesPercentage: porcentajeSemanal
    };
  }

  getActiveDaysCount(): number {
    return this.weekDays ? this.weekDays.filter((day) => day.active).length : 0;
  }

  verRutinaCompleta(): void {
    if (this.todayRoutine.ejercicios && this.todayRoutine.ejercicios.length > 0) {
      this.router.navigate(['/user/rutinas']);
    }
  }

  irACrearRutina(): void {
    this.router.navigate(['/user/rutinas/crear-ia']);
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  mostrarErrorModal(mensaje: string): void {
    this.modalErrorMessage = mensaje;
    this.mostrarModalError = true;
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
  }

  recargarDatos(): void {
    this.mostrarModalError = false;
    this.loadDashboardData();
  }
}