import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { RutinasService, RutinaDetalle } from '../../../../../core/services/rutinas.service';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
    const rutina = this.rutinas.find(r => r.idRutina === idRutina);
    const fileName = `rutina-${rutina?.nombre || idRutina}.pdf`;

    this.rutinasService.exportarRutinaPDF(idRutina).subscribe({
      next: async (blob: Blob) => {
        this.isLoading = false;
        await this.procesarPdfMovilOWeb(blob, fileName);
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
    const fileName = `rutina-ultima.pdf`;

    this.rutinasService.exportarUltimaRutinaPDF().subscribe({
      next: async (blob: Blob) => {
        this.isLoading = false;
        await this.procesarPdfMovilOWeb(blob, fileName);
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

  private async procesarPdfMovilOWeb(blob: Blob, fileName: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await Filesystem.requestPermissions();
        } catch (permErr) {
          console.warn('Permisos no disponibles o denegados:', permErr);
        }

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Content = base64data.includes(',') ? base64data.split(',')[1] : base64data;

          try {
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64Content,
              directory: Directory.Cache
            });

            await Share.share({
              title: 'Rutina Pulse Gym',
              url: savedFile.uri,
              dialogTitle: 'Abrir o compartir rutina PDF'
            });
          } catch (fsError: any) {
            console.error('Error al guardar archivo en móvil:', fsError);
            Swal.fire('Error', 'No se pudo abrir el archivo en el dispositivo: ' + (fsError.message || fsError), 'error');
          }
        };
      } else {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error procesando PDF:', err);
      Swal.fire('Error', 'Ocurrió un error al procesar el archivo', 'error');
    }
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