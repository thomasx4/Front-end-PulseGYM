import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserPaymentService } from '../../../../core/services/user-payment.service';
import { PagoSocio, FiltroPagosRequest } from '../../models/user-pagos.model';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { lastValueFrom } from 'rxjs';
import JSZip from 'jszip';

export interface PagoSocioUI extends PagoSocio {
  selected?: boolean;
}

@Component({
  selector: 'app-pagos-list',
  templateUrl: './pagos-list.component.html',
  styleUrls: ['./pagos-list.component.scss']
})
export class PagosListComponent implements OnInit {
  pagosList: PagoSocioUI[] = [];
  membresiaActiva: any = null;
  selectedPayment: PagoSocioUI | null = null;
  loading: boolean = false;

  currentPage: number = 0;
  pageSize: number = 7;
  totalPages: number = 1;
  totalElements: number = 0;

  startDateStr: string = '';
  endDateStr: string = '';

  filtroActual: FiltroPagosRequest = {
    search: '',
    estado: 'TODOS',
    metodoPago: 'TODOS',
    fechaInicio: null,
    fechaFin: null
  };

  constructor(private userPaymentService: UserPaymentService, private router: Router) {}

  ngOnInit(): void {
    this.cargarDatosPagos();
  }

  cargarDatosPagos(): void {
    this.loading = true;

    const payload: FiltroPagosRequest = {
      page: this.currentPage,
      size: this.pageSize,
      search: this.filtroActual.search && this.filtroActual.search.trim() !== '' ? this.filtroActual.search.trim() : null,
      estado: this.filtroActual.estado && this.filtroActual.estado !== 'TODOS' ? this.filtroActual.estado : null,
      metodoPago: this.filtroActual.metodoPago && this.filtroActual.metodoPago !== 'TODOS' ? this.filtroActual.metodoPago : null,
      fechaInicio: this.startDateStr ? `${this.startDateStr}T00:00:00` : null,
      fechaFin: this.endDateStr ? `${this.endDateStr}T23:59:59` : null
    };

    this.userPaymentService.filtrarMisPagosPaginados(payload).subscribe({
      next: (res) => {
        this.pagosList = (res.content || []).map((p: PagoSocio) => ({ ...p, selected: false }));
        this.totalPages = res.totalPages || 1;
        this.totalElements = res.totalElements || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al filtrar historial de pagos', err);
        this.pagosList = [];
        this.loading = false;
      }
    });
  }

  get pagosSeleccionadosCount(): number {
    return this.pagosList.filter(p => p.selected).length;
  }

  get todosSeleccionados(): boolean {
    if (this.pagosList.length === 0) return false;
    return this.pagosList.every(p => p.selected);
  }

  toggleSeleccionarTodos(event: any): void {
    const checked = event.target.checked;
    this.pagosList.forEach(p => p.selected = checked);
  }

  limpiarSeleccionPagos(): void {
    this.pagosList.forEach(p => p.selected = false);
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.cargarDatosPagos();
  }

  clearFilters(): void {
    this.filtroActual.search = '';
    this.filtroActual.estado = 'TODOS';
    this.filtroActual.metodoPago = 'TODOS';
    this.startDateStr = '';
    this.endDateStr = '';
    this.currentPage = 0;
    this.cargarDatosPagos();
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages && p !== this.currentPage) {
      this.currentPage = p;
      this.cargarDatosPagos();
    }
  }

  get pagesArray(): number[] {
    const max = 5;
    let start = Math.max(0, this.currentPage - 2);
    let end = start + max;
    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(0, end - max);
    }
    return Array.from({ length: end - start }, (_, i) => start + i);
  }

  get startIndex(): number {
    return this.totalElements === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  onSelectPayment(item: PagoSocioUI, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedPayment = item;
  }

  exportarSeleccionadosZIP(): void {
    const seleccionados = this.pagosList.filter(p => p.selected);
    if (seleccionados.length === 0) return;
    this.procesarExportacionZIP(seleccionados, 'comprobantes-seleccionados.zip');
  }

  exportarTodosPagosZIP(): void {
    if (this.totalElements === 0) return;
    
    this.loading = true;
    const payload: FiltroPagosRequest = {
      page: 0,
      size: this.totalElements || 1000,
      search: this.filtroActual.search && this.filtroActual.search.trim() !== '' ? this.filtroActual.search.trim() : null,
      estado: this.filtroActual.estado && this.filtroActual.estado !== 'TODOS' ? this.filtroActual.estado : null,
      metodoPago: this.filtroActual.metodoPago && this.filtroActual.metodoPago !== 'TODOS' ? this.filtroActual.metodoPago : null,
      fechaInicio: this.startDateStr ? `${this.startDateStr}T00:00:00` : null,
      fechaFin: this.endDateStr ? `${this.endDateStr}T23:59:59` : null
    };

    this.userPaymentService.filtrarMisPagosPaginados(payload).subscribe({
      next: (res) => {
        const todos = res.content || [];
        this.loading = false;
        if (todos.length === 0) return;
        this.procesarExportacionZIP(todos, 'todos-mis-comprobantes-pago.zip');
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al obtener todos los pagos para exportar', err);
        Swal.fire('Error', 'No se pudieron recuperar los pagos para exportar.', 'error');
      }
    });
  }

  private async procesarExportacionZIP(listaPagos: PagoSocio[], nombreZip: string): Promise<void> {
    this.loading = true;
    const zip = new JSZip();

    try {
      for (const pago of listaPagos) {
        try {
          const blob = await lastValueFrom(this.userPaymentService.descargarComprobantePDFPropio(pago.idPago));
          const fechaStr = pago.fechaPago ? new Date(pago.fechaPago).toISOString().split('T')[0] : 'fecha';
          const nombreArchivo = `comprobante_pago_${pago.idPago}_${pago.nombreMembresia || 'plan'}_${fechaStr}.pdf`;
          
          zip.file(nombreArchivo, blob);
        } catch (itemErr) {
          console.warn(`No se pudo descargar el comprobante con ID ${pago.idPago}`, itemErr);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      this.loading = false;
      await this.procesarArchivoIndividual(content, nombreZip);
    } catch (err) {
      this.loading = false;
      console.error('Error al generar ZIP de comprobantes:', err);
      Swal.fire('Error', 'Ocurrió un error al empaquetar los comprobantes en ZIP.', 'error');
    }
  }

  async descargarPdf(idPago: number, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    this.userPaymentService.descargarComprobantePDFPropio(idPago).subscribe({
      next: async (blob) => {
        const fileName = `comprobante-pago-${idPago}.pdf`;
        await this.procesarArchivoIndividual(blob, fileName);
      },
      error: (err) => {
        console.error('Error al descargar el PDF desde el servidor', err);
        Swal.fire('Error', 'No se pudo obtener el comprobante del servidor', 'error');
      }
    });
  }

  private async procesarArchivoIndividual(blob: Blob, fileName: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await Filesystem.requestPermissions();
        } catch (permErr) {
          console.warn('Permisos no disponibles o denegados automáticamente:', permErr);
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
              title: 'Comprobante de Pago Pulse Gym',
              url: savedFile.uri,
              dialogTitle: 'Abrir o guardar comprobante'
            });
          } catch (fsError: any) {
            console.error('Error al guardar archivo en móvil:', fsError);
            Swal.fire('Error', 'No se pudo abrir el comprobante en el dispositivo: ' + (fsError.message || fsError), 'error');
          }
        };
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error procesando el PDF:', err);
      Swal.fire('Error', 'Ocurrió un error al procesar el comprobante', 'error');
    }
  }

    // ⬇️ Pega esto junto, tal cual:
  isSidebarOpen: boolean = false;

  // ==========================================
  // Sidebar móvil
  // ==========================================
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}