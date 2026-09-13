import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  AsistenciaService,
  RegistroSesionPayload,
  DetalleSesionPayload,
  RutinaDelDia,
  DetalleRutina
} from '../../../../core/services/asistencia.service';

interface EjercicioFormulario {
  idDetalleRutina: number;
  nombreEjercicio: string;
  grupoMuscular: string;
  seriesObjetivo: number;
  repeticionesMin: number;
  repeticionesMax: number;
  pesoSugerido: number;
  seriesCompletadas: number;
  repeticionesRealizadas: number;
  pesoUsado: number;
  estado: 'COMPLETADO' | 'PARCIAL' | 'NO_REALIZADO';
  observaciones: string;
  expandido: boolean;
}

interface ProgresoGuardado {
  fecha: string;
  idRutina: number;
  duracionMinutos: number;
  observaciones: string;
  ejercicios: EjercicioFormulario[];
}

@Component({
  selector: 'app-asistencia',
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.scss']
})
export class AsistenciaComponent implements OnInit, OnDestroy {

  public isLoading: boolean = true;
  public isRegistrando: boolean = false;

  public rutina: RutinaDelDia | null = null;
  public ejercicios: EjercicioFormulario[] = [];

  public duracionMinutos: number = 60;
  public observaciones: string = '';

  // Bloqueo por dia
  public sesionYaRegistradaHoy: boolean = false;
  public fechaUltimoRegistro: string = '';

  // Modales
  public showSuccessModal: boolean = false;
  public showErrorModal: boolean = false;
  public showNoRutinaModal: boolean = false;
  public modalErrorMessage: string = '';
  public modalErrorTitulo: string = 'Algo salio mal';

  public estadosDisponibles = [
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'PARCIAL', label: 'Parcial' },
    { value: 'NO_REALIZADO', label: 'No realizado' }
  ];

  private readonly STORAGE_PROGRESO = 'asistencia_progreso_diario';
  private readonly STORAGE_SESION_REGISTRADA = 'asistencia_sesion_registrada';
  private midnightTimeoutId: any;

  constructor(
    private router: Router,
    private asistenciaService: AsistenciaService
  ) {}

  ngOnInit(): void {
    this.verificarSesionDelDia();
    this.programarCambioDeDia();
    this.cargarRutinaDelDia();
  }

  ngOnDestroy(): void {
    if (this.midnightTimeoutId) {
      clearTimeout(this.midnightTimeoutId);
    }
  }

  // ==========================================
  // Helpers de fecha
  // ==========================================
  private getFechaHoy(): string {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ==========================================
  // Programa el reset exacto a las 12:00 AM
  // ==========================================
  programarCambioDeDia(): void {
    if (this.midnightTimeoutId) {
      clearTimeout(this.midnightTimeoutId);
    }

    const ahora = new Date();
    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);

    const msHastaMedianoche = manana.getTime() - ahora.getTime();

    this.midnightTimeoutId = setTimeout(() => {
      this.resetearPorCambioDeDia();
      this.programarCambioDeDia();
    }, msHastaMedianoche);
  }

  resetearPorCambioDeDia(): void {
    console.log('Cambio de dia detectado. Reiniciando bloqueo y progreso.');

    localStorage.removeItem(this.STORAGE_SESION_REGISTRADA);
    localStorage.removeItem(this.STORAGE_PROGRESO);

    this.sesionYaRegistradaHoy = false;
    this.fechaUltimoRegistro = '';

    this.duracionMinutos = 60;
    this.observaciones = '';

    this.cargarRutinaDelDia();
  }

  // ==========================================
  // Verifica si ya se registró la sesión hoy
  // ==========================================
  verificarSesionDelDia(): void {
    const data = localStorage.getItem(this.STORAGE_SESION_REGISTRADA);
    if (!data) {
      this.sesionYaRegistradaHoy = false;
      return;
    }

    try {
      const registro = JSON.parse(data);
      const hoy = this.getFechaHoy();

      if (registro.fecha === hoy) {
        this.sesionYaRegistradaHoy = true;
        this.fechaUltimoRegistro = registro.fecha;
      } else {
        localStorage.removeItem(this.STORAGE_SESION_REGISTRADA);
        this.sesionYaRegistradaHoy = false;
      }
    } catch {
      localStorage.removeItem(this.STORAGE_SESION_REGISTRADA);
      this.sesionYaRegistradaHoy = false;
    }
  }

  // ==========================================
  // Cargar rutina del día
  // ==========================================
  cargarRutinaDelDia(): void {
    this.isLoading = true;

    this.asistenciaService.getUltimaRutina().subscribe({
      next: (rutina: RutinaDelDia) => {
        console.log('Rutina recibida:', rutina);

        if (!rutina || !rutina.detalles || rutina.detalles.length === 0) {
          this.isLoading = false;
          this.abrirModalNoRutina();
          return;
        }

        const today = new Date().getDay();
        const diaActual = today === 0 ? 7 : today;

        const detallesHoy = rutina.detalles.filter(d => d.diaSemana === diaActual);
        const detallesMostrar = detallesHoy.length > 0 ? detallesHoy : rutina.detalles;

        this.rutina = rutina;
        this.ejercicios = detallesMostrar.map((d: DetalleRutina) => ({
          idDetalleRutina: d.idDetalle,
          nombreEjercicio: d.nombreEjercicio,
          grupoMuscular: d.grupoMuscular || 'General',
          seriesObjetivo: d.series || 3,
          repeticionesMin: d.repeticionesMin || 8,
          repeticionesMax: d.repeticionesMax || 12,
          pesoSugerido: d.pesoSugerido || 0,
          seriesCompletadas: d.series || 3,
          repeticionesRealizadas: d.repeticionesMax || 12,
          pesoUsado: d.pesoSugerido || 0,
          estado: 'COMPLETADO',
          observaciones: '',
          expandido: false
        }));

        this.restaurarProgreso();
        this.isLoading = false;
        this.verificarSesionDelDia();
      },
      error: (error: any) => {
        console.error('Error al cargar rutina:', error);
        this.isLoading = false;

        if (error.status === 404) {
          this.abrirModalNoRutina();
        } else if (error.status === 401) {
          this.mostrarError(
            'Sesion expirada',
            'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
          );
        } else {
          this.mostrarError(
            'No se pudo cargar',
            error.error?.message || 'Error al cargar la rutina del día. Por favor, intenta de nuevo.'
          );
        }
      }
    });
  }

  // ==========================================
  // Modales
  // ==========================================
  abrirModalNoRutina(): void {
    this.showNoRutinaModal = true;
  }

  cerrarNoRutinaModal(): void {
    this.showNoRutinaModal = false;
  }

  irARutinas(): void {
    this.showNoRutinaModal = false;
    this.router.navigate(['/user/rutinas']);
  }

  mostrarError(titulo: string, mensaje: string): void {
    this.modalErrorTitulo = titulo;
    this.modalErrorMessage = mensaje;
    this.showErrorModal = true;
  }

  cerrarErrorModal(): void {
    this.showErrorModal = false;
  }

  // ==========================================
  // Persistencia
  // ==========================================
  guardarProgreso(): void {
    if (!this.rutina) return;

    const progreso: ProgresoGuardado = {
      fecha: this.getFechaHoy(),
      idRutina: this.rutina.idRutina,
      duracionMinutos: this.duracionMinutos,
      observaciones: this.observaciones,
      ejercicios: this.ejercicios
    };

    localStorage.setItem(this.STORAGE_PROGRESO, JSON.stringify(progreso));
  }

  restaurarProgreso(): void {
    const data = localStorage.getItem(this.STORAGE_PROGRESO);
    if (!data) return;

    try {
      const progreso: ProgresoGuardado = JSON.parse(data);
      const hoy = this.getFechaHoy();

      if (progreso.fecha !== hoy) {
        localStorage.removeItem(this.STORAGE_PROGRESO);
        return;
      }

      if (this.rutina && progreso.idRutina !== this.rutina.idRutina) {
        return;
      }

      this.duracionMinutos = progreso.duracionMinutos ?? 60;
      if (this.duracionMinutos < 30) {
        this.duracionMinutos = 30;
      }
      this.observaciones = progreso.observaciones ?? '';

      progreso.ejercicios.forEach(ejGuardado => {
        const encontrado = this.ejercicios.find(e => e.idDetalleRutina === ejGuardado.idDetalleRutina);
        if (encontrado) {
          encontrado.seriesCompletadas = ejGuardado.seriesCompletadas;
          encontrado.repeticionesRealizadas = ejGuardado.repeticionesRealizadas;
          encontrado.pesoUsado = ejGuardado.pesoUsado;
          encontrado.estado = ejGuardado.estado;
          encontrado.observaciones = ejGuardado.observaciones;
          encontrado.expandido = ejGuardado.expandido;
        }
      });

      console.log('Progreso restaurado del día');
    } catch (e) {
      console.warn('Error al restaurar progreso:', e);
    }
  }

  // ==========================================
  // Duración de la sesión
  // ==========================================
  incrementarDuracion(): void {
    if (this.duracionMinutos < 300) {
      this.duracionMinutos += 5;
      this.guardarProgreso();
    }
  }

  decrementarDuracion(): void {
    if (this.duracionMinutos > 30) {
      this.duracionMinutos -= 5;
      if (this.duracionMinutos < 30) {
        this.duracionMinutos = 30;
      }
      this.guardarProgreso();
    }
  }

  onDuracionChange(): void {
    if (!this.duracionMinutos || this.duracionMinutos < 30) {
      this.duracionMinutos = 30;
      this.mostrarError('Duracion invalida', 'La duración mínima de la sesión es de 30 minutos.');
    }
    if (this.duracionMinutos > 300) {
      this.duracionMinutos = 300;
    }
    this.guardarProgreso();
  }

  // ==========================================
  // Toggle y cambios en ejercicios
  // ==========================================
  toggleEjercicio(index: number): void {
    this.ejercicios[index].expandido = !this.ejercicios[index].expandido;
    this.guardarProgreso();
  }

  cambiarEstado(index: number, estado: 'COMPLETADO' | 'PARCIAL' | 'NO_REALIZADO'): void {
    this.ejercicios[index].estado = estado;

    if (estado === 'NO_REALIZADO') {
      this.ejercicios[index].seriesCompletadas = 0;
      this.ejercicios[index].repeticionesRealizadas = 0;
      this.ejercicios[index].pesoUsado = 0;
    }

    this.guardarProgreso();
  }

  incrementarSeries(index: number): void {
    const max = this.ejercicios[index].seriesObjetivo + 5;
    if (this.ejercicios[index].seriesCompletadas < max) {
      this.ejercicios[index].seriesCompletadas++;
      this.guardarProgreso();
    }
  }

  decrementarSeries(index: number): void {
    if (this.ejercicios[index].seriesCompletadas > 0) {
      this.ejercicios[index].seriesCompletadas--;
      this.guardarProgreso();
    }
  }

  incrementarReps(index: number): void {
    if (this.ejercicios[index].repeticionesRealizadas < 50) {
      this.ejercicios[index].repeticionesRealizadas++;
      this.guardarProgreso();
    }
  }

  decrementarReps(index: number): void {
    if (this.ejercicios[index].repeticionesRealizadas > 0) {
      this.ejercicios[index].repeticionesRealizadas--;
      this.guardarProgreso();
    }
  }

  onPesoChange(): void {
    this.guardarProgreso();
  }

  onObservacionEjercicioChange(): void {
    this.guardarProgreso();
  }

  onObservacionesGeneralesChange(): void {
    this.guardarProgreso();
  }

  // ==========================================
  // Estadísticas
  // ==========================================
  get totalCompletados(): number {
    return this.ejercicios.filter(e => e.estado === 'COMPLETADO').length;
  }

  get totalParciales(): number {
    return this.ejercicios.filter(e => e.estado === 'PARCIAL').length;
  }

  get totalNoRealizados(): number {
    return this.ejercicios.filter(e => e.estado === 'NO_REALIZADO').length;
  }

  get porcentajeCompletado(): number {
    if (this.ejercicios.length === 0) return 0;
    return Math.round((this.totalCompletados / this.ejercicios.length) * 100);
  }

  // ==========================================
  // Registrar sesión
  // ==========================================
  registrarSesion(): void {
    if (this.sesionYaRegistradaHoy) {
      this.mostrarError('Sesion ya registrada', 'Ya registraste tu sesión de hoy. Vuelve mañana.');
      return;
    }

    if (!this.rutina) {
      this.mostrarError('Sin rutina', 'No hay rutina cargada para registrar.');
      return;
    }

    if (!this.duracionMinutos || this.duracionMinutos < 30) {
      this.mostrarError('Duracion invalida', 'La duración mínima de la sesión es de 30 minutos.');
      return;
    }

    for (let i = 0; i < this.ejercicios.length; i++) {
      const ej = this.ejercicios[i];
      if (ej.estado === 'COMPLETADO' && ej.seriesCompletadas === 0) {
        this.mostrarError(
          'Datos incompletos',
          `El ejercicio "${ej.nombreEjercicio}" está marcado como COMPLETADO pero tiene 0 series.`
        );
        return;
      }
    }

    this.isRegistrando = true;

    const detalles: DetalleSesionPayload[] = this.ejercicios.map(ej => ({
      idDetalleRutina: ej.idDetalleRutina,
      seriesCompletadas: Number(ej.seriesCompletadas),
      repeticionesRealizadas: Number(ej.repeticionesRealizadas),
      pesoUsado: Number(ej.pesoUsado),
      estado: ej.estado,
      observaciones: ej.observaciones?.trim() ? ej.observaciones.trim() : null
    }));

    const payload: RegistroSesionPayload = {
      idRutina: this.rutina.idRutina,
      duracionMinutos: Number(this.duracionMinutos),
      observaciones: this.observaciones?.trim() || '',
      detalles: detalles
    };

    console.log('Enviando payload de sesión:', JSON.stringify(payload, null, 2));

    this.asistenciaService.registrarSesion(payload).subscribe({
      next: (response: any) => {
        console.log('Sesión registrada:', response);
        this.isRegistrando = false;

        const registro = { fecha: this.getFechaHoy(), timestamp: Date.now() };
        localStorage.setItem(this.STORAGE_SESION_REGISTRADA, JSON.stringify(registro));
        localStorage.removeItem(this.STORAGE_PROGRESO);
        this.sesionYaRegistradaHoy = true;
        this.fechaUltimoRegistro = registro.fecha;

        this.showSuccessModal = true;
      },
      error: (error: any) => {
        console.error('Error al registrar sesión:', error);
        this.isRegistrando = false;

        let titulo = 'Error al registrar';
        let mensaje = 'Error al registrar la sesión. Por favor, intenta de nuevo.';

        if (error.status === 401) {
          titulo = 'Sesion expirada';
          mensaje = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
        } else if (error.status === 400) {
          titulo = 'Datos invalidos';
          mensaje = error.error?.message || 'Datos inválidos. Verifica la información.';
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }

        this.mostrarError(titulo, mensaje);
      }
    });
  }

  cerrarSuccessModal(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/user/dashboard']);
  }

  volver(): void {
    this.router.navigate(['/user/dashboard']);
  }
}