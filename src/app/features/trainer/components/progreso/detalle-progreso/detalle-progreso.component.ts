import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgresoService, DashboardSocio, SesionHistorial } from '../../../../../core/services/progreso.service';

@Component({
  selector: 'app-detalle-progreso',
  templateUrl: './detalle-progreso.component.html',
  styleUrls: ['./detalle-progreso.component.scss']
})
export class DetalleProgresoComponent implements OnInit {

  idSocio: number = 0;

  dashboard: DashboardSocio | null = null;
  historial: SesionHistorial[] = [];

  isLoading: boolean = true;
  error: string | null = null;

  // Acordeón: set con los IDs de sesiones expandidas
  sesionesExpandidas: Set<number> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private progresoService: ProgresoService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idSocio = Number(params['idSocio']) || 0;

      if (!this.idSocio) {
        this.error = 'No se especificó un socio válido';
        this.isLoading = false;
        return;
      }

      this.cargarTodo();
    });
  }

  cargarTodo(): void {
    this.isLoading = true;
    this.error = null;

    // Cargar dashboard y historial en paralelo
    let dashboardCargado = false;
    let historialCargado = false;

    const verificarCarga = () => {
      if (dashboardCargado && historialCargado) {
        this.isLoading = false;
      }
    };

    this.progresoService.getDashboardSocio(this.idSocio).subscribe({
      next: (data) => {
        this.dashboard = data;
        dashboardCargado = true;
        verificarCarga();
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        dashboardCargado = true;
        this.error = 'No se pudo cargar el progreso del socio.';
        verificarCarga();
      }
    });

    this.progresoService.getHistorialSocio(this.idSocio).subscribe({
      next: (data) => {
        this.historial = Array.isArray(data) ? data : [];
        historialCargado = true;
        verificarCarga();
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        historialCargado = true;
        this.historial = [];
        verificarCarga();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/trainer/progreso']);
  }

  // ==========================================
  // Acordeón
  // ==========================================
  toggleSesion(idSesion: number): void {
    if (this.sesionesExpandidas.has(idSesion)) {
      this.sesionesExpandidas.delete(idSesion);
    } else {
      this.sesionesExpandidas.add(idSesion);
    }
  }

  isSesionExpandida(idSesion: number): boolean {
    return this.sesionesExpandidas.has(idSesion);
  }

  // ==========================================
  // Helpers
  // ==========================================
  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      const d = new Date(fecha);
      const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} - ${hh}:${mm}`;
    } catch {
      return fecha;
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'COMPLETADO': return 'estado--completado';
      case 'PARCIAL': return 'estado--parcial';
      case 'NO_REALIZADO': return 'estado--no-realizado';
      default: return '';
    }
  }

  getProgresoClass(estado: string): string {
    switch (estado) {
      case 'PROGRESO': return 'progreso--positivo';
      case 'ESTANCADO': return 'progreso--estancado';
      case 'RETROCESO': return 'progreso--negativo';
      default: return 'progreso--neutro';
    }
  }
}