import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RutinasService, RutinaDetalle } from '../../../../core/services/rutinas.service';
import { UserService } from '../../../../core/services/users.service';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.component.html',
  styleUrls: ['./rutinas.component.scss']
})
export class RutinasComponent implements OnInit {
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public rutinas: RutinaDetalle[] = [];

  // NUEVO: control de acceso a IA
  public tieneAccesoIA: boolean = false;
  public validandoAcceso: boolean = true;

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error al cargar';
  public errorModalMessage: string = '';

  // NUEVO: modal de membresía requerida
  public showMembresiaModal: boolean = false;

  constructor(
    private router: Router,
    private rutinasService: RutinasService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.validarAccesoIA();
  }

  // NUEVO: valida si la membresía incluye IA antes de cargar rutinas
  validarAccesoIA(): void {
    this.validandoAcceso = true;

    // ✅ Usa getMiMembresiaActiva() que apunta al endpoint correcto
    this.userService.getMiMembresiaActiva().subscribe({
      next: (membresia: any) => {
        console.log('Membresía activa recibida:', membresia);
        console.log('¿incluyeIA?:', membresia?.incluyeIA);

        this.tieneAccesoIA = membresia?.incluyeIA === true;
        this.validandoAcceso = false;

        if (this.tieneAccesoIA) {
          // Solo cargamos las rutinas si tiene acceso
          this.cargarRutinas();
        } else {
          // Mostramos el modal bloqueante
          this.showMembresiaModal = true;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error al validar membresía:', error);
        this.validandoAcceso = false;
        this.tieneAccesoIA = false;
        this.isLoading = false;
        this.showMembresiaModal = true;
      }
    });
  }

  cargarRutinas(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rutinasService.getMisRutinas().subscribe({
      next: (response: RutinaDetalle[]) => {
        this.rutinas = response || [];
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al cargar rutinas:', error);

        if (error.status === 401) {
          this.errorModalTitle = 'Sesion expirada';
          this.errorModalMessage = 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.';
        } else if (error.status === 404) {
          this.rutinas = [];
          this.errorMessage = 'No tienes rutinas guardadas. Genera una con IA.';
          this.isLoading = false;
          return;
        } else if (error.status === 500) {
          this.errorModalTitle = 'Error del servidor';
          this.errorModalMessage = 'El servidor no esta disponible. Por favor, intenta mas tarde.';
        } else {
          this.errorModalTitle = 'Error al cargar';
          this.errorModalMessage = error.error?.message || 'Ocurrio un error al cargar las rutinas.';
        }
        this.showErrorModal = true;
      }
    });
  }

  // NUEVO: redirige a membresías o cierra el modal
  irAMembresias(): void {
    this.showMembresiaModal = false;
    this.router.navigate(['/user/membresias']);
  }

  // Método para crear rutina IA — solo accesible si tiene membresía
  crearRutinaIA(): void {
    if (!this.tieneAccesoIA) {
      this.showMembresiaModal = true;
      return;
    }
    this.router.navigate(['/user/rutinas/crear-ia']);
  }

  // Método para exportar rutina
  exportarRutina(): void {
    this.router.navigate(['/user/rutinas/exportar']);
  }

  // Método para ver detalles de una rutina
  verDetalle(routineId: number): void {
    this.router.navigate(['/user/rutinas/detalle', routineId]);
  }

  public formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    return `${dia} ${mes} ${anio}`;
  }

  public getDiasPorSemana(detalles: any[]): number {
    if (!detalles || detalles.length === 0) return 0;
    const dias = new Set(detalles.map(d => d.diaSemana));
    return dias.size;
  }

  onRetry(): void {
    this.showErrorModal = false;
    this.cargarRutinas();
  }

  onCloseModal(): void {
    this.showErrorModal = false;
    if (this.errorModalTitle === 'Sesion expirada') {
      this.router.navigate(['/auth/login']);
    }
  }
}