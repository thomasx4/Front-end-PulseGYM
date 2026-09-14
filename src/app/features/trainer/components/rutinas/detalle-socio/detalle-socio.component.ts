import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  EntrenadorService,
  RutinaDetalle,
  RutinaDetalleEjercicio,
  HistorialVersion
} from '../../../../../core/services/entrenador.service';

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
  selector: 'app-detalle-socio',
  templateUrl: './detalle-socio.component.html',
  styleUrls: ['./detalle-socio.component.scss']
})
export class DetalleSocioComponent implements OnInit {
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public rutinaId: string = '';
  public idSocio: string = '';
  public diaExpandido: { semana: number; dia: number } | null = null;

  // Exportar PDF
  public exportandoPDF: boolean = false;

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  public rutina: RutinaDetalle | null = null;
  public detallesPorDia: { [key: number]: RutinaDetalleEjercicio[] } = {};
  public equiposRutina: string[] = [];

  public semanas: SemanaRutina[] = [];
  public equipamiento: Equipamiento[] = [];

  // Historial
  public historial: HistorialVersion[] = [];
  public cargandoHistorial: boolean = false;
  public versionExpandida: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private entrenadorService: EntrenadorService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.rutinaId = params['idRutina'] || '';
      this.idSocio = params['idSocio'] || '';

      if (this.rutinaId) {
        this.cargarRutina();
      } else {
        this.errorMessage = 'No se especifico una rutina valida.';
        this.isLoading = false;
      }
    });
  }

  cargarRutina(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.entrenadorService.getRutinaById(this.rutinaId).subscribe({
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

  // ==========================================
  // Historial
  // ==========================================
  cargarHistorial(): void {
    this.cargandoHistorial = true;

    this.entrenadorService.getHistorialRutina(this.rutinaId).subscribe({
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

  toggleVersion(idHistorial: number): void {
    this.versionExpandida = this.versionExpandida === idHistorial ? null : idHistorial;
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

  // ==========================================
  // Estructura
  // ==========================================
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

  // ==========================================
  // Acciones
  // ==========================================
  volver(): void {
    if (this.idSocio) {
      this.router.navigate(['/trainer/rutinas/socio', this.idSocio]);
    } else {
      this.router.navigate(['/trainer/rutinas']);
    }
  }

  editarRutina(): void {
    this.router.navigate(['/trainer/rutinas/socio', this.idSocio, 'rutina', this.rutinaId, 'editar']);
  }

  exportarPDF(): void {
    if (!this.rutinaId || !this.idSocio) return;

    this.exportandoPDF = true;

    // ✅ Usa el endpoint correcto para el entrenador: 
    // /seguimiento/rutina/{idSocio}/exportar-pdf?idRutina={idRutina}
    this.entrenadorService.exportarRutinaSocioPDF(this.idSocio, this.rutinaId).subscribe({
      next: (blob: Blob) => {
        this.exportandoPDF = false;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const nombreLimpio = (this.rutina?.nombre || `rutina-${this.rutinaId}`)
          .replace(/[^a-zA-Z0-9-_ ]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase();

        link.download = `${nombreLimpio}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: async (error: any) => {
        this.exportandoPDF = false;
        console.error('Error al exportar PDF:', error);

        let mensaje = 'No se pudo exportar la rutina en PDF.';

        // Si el error viene como Blob (porque pedimos responseType blob), lo parseamos
        if (error.error instanceof Blob) {
          try {
            const texto = await error.error.text();
            const json = JSON.parse(texto);
            mensaje = json.message || mensaje;
          } catch (e) {
            console.error('Error parseando respuesta:', e);
          }
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }

        this.errorModalTitle = 'Error al exportar';
        this.errorModalMessage = mensaje;
        this.showErrorModal = true;
      }
    });
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