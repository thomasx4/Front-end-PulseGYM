import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NutricionalService, PlanNutricionalReal } from '../../../../../core/services/nutricional.service';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { lastValueFrom } from 'rxjs';
import JSZip from 'jszip';

export interface PlanNutricionalUI extends PlanNutricionalReal {
  selected?: boolean;
}

@Component({
  selector: 'app-exportar-plan',
  templateUrl: './exportar-plan.component.html',
  styleUrls: ['./exportar-plan.component.scss']
})
export class ExportarPlanComponent implements OnInit {
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public planes: PlanNutricionalUI[] = [];

  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  constructor(
    private router: Router,
    private nutricionalService: NutricionalService
  ) {}

  ngOnInit(): void {
    this.cargarPlanes();
  }

  cargarPlanes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.nutricionalService.getMisPlanes().subscribe({
      next: (response: PlanNutricionalReal[]) => {
        this.planes = (response || []).map(p => ({ ...p, selected: false }));
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al cargar planes:', error);

        if (error.status === 401) {
          this.errorModalTitle = 'Sesión expirada';
          this.errorModalMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 404) {
          this.planes = [];
          this.errorMessage = 'No tienes planes nutricionales guardados.';
          return;
        } else if (error.status === 500) {
          this.errorModalTitle = 'Error del servidor';
          this.errorModalMessage = 'El servidor no está disponible. Por favor, intenta más tarde.';
        } else {
          this.errorModalTitle = 'Error al cargar';
          this.errorModalMessage = error.error?.message || 'Error al cargar los planes.';
        }
        this.showErrorModal = true;
      }
    });
  }

  get planesSeleccionadosCount(): number {
    return this.planes.filter(p => p.selected).length;
  }

  get todosSeleccionados(): boolean {
    if (this.planes.length === 0) return false;
    return this.planes.every(p => p.selected);
  }

  toggleSeleccionarTodos(event: any): void {
    const checked = event.target.checked;
    this.planes.forEach(p => p.selected = checked);
  }

  limpiarSeleccionPlanes(): void {
    this.planes.forEach(p => p.selected = false);
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    return `${dia} ${mes} ${anio}`;
  }

  exportarPlanEspecifico(idPlan: number): void {
    if (!idPlan) return;

    this.isLoading = true;
    const plan = this.planes.find(p => p.idPlanNutricional === idPlan);
    const fechaStr = plan?.fechaGeneracion ? this.formatearFecha(plan.fechaGeneracion) : '';
    const tipoPlan = plan?.generadoPorIA ? 'IA' : idPlan;
    const fileName = `plan-nutricional_${tipoPlan}_${fechaStr}_id${idPlan}.pdf`;

    this.nutricionalService.exportarPlanPDF(idPlan).subscribe({
      next: async (blob: Blob) => {
        this.isLoading = false;
        await this.procesarArchivoIndividual(blob, fileName);
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

  exportarUltimoPlan(): void {
    this.isLoading = true;
    const fileName = `plan-nutricional-ultimo.pdf`;

    this.nutricionalService.exportarUltimoPlanPDF().subscribe({
      next: async (blob: Blob) => {
        this.isLoading = false;
        await this.procesarArchivoIndividual(blob, fileName);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al exportar último plan:', error);
        this.errorModalTitle = 'Error al exportar';
        this.errorModalMessage = error.error?.message || 'No se pudo exportar el último plan. Por favor, intenta de nuevo.';
        this.showErrorModal = true;
      }
    });
  }

  exportarSeleccionadosZIP(): void {
    const seleccionados = this.planes.filter(p => p.selected);
    if (seleccionados.length === 0) return;
    this.procesarExportacionZIP(seleccionados, 'planes-nutricionales-seleccionados.zip');
  }

  exportarTodosPlanesZIP(): void {
    if (this.planes.length === 0) return;
    this.procesarExportacionZIP(this.planes, 'todos-mis-planes-nutricionales.zip');
  }

  private async procesarExportacionZIP(listaPlanes: PlanNutricionalUI[], nombreZip: string): Promise<void> {
    this.isLoading = true;
    const zip = new JSZip();

    try {
      for (const plan of listaPlanes) {
        try {
          const blob = await lastValueFrom(this.nutricionalService.exportarPlanPDF(plan.idPlanNutricional));
          const fechaStr = plan.fechaGeneracion ? this.formatearFecha(plan.fechaGeneracion) : '';
          const tipoPlan = plan.generadoPorIA ? 'IA' : plan.idPlanNutricional;
          
          const nombreArchivo = `plan-nutricional_${tipoPlan}_${fechaStr}_id${plan.idPlanNutricional}.pdf`;
          
          zip.file(nombreArchivo, blob);
        } catch (itemErr) {
          console.warn(`No se pudo descargar el plan con ID ${plan.idPlanNutricional}`, itemErr);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      this.isLoading = false;
      await this.procesarArchivoIndividual(content, nombreZip);
    } catch (err) {
      this.isLoading = false;
      console.error('Error al generar ZIP de planes:', err);
      Swal.fire('Error', 'Ocurrió un error al empaquetar los planes en ZIP.', 'error');
    }
  }

  private async procesarArchivoIndividual(blob: Blob, fileName: string): Promise<void> {
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
              title: 'Plan Nutricional Pulse Gym',
              url: savedFile.uri,
              dialogTitle: 'Abrir o compartir archivo'
            });
          } catch (fsError: any) {
            console.error('Error al guardar archivo en móvil:', fsError);
            Swal.fire('Error', 'No se pudo abrir el archivo en el dispositivo.', 'error');
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
      console.error('Error procesando archivo:', err);
      Swal.fire('Error', 'Ocurrió un error al procesar el archivo', 'error');
    }
  }

  volver(): void {
    this.router.navigate(['/user/plan-nutricional']);
  }

  onRetry(): void {
    this.showErrorModal = false;
    this.cargarPlanes();
  }

  onCloseModal(): void {
    this.showErrorModal = false;
    if (this.errorModalTitle === 'Sesión expirada') {
      this.router.navigate(['/auth/login']);
    }
  }
}