import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  RutinasService,
  RutinaDetalle,
  RutinaDetalleEjercicio,
  Equipo,
  HistorialVersion
} from '../../../../../core/services/rutinas.service';

interface DiaRutina {
  alias: string;
  nombre: string;
  enfoque: string;
  ejerciciosCount: number;
  duracionMin: number;
  colorClass: string;
  ejercicios: RutinaDetalleEjercicio[];
  diaNumero: number;
  semana: number;
}

interface SemanaRutina {
  numero: number;
  dias: DiaRutina[];
}

interface Equipamiento {
  nombre: string;
}

@Component({
  selector: 'app-detalle-rutina',
  templateUrl: './detalle-rutina.component.html',
  styleUrls: ['./detalle-rutina.component.scss']
})
export class DetalleRutinaComponent implements OnInit {
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public rutinaId: string = '';
  public isEditMode: boolean = false;
  public diaExpandido: { semana: number; dia: number } | null = null;

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  public rutina: RutinaDetalle | null = null;
  public detallesPorDia: { [key: number]: RutinaDetalleEjercicio[] } = {};
  public equiposRutina: string[] = [];

  public semanas: SemanaRutina[] = [];
  public equipamiento: Equipamiento[] = [];

  // Historial de versiones
  public historial: HistorialVersion[] = [];
  public cargandoHistorial: boolean = false;
  public versionExpandida: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private rutinasService: RutinasService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.rutinaId = params['id'] || '';
      if (this.rutinaId) {
        this.cargarRutina();
      }
    });
  }

  cargarRutina(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rutinasService.getRutinaById(this.rutinaId).subscribe({
      next: (response: RutinaDetalle) => {
        this.rutina = response;
        this.organizarDetallesPorDia();
        this.procesarSemanas();
        this.procesarEquipamiento();
        this.isLoading = false;

        this.cargarHistorial();
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al cargar rutina:', error);

        if (error.status === 401) {
          this.errorModalTitle = 'Sesion expirada';
          this.errorModalMessage = 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.';
        } else if (error.status === 404) {
          this.errorModalTitle = 'No encontrado';
          this.errorModalMessage = 'La rutina que buscas no existe o no tienes acceso.';
        } else if (error.status === 500) {
          this.errorModalTitle = 'Error del servidor';
          this.errorModalMessage = 'El servidor no esta disponible. Por favor, intenta mas tarde.';
        } else {
          this.errorModalTitle = 'Error al cargar';
          this.errorModalMessage = error.error?.message || 'Error al cargar los detalles de la rutina.';
        }
        this.showErrorModal = true;
      }
    });
  }

  // Historial de versiones
  cargarHistorial(): void {
    this.cargandoHistorial = true;

    this.rutinasService.getHistorialRutina(this.rutinaId).subscribe({
      next: (response: HistorialVersion[]) => {
        this.historial = response || [];
        this.cargandoHistorial = false;
      },
      error: (error: any) => {
        console.error('Error al cargar historial:', error);
        this.historial = [];
        this.cargandoHistorial = false;
      }
    });
  }

  // Acordeon del historial
  toggleVersion(idHistorial: number): void {
    if (this.versionExpandida === idHistorial) {
      this.versionExpandida = null;
    } else {
      this.versionExpandida = idHistorial;
    }
  }

  isVersionExpandida(idHistorial: number): boolean {
    return this.versionExpandida === idHistorial;
  }

  agruparDetallesVersion(detalles: any[]): { semana: number; dia: number; ejercicios: any[] }[] {
    if (!detalles || detalles.length === 0) return [];

    const mapa = new Map<string, { semana: number; dia: number; ejercicios: any[] }>();

    detalles.forEach((detalle: any) => {
      const semana = detalle.semana || 1;
      const dia = detalle.diaSemana || 1;
      const key = `${semana}-${dia}`;

      if (!mapa.has(key)) {
        mapa.set(key, { semana, dia, ejercicios: [] });
      }
      mapa.get(key)!.ejercicios.push(detalle);
    });

    return Array.from(mapa.values()).sort((a, b) => {
      if (a.semana !== b.semana) return a.semana - b.semana;
      return a.dia - b.dia;
    });
  }

  getNombreDia(dia: number): string {
    const nombres = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    return nombres[(dia - 1) % 7] || `Dia ${dia}`;
  }

  getTotalEjerciciosVersion(detalles: any[]): number {
    return detalles?.length || 0;
  }

  organizarDetallesPorDia(): void {
    if (!this.rutina) return;

    this.detallesPorDia = {};
    this.rutina.detalles.forEach((detalle: RutinaDetalleEjercicio) => {
      const dia = detalle.diaSemana;
      if (!this.detallesPorDia[dia]) {
        this.detallesPorDia[dia] = [];
      }
      this.detallesPorDia[dia].push(detalle);
    });
  }

  procesarSemanas(): void {
    if (!this.rutina) return;

    const colores = ['badge-lun', 'badge-mar', 'badge-mie', 'badge-jue', 'badge-vie', 'badge-sab', 'badge-dom'];
    const nombresDias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    const aliasDias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    const semanasMap = new Map<number, any[]>();

    Object.keys(this.detallesPorDia).forEach(key => {
      const dia = Number(key);
      const ejercicios = this.detallesPorDia[dia] || [];

      const semana = ejercicios.length > 0 && ejercicios[0].semana
        ? ejercicios[0].semana
        : Math.floor((dia - 1) / 7) + 1;

      if (!semanasMap.has(semana)) {
        semanasMap.set(semana, []);
      }
      semanasMap.get(semana)!.push({ dia, ejercicios });
    });

    const semanasOrdenadas = Array.from(semanasMap.keys()).sort((a, b) => a - b);

    this.semanas = semanasOrdenadas.map((semana: number) => {
      const diasDeSemana = semanasMap.get(semana) || [];

      const dias: DiaRutina[] = diasDeSemana.map((item: { dia: number; ejercicios: RutinaDetalleEjercicio[] }) => {
        const dia = item.dia;
        const ejercicios = item.ejercicios;
        const index = (dia - 1) % 7;
        return {
          alias: aliasDias[index] || `D${dia}`,
          nombre: nombresDias[index] || `Dia ${dia}`,
          enfoque: this.obtenerEnfoque(ejercicios),
          ejerciciosCount: ejercicios.length,
          duracionMin: ejercicios.reduce((total: number, e: RutinaDetalleEjercicio) => total + (e.descansoSegundos || 60), 0) / 60 || 30,
          colorClass: colores[index] || 'badge-lun',
          ejercicios: ejercicios,
          diaNumero: dia,
          semana: semana
        };
      });

      return {
        numero: semana,
        dias: dias
      };
    });
  }

  obtenerEnfoque(ejercicios: RutinaDetalleEjercicio[]): string {
    if (!ejercicios || ejercicios.length === 0) return 'Descanso';
    const grupos = ejercicios.map((e: RutinaDetalleEjercicio) => e.grupoMuscular).filter((g: string | null) => g);
    if (grupos.length === 0) return 'Cardio';
    const gruposUnicos = [...new Set(grupos)];
    return gruposUnicos.join(' & ');
  }

  procesarEquipamiento(): void {
    if (!this.rutina) return;

    const equiposSet = new Set<string>();

    this.rutina.detalles.forEach((detalle: RutinaDetalleEjercicio) => {
      if (detalle.equipoRequerido && detalle.equipoRequerido !== 'Sin equipo') {
        equiposSet.add(detalle.equipoRequerido);
      }
    });

    const equiposArray = Array.from(equiposSet);
    this.equipamiento = equiposArray.map((nombre: string) => ({
      nombre: nombre
    }));

    this.equiposRutina = equiposArray;
  }

  toggleDia(semana: number, dia: number): void {
    if (this.diaExpandido && this.diaExpandido.semana === semana && this.diaExpandido.dia === dia) {
      this.diaExpandido = null;
    } else {
      this.diaExpandido = { semana, dia };
    }
  }

  isDiaExpandido(semana: number, dia: number): boolean {
    return this.diaExpandido !== null &&
           this.diaExpandido.semana === semana &&
           this.diaExpandido.dia === dia;
  }

  get totalDiasConEjercicios(): number {
    return Object.keys(this.detallesPorDia).length;
  }

  get totalEjercicios(): number {
    let total = 0;
    Object.keys(this.detallesPorDia).forEach((key: string) => {
      total += this.detallesPorDia[Number(key)]?.length || 0;
    });
    return total;
  }

  volver(): void {
    this.router.navigate(['/user/rutinas']);
  }

  editarRutina(): void {
    this.isEditMode = true;
    this.router.navigate(['/user/rutinas/editar', this.rutinaId]);
  }

  onRetry(): void {
    this.showErrorModal = false;
    this.cargarRutina();
  }

  onCloseModal(): void {
    this.showErrorModal = false;
    if (this.errorModalTitle === 'Sesion expirada') {
      this.router.navigate(['/auth/login']);
    }
  }
}