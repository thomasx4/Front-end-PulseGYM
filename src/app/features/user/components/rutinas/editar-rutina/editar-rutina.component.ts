import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RutinasService, RutinaDetalle, RutinaDetalleEjercicio } from '../../../../../core/services/rutinas.service';

interface DiaRutina {
  alias: string;
  nombre: string;
  enfoque: string;
  ejerciciosCount: number;
  duracionMin: number;
  colorClass: string;
  ejercicios: RutinaDetalleEjercicio[];
  diaNumero: number;
}

interface Equipamiento {
  nombre: string;
}

@Component({
  selector: 'app-editar-rutina',
  templateUrl: './editar-rutina.component.html',
  styleUrls: ['./editar-rutina.component.scss']
})
export class EditarRutinaComponent implements OnInit {
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public rutinaId: string = '';
  public diaExpandido: number | null = null;
  public guardando: boolean = false;
  public detallesOriginales: Map<number, RutinaDetalleEjercicio> = new Map();

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  public rutina: RutinaDetalle | null = null;
  public detallesPorDia: { [key: number]: RutinaDetalleEjercicio[] } = {};
  public equiposRutina: string[] = [];

  public dias: DiaRutina[] = [];
  public equipamiento: Equipamiento[] = [];

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
        this.procesarDias();
        this.procesarEquipamiento();
        // Guardar los valores originales para detectar cambios
        this.guardarOriginales();
        this.isLoading = false;
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

  guardarOriginales(): void {
    if (!this.rutina) return;
    this.detallesOriginales.clear();
    this.rutina.detalles.forEach(d => {
      if (d.idDetalle) {
        this.detallesOriginales.set(d.idDetalle, { ...d });
      }
    });
  }

  obtenerDetallesModificados(): RutinaDetalleEjercicio[] {
    if (!this.rutina) return [];

    const modificados: RutinaDetalleEjercicio[] = [];

    this.rutina.detalles.forEach(detalle => {
      if (!detalle.idDetalle) return;

      const original = this.detallesOriginales.get(detalle.idDetalle);
      if (!original) {
        modificados.push(detalle);
        return;
      }

      // Comparar si hubo cambios
      if (
        original.series !== detalle.series ||
        original.repeticionesMin !== detalle.repeticionesMin ||
        original.repeticionesMax !== detalle.repeticionesMax ||
        original.pesoSugerido !== detalle.pesoSugerido ||
        original.descansoSegundos !== detalle.descansoSegundos ||
        original.notas !== detalle.notas
      ) {
        modificados.push(detalle);
      }
    });

    return modificados;
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

  procesarDias(): void {
    if (!this.rutina) return;

    const colores = ['badge-lun', 'badge-mar', 'badge-mie', 'badge-jue', 'badge-vie', 'badge-sab', 'badge-dom'];
    const nombresDias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    const aliasDias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    this.dias = Object.keys(this.detallesPorDia)
      .map(key => Number(key))
      .sort((a, b) => a - b)
      .map((dia) => {
        const ejercicios = this.detallesPorDia[dia] || [];
        const index = (dia - 1) % 7;
        const semana = Math.floor((dia - 1) / 7) + 1;
        const nombreDia = semana > 1 ? `${nombresDias[index]} (Semana ${semana})` : nombresDias[index];
        const aliasDia = semana > 1 ? `${aliasDias[index]}${semana}` : aliasDias[index];

        return {
          alias: aliasDia,
          nombre: nombreDia,
          enfoque: this.obtenerEnfoque(ejercicios),
          ejerciciosCount: ejercicios.length,
          duracionMin: ejercicios.reduce((total, e) => total + (e.descansoSegundos || 60), 0) / 60 || 30,
          colorClass: colores[index] || 'badge-lun',
          ejercicios: ejercicios,
          diaNumero: dia
        };
      });
  }

  obtenerEnfoque(ejercicios: RutinaDetalleEjercicio[]): string {
    if (!ejercicios || ejercicios.length === 0) return 'Descanso';
    const grupos = ejercicios.map(e => e.grupoMuscular).filter(g => g);
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
    this.equipamiento = equiposArray.map(nombre => ({
      nombre: nombre
    }));

    this.equiposRutina = equiposArray;
  }

  toggleDia(index: number): void {
    this.diaExpandido = this.diaExpandido === index ? null : index;
  }

  get totalDiasConEjercicios(): number {
    return Object.keys(this.detallesPorDia).length;
  }

  get totalEjercicios(): number {
    let total = 0;
    Object.keys(this.detallesPorDia).forEach(key => {
      total += this.detallesPorDia[Number(key)]?.length || 0;
    });
    return total;
  }

  volver(): void {
    this.router.navigate(['/user/rutinas']);
  }

  guardarCambios(): void {
    if (!this.rutina) return;

    // Obtener solo los detalles modificados
    const modificados = this.obtenerDetallesModificados();

    if (modificados.length === 0) {
      this.errorModalTitle = 'Sin cambios';
      this.errorModalMessage = 'No has realizado ningún cambio para guardar.';
      this.showErrorModal = true;
      return;
    }

    console.log('Detalles modificados:', modificados);

    this.guardando = true;
    this.isLoading = true;
    this.errorMessage = '';

    // Enviar cada detalle modificado individualmente
    let completados = 0;

    modificados.forEach((detalle, index) => {
      // Construir el payload para cada ejercicio modificado
      const payload = {
        idDetalle: Number(detalle.idDetalle),
        series: Number(detalle.series),
        repeticionesMin: Number(detalle.repeticionesMin),
        repeticionesMax: Number(detalle.repeticionesMax),
        pesoSugerido: Number(detalle.pesoSugerido),
        descansoSegundos: Number(detalle.descansoSegundos),
        motivo: `Ajuste del socio - ${new Date().toLocaleDateString()}`
      };

      console.log(`Enviando detalle ${index + 1}/${modificados.length}:`, payload);

      // Llamar al servicio para guardar este detalle
      this.rutinasService.ajustarDetalle(this.rutinaId, payload).subscribe({
        next: (response: any) => {
          completados++;
          console.log(`Detalle ${index + 1} guardado correctamente:`, response);

          // Si ya se completaron todos, redirigir
          if (completados === modificados.length) {
            this.guardando = false;
            this.isLoading = false;
            this.router.navigate(['/user/rutinas/detalle', this.rutinaId]);
          }
        },
        error: (error: any) => {
          completados++;
          console.error(`Error al guardar detalle ${index + 1}:`, error);

          if (completados === modificados.length) {
            this.guardando = false;
            this.isLoading = false;
            this.errorModalTitle = 'Error al guardar';
            this.errorModalMessage = error.error?.message || 'Error al guardar los cambios.';
            this.showErrorModal = true;
          }
        }
      });
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