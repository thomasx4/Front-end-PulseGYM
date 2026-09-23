import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  AsistenciaService,
  RegistroSesionPayload,
  DetalleSesionPayload,
  RutinaDelDia,
  DetalleRutina
} from '../../../../core/services/asistencia.service';
import { AuthService } from '../../../../core/services/auth.service';

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

  public userId: number = 0;

  public rutina: RutinaDelDia | null = null;
  public ejercicios: EjercicioFormulario[] = [];

  public duracionMinutos: number = 60;
  public observaciones: string = '';

  public sesionYaRegistradaHoy: boolean = false;
  public fechaUltimoRegistro: string = '';

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
    private asistenciaService: AsistenciaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
  }

  ngOnDestroy(): void {
    if (this.midnightTimeoutId) {
      clearTimeout(this.midnightTimeoutId);
    }
  }

  cargarUsuario(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        if (user) {
          const nuevoUserId = typeof user.id === 'string' ? parseInt(user.id, 10) : (user.id || 0);

          const registroGuardado = localStorage.getItem(this.STORAGE_SESION_REGISTRADA);
          if (registroGuardado) {
            try {
              const reg = JSON.parse(registroGuardado);
              if (Number(reg.idUsuario) !== Number(nuevoUserId)) {
                localStorage.removeItem(this.STORAGE_SESION_REGISTRADA);
                localStorage.removeItem(this.STORAGE_PROGRESO);
              }
            } catch (e) {
              localStorage.removeItem(this.STORAGE_SESION_REGISTRADA);
            }
          }

          this.userId = nuevoUserId;
        }

        this.verificarSesionDelDia();
        this.programarCambioDeDia();
        this.cargarRutinaDelDia();
      },
      error: (err) => {
        this.verificarSesionDelDia();
        this.programarCambioDeDia();
        this.cargarRutinaDelDia();
      }
    });
  }

  private getFechaHoy(): string {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

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
    localStorage.removeItem(this.STORAGE_SESION_REGISTRADA);
    localStorage.removeItem(this.STORAGE_PROGRESO);

    this.sesionYaRegistradaHoy = false;
    this.fechaUltimoRegistro = '';

    this.duracionMinutos = 60;
    this.observaciones = '';

    this.cargarRutinaDelDia();
  }

  verificarSesionDelDia(): void {
    const data = localStorage.getItem(this.STORAGE_SESION_REGISTRADA);
    if (!data) {
      this.sesionYaRegistradaHoy = false;
      return;
    }

    try {
      const registro = JSON.parse(data);
      const hoy = this.getFechaHoy();

      const mismoDia = registro.fecha === hoy;
      const mismoUsuario = Number(registro.idUsuario) === Number(this.userId);

      if (mismoDia && mismoUsuario) {
        this.sesionYaRegistradaHoy = true;
        this.fechaUltimoRegistro = registro.fecha;
      } else {
        if (!mismoUsuario) {
          localStorage.removeItem(this.STORAGE_SESION_REGISTRADA);
          localStorage.removeItem(this.STORAGE_PROGRESO);
        }
        this.sesionYaRegistradaHoy = false;
      }
    } catch {
      localStorage.removeItem(this.STORAGE_SESION_REGISTRADA);
      this.sesionYaRegistradaHoy = false;
    }
  }

  cargarRutinaDelDia(): void {
    this.isLoading = true;

    this.asistenciaService.getUltimaRutina().subscribe({
      next: (rutina: RutinaDelDia) => {
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
        this.isLoading = false;

        if (error.status === 404) {
          this.abrirModalNoRutina();
        } else if (error.status === 401) {
          this.mostrarError(
            'Sesion expirada',
            'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.'
          );
        } else {
          this.mostrarError(
            'No se pudo cargar',
            error.error?.message || 'Error al cargar la rutina del dia. Por favor, intenta de nuevo.'
          );
        }
      }
    });
  }

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
    if (!data) {
      return;
    }

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

      this.ejercicios.forEach(ejActual => {
        const guardado = progreso.ejercicios.find(
          g => g.idDetalleRutina === ejActual.idDetalleRutina
        );

        if (guardado) {
          ejActual.seriesCompletadas = guardado.seriesCompletadas;
          ejActual.repeticionesRealizadas = guardado.repeticionesRealizadas;
          ejActual.pesoUsado = guardado.pesoUsado;
          ejActual.estado = guardado.estado;
          ejActual.observaciones = guardado.observaciones;
          ejActual.expandido = guardado.expandido;
        }
      });
    } catch (e) {
      console.warn('Error al restaurar progreso:', e);
    }
  }

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
    }
    if (this.duracionMinutos > 300) {
      this.duracionMinutos = 300;
    }
    this.guardarProgreso();
  }

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
  // Registrar sesion
  // ==========================================
  registrarSesion(): void {
    if (this.sesionYaRegistradaHoy) {
      this.mostrarError('Sesion ya registrada', 'Ya registraste tu sesion de hoy. Vuelve manana.');
      return;
    }

    if (!this.rutina) {
      this.mostrarError('Sin rutina', 'No hay rutina cargada para registrar.');
      return;
    }

    if (!this.duracionMinutos || this.duracionMinutos < 30) {
      this.mostrarError('Duracion invalida', 'La duracion minima de la sesion es de 30 minutos.');
      return;
    }

    // Validacion eliminada: ya no bloquea por seriesCompletadas = 0

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

    this.asistenciaService.registrarSesion(payload).subscribe({
      next: (response: any) => {
        this.isRegistrando = false;

        const registro = {
          fecha: this.getFechaHoy(),
          idUsuario: this.userId,
          timestamp: Date.now()
        };
        localStorage.setItem(this.STORAGE_SESION_REGISTRADA, JSON.stringify(registro));
        // NO se borra el progreso, se conserva por si se recarga

        this.sesionYaRegistradaHoy = true;
        this.fechaUltimoRegistro = registro.fecha;

        this.showSuccessModal = true;
      },
      error: (error: any) => {
        this.isRegistrando = false;

        let titulo = 'Error al registrar';
        let mensaje = 'Error al registrar la sesion. Por favor, intenta de nuevo.';

        if (error.status === 401) {
          titulo = 'Sesion expirada';
          mensaje = 'Tu sesion ha expirado. Inicia sesion nuevamente.';
        } else if (error.status === 400) {
          const mensajeBackend = error.error?.message || '';

          if (mensajeBackend.toLowerCase().includes('ya has registrado') ||
              mensajeBackend.toLowerCase().includes('dia de hoy') ||
              mensajeBackend.toLowerCase().includes('día de hoy')) {

            titulo = 'Sesion ya registrada';
            mensaje = mensajeBackend;

            const registro = {
              fecha: this.getFechaHoy(),
              idUsuario: this.userId,
              timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_SESION_REGISTRADA, JSON.stringify(registro));
            this.sesionYaRegistradaHoy = true;
            this.fechaUltimoRegistro = registro.fecha;
          } else {
            titulo = 'Datos invalidos';
            mensaje = mensajeBackend || 'Datos invalidos. Verifica la informacion.';
          }
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }

        this.mostrarError(titulo, mensaje);
      }
    });
  }

  cerrarSuccessModal(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/user/']);
  }

  volver(): void {
    this.router.navigate(['/user/']);
  }

    public isSidebarOpen: boolean = false;

      toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}