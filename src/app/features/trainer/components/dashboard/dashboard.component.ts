import { Component, OnInit } from '@angular/core';
import { TrainerService } from '../../../../core/services/trainer.service';
import { TrainerDashboard, SocioEvolucion } from '../../models/trainer.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  dashboardData: TrainerDashboard | null = null;
  sociosAsignados: any[] = [];
  socioSeleccionadoId: number | null = null;
  isLoading = true;

  entrenadorId: number = 5;

  constructor(private trainerService: TrainerService) { }

  ngOnInit(): void {
    this.cargarSociosAsignados();
  }

  cargarSociosAsignados(): void {
    this.trainerService.getSociosAsignados(this.entrenadorId).subscribe({
      next: (socios) => {
        this.sociosAsignados = socios;
        this.cargarDashboard();
      },
      error: (err) => {
        console.error('Error al cargar socios asignados', err);
        this.cargarDashboard();
      }
    });
  }

  cargarDashboard(): void {
    this.isLoading = true;
    this.trainerService.getTrainerDashboard(this.entrenadorId, this.socioSeleccionadoId ?? undefined).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el dashboard', err);
        this.isLoading = false;
      }
    });
  }

  verDetalleSocio(socio: any): void {
    const id = socio.idUsuario || socio.id;
    if (this.socioSeleccionadoId === id) {
      this.socioSeleccionadoId = null;
    } else {
      this.socioSeleccionadoId = id;
    }
    this.cargarDashboard();
  }

  onSocioChangeDropdown(event: any): void {
    const val = event.target.value;
    this.socioSeleccionadoId = (val === 'null' || !val) ? null : Number(val);
    this.cargarDashboard();
  }

  get modoIndividual(): boolean {
    return this.socioSeleccionadoId !== null;
  }

  get nombreSocioSeleccionado(): string {
    if (!this.socioSeleccionadoId) return '';
    const socio = this.sociosAsignados.find(s => (s.idUsuario || s.id) === Number(this.socioSeleccionadoId));
    return socio ? `${socio.nombre} ${socio.apellido}` : 'Socio';
  }

  get totalSociosAsignadosCount(): number {
    return this.sociosAsignados.length;
  }

  get promedioPesoActual(): number {
    if (!this.dashboardData?.sociosEvolucion || this.dashboardData.sociosEvolucion.length === 0) return 0;
    let sumaPesos = 0;
    let contador = 0;
    this.dashboardData.sociosEvolucion.forEach(s => {
      if (s.evolucionHistorica && s.evolucionHistorica.length > 0) {
        const historialOrdenado = [...s.evolucionHistorica].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        const ultimaMedicion = historialOrdenado[0];
        sumaPesos += ultimaMedicion.peso;
        contador++;
      }
    });
    return contador > 0 ? Number((sumaPesos / contador).toFixed(1)) : 0;
  }

  getPesoUltimoSocio(socioId: number): number {
    if (!this.dashboardData || !this.dashboardData.sociosEvolucion) return 0;
    const socioEvo = this.dashboardData.sociosEvolucion.find(s => s.socioId === Number(socioId));
    if (socioEvo && socioEvo.evolucionHistorica && socioEvo.evolucionHistorica.length > 0) {
      const historialOrdenado = [...socioEvo.evolucionHistorica].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      return historialOrdenado[0].peso;
    }
    return 0;
  }

  get sociosPendientesMedicion(): { nombre: string, diasSinActualizar: number }[] {
    if (!this.dashboardData?.sociosEvolucion || this.dashboardData.sociosEvolucion.length === 0) return [];

    const hoy = new Date().getTime();
    const umbralDias = 20;
    const alertas: { nombre: string, diasSinActualizar: number }[] = [];

    this.dashboardData.sociosEvolucion.forEach(evo => {
      let diasSinActualizar = 0;
      const socioInfo = this.sociosAsignados.find(s => (s.idUsuario || s.id) === Number(evo.socioId));
      const nombreCompleto = socioInfo ? `${socioInfo.nombre} ${socioInfo.apellido}` : evo.nombreSocio;

      if (evo.evolucionHistorica && evo.evolucionHistorica.length > 0) {
        const historialOrdenado = [...evo.evolucionHistorica].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        const fechaMasRecienteStr = historialOrdenado[0].fecha;

        const fechaUltimaMedicion = new Date(fechaMasRecienteStr).getTime();
        const diferenciaMs = hoy - fechaUltimaMedicion;
        diasSinActualizar = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
      } else {
        diasSinActualizar = 999;
      }

      if (diasSinActualizar >= umbralDias) {
        alertas.push({
          nombre: nombreCompleto,
          diasSinActualizar: diasSinActualizar === 999 ? 0 : diasSinActualizar
        });
      }
    });

    return alertas;
  }

  tieneDatosParaMostrar(): boolean {
    if (this.modoIndividual) {
      const evo = this.dashboardData?.sociosEvolucion?.find(s => s.socioId === Number(this.socioSeleccionadoId));
      return !!(evo && evo.evolucionHistorica && evo.evolucionHistorica.length > 0);
    } else {
      return this.sociosAsignados.length > 0;
    }
  }

  obtenerPuntosVisuales(): { posX: number, valor: number, labelTip: string, labelSub: string }[] {
    if (this.modoIndividual) {
      const evo = this.dashboardData?.sociosEvolucion?.find(s => s.socioId === Number(this.socioSeleccionadoId));
      if (!evo || !evo.evolucionHistorica || evo.evolucionHistorica.length === 0) return [];

      const historialCronologico = [...evo.evolucionHistorica].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      const total = historialCronologico.length;

      return historialCronologico.map((h, index) => {
        let posX = total === 1 ? 50 : (index / (total - 1)) * 70 + 15;
        let fechaFormateada = new Date(h.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        return {
          posX,
          valor: h.peso,
          labelTip: `Medición`,
          labelSub: fechaFormateada
        };
      });
    } else {
      if (!this.sociosAsignados || this.sociosAsignados.length === 0) return [];

      const total = this.sociosAsignados.length;
      return this.sociosAsignados.map((s, index) => {
        let peso = this.getPesoUltimoSocio(s.idUsuario || s.id);
        let posX = total === 1 ? 50 : (index / (total - 1)) * 70 + 15;
        return {
          posX,
          valor: peso,
          labelTip: s.nombre,
          labelSub: s.nombre
        };
      });
    }
  }

  private obtenerCoordenadasPuntosSVG(): { x: number, y: number }[] {
    const ptsVisuales = this.obtenerPuntosVisuales();
    if (ptsVisuales.length === 0) return [];

    let valores = ptsVisuales.map(p => p.valor);
    let maxVal = Math.max(...valores, 100);
    let minVal = Math.min(...valores, 40);
    let rango = maxVal - minVal || 1;

    return ptsVisuales.map(p => {
      let x = (p.posX / 100) * 500;
      let y = 170 - ((p.valor - minVal) / rango) * 130 - 20;
      return { x, y };
    });
  }

  generarRutaCurvaSVG(): string {
    const pts = this.obtenerCoordenadasPuntosSVG();
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      let p0 = pts[i];
      let p1 = pts[i + 1];
      let midX = (p0.x + p1.x) / 2;
      path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  }

  generarAreaCurvaSVG(): string {
    const pts = this.obtenerCoordenadasPuntosSVG();
    if (pts.length === 0) return '';
    const rutaLinea = this.generarRutaCurvaSVG();
    const ultimoX = pts[pts.length - 1].x;
    const primerX = pts[0].x;
    return `${rutaLinea} L ${ultimoX} 200 L ${primerX} 200 Z`;
  }

  get promedioGrasaActual(): number {
    if (!this.dashboardData?.sociosEvolucion || this.dashboardData.sociosEvolucion.length === 0) return 0;

    if (this.modoIndividual) {
      const evo = this.dashboardData.sociosEvolucion.find(s => s.socioId === Number(this.socioSeleccionadoId));
      if (evo && evo.evolucionHistorica && evo.evolucionHistorica.length > 0) {
        const historialOrdenado = [...evo.evolucionHistorica].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        return historialOrdenado[0].porcentajeGrasa;
      }
      return 0;
    }

    let sumaGrasa = 0;
    let contador = 0;
    this.dashboardData.sociosEvolucion.forEach(s => {
      if (s.evolucionHistorica && s.evolucionHistorica.length > 0) {
        const historialOrdenado = [...s.evolucionHistorica].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        sumaGrasa += historialOrdenado[0].porcentajeGrasa;
        contador++;
      }
    });
    return contador > 0 ? Number((sumaGrasa / contador).toFixed(1)) : 0;
  }

  get promedioMasaMuscularActual(): number {
    if (!this.dashboardData?.sociosEvolucion || this.dashboardData.sociosEvolucion.length === 0) return 0;

    if (this.modoIndividual) {
      const evo = this.dashboardData.sociosEvolucion.find(s => s.socioId === Number(this.socioSeleccionadoId));
      if (evo && evo.evolucionHistorica && evo.evolucionHistorica.length > 0) {
        const historialOrdenado = [...evo.evolucionHistorica].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        return historialOrdenado[0].masaMuscular;
      }
      return 0;
    }

    let sumaMasa = 0;
    let contador = 0;
    this.dashboardData.sociosEvolucion.forEach(s => {
      if (s.evolucionHistorica && s.evolucionHistorica.length > 0) {
        const historialOrdenado = [...s.evolucionHistorica].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        sumaMasa += historialOrdenado[0].masaMuscular;
        contador++;
      }
    });
    return contador > 0 ? Number((sumaMasa / contador).toFixed(1)) : 0;
  }
}