import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RutinasService, RutinaDetalle } from '../../../../../core/services/rutinas.service';

@Component({
  selector: 'app-exportar-rutina',
  templateUrl: './exportar-rutina.component.html',
  styleUrls: ['./exportar-rutina.component.scss']
})
export class ExportarRutinaComponent implements OnInit {
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public rutinas: RutinaDetalle[] = [];

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  constructor(
    private router: Router,
    private rutinasService: RutinasService
  ) {}

  ngOnInit(): void {
    this.cargarRutinas();
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
          this.errorMessage = 'No tienes rutinas guardadas.';
          return;
        } else if (error.status === 500) {
          this.errorModalTitle = 'Error del servidor';
          this.errorModalMessage = 'El servidor no esta disponible. Por favor, intenta mas tarde.';
        } else {
          this.errorModalTitle = 'Error al cargar';
          this.errorModalMessage = error.error?.message || 'Error al cargar las rutinas.';
        }
        this.showErrorModal = true;
      }
    });
  }

  getDiasPorSemana(detalles: any[]): number {
    if (!detalles || detalles.length === 0) return 0;
    const dias = new Set(detalles.map(d => d.diaSemana));
    return dias.size;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    return `${dia} ${mes} ${anio}`;
  }

  exportarUnaRutina(idRutina: number): void {
    if (!idRutina) return;

    this.isLoading = true;

    this.rutinasService.exportarRutinaPDF(idRutina).subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const rutina = this.rutinas.find(r => r.idRutina === idRutina);
        link.download = `rutina-${rutina?.nombre || idRutina}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al exportar PDF:', error);
        this.errorModalTitle = 'Error al exportar';
        this.errorModalMessage = error.error?.message || 'No se pudo exportar el PDF. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  exportarUltimaRutina(): void {
    this.isLoading = true;

    this.rutinasService.exportarUltimaRutinaPDF().subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rutina-ultima.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al exportar ultima rutina:', error);
        this.errorModalTitle = 'Error al exportar';
        this.errorModalMessage = error.error?.message || 'No se pudo exportar la ultima rutina. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/user/rutinas']);
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