import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PaymentService } from '../../../../core/services/payment.service';
import { Payment, PaymentSummaryDTO, AnularPagoRequestDTO } from '../../../../core/models/payment';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { forkJoin } from 'rxjs';
import JSZip from 'jszip';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss']
})
export class PaymentListComponent implements OnInit {
  paginatedRecords: (Payment & { selected?: boolean })[] = [];
  selectedPayment: Payment | null = null;
  loading: boolean = false;
  searchQuery: string = '';

  selectedEstado: string = 'TODOS';
  selectedMetodo: string = 'TODOS';
  startDate: string = '';
  endDate: string = '';

  currentPage: number = 0;
  pageSize: number = 7;
  totalPages: number = 1;
  totalElements: number = 0;

  resumen: PaymentSummaryDTO = {
    ingresosMes: 0,
    ingresosMesAnterior: 0,
    pagosEsteMes: 0,
    pendientesCount: 0,
    vencidosCount: 0,
    completadosCount: 0
  };

  constructor(private paymentService: PaymentService, private router: Router) { }

  ngOnInit(): void {
    this.loadResumen();
  }

  loadResumen(): void {
    this.paymentService.getResumen().subscribe({
      next: (res) => { if (res) this.resumen = res; },
      error: (err) => console.error('Error al cargar resumen', err)
    });
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;

    const filtroPayload = {
      page: this.currentPage,
      size: this.pageSize,
      search: this.searchQuery && this.searchQuery.trim() !== '' ? this.searchQuery.trim() : null,
      estado: this.selectedEstado && this.selectedEstado !== 'TODOS' ? this.selectedEstado : null,
      metodoPago: this.selectedMetodo && this.selectedMetodo !== 'TODOS' ? this.selectedMetodo : null,
      fechaInicio: this.startDate ? `${this.startDate}T00:00:00` : null,
      fechaFin: this.endDate ? `${this.endDate}T23:59:59` : null
    };

    this.paymentService.filtrarPagosPaginados(filtroPayload).subscribe({
      next: (res) => {
        const lista = res.content || [];
        this.paginatedRecords = lista.map((p: Payment) => ({ ...p, selected: false }));
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al filtrar pagos', err);
        this.paginatedRecords = [];
        this.loading = false;
      }
    });
  }

  get pagosSeleccionadosCount(): number {
    return this.paginatedRecords.filter(p => p.selected).length;
  }

  get todosSeleccionadosPagina(): boolean {
    const visibles = this.paginatedRecords;
    if (visibles.length === 0) return false;
    return visibles.every(p => p.selected);
  }

  toggleSeleccionarTodos(event: any): void {
    const checked = event.target.checked;
    this.paginatedRecords.forEach(p => p.selected = checked);
  }

  limpiarSeleccionPagos(): void {
    this.paginatedRecords.forEach(p => p.selected = false);
  }

  async anularPagosEnLote(): Promise<void> {
    const seleccionados = this.paginatedRecords.filter(p => p.selected && !p.anulado);
    if (seleccionados.length === 0) {
      Swal.fire('Información', 'No hay pagos válidos seleccionados para anular.', 'info');
      return;
    }

    const { value: motivoInput } = await Swal.fire({
      title: '¿Estás seguro de anular los pagos seleccionados?',
      text: `Se anularán ${seleccionados.length} pago(s).`,
      input: 'text',
      inputLabel: 'Motivo de anulación general',
      inputValue: 'Anulación masiva de pagos',
      inputPlaceholder: 'Escribe el motivo aquí...',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular todos',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return '¡Debes escribir un motivo de anulación!';
        }
        return null;
      }
    });

    if (motivoInput) {
      this.loading = true;
      const peticiones = seleccionados.map(p => {
        const payload: AnularPagoRequestDTO = {
          idPago: p.idPago,
          motivo: motivoInput.trim()
        };
        return this.paymentService.anularPago(payload);
      });

      forkJoin(peticiones).subscribe({
        next: () => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: '¡Pagos Anulados!',
            text: 'Los pagos seleccionados han sido anulados correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadResumen();
          if (this.selectedPayment && seleccionados.some(s => s.idPago === this.selectedPayment?.idPago)) {
            this.selectedPayment = null;
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error al anular pagos en lote', err);
          Swal.fire('Error', 'No se pudieron anular algunos pagos.', 'error');
          this.loadResumen();
        }
      });
    }
  }

  async descargarComprobantesEnLote(): Promise<void> {
    const seleccionados = this.paginatedRecords.filter(p => p.selected && p.idPago);
    if (seleccionados.length === 0) {
      Swal.fire('Información', 'No hay pagos seleccionados para descargar comprobantes.', 'info');
      return;
    }

    this.loading = true;
    const peticiones = seleccionados.map(p => this.paymentService.descargarComprobantePDF(p.idPago));

    forkJoin(peticiones).subscribe({
      next: async (blobs) => {
        const zip = new JSZip();

        blobs.forEach((blob, index) => {
          const idPago = seleccionados[index].idPago;
          const fileName = `comprobante-pago-${idPago}.pdf`;
          zip.file(fileName, blob);
        });

        try {
          const content = await zip.generateAsync({ type: 'blob' });
          this.loading = false;

          if (Capacitor.isNativePlatform()) {
            const reader = new FileReader();
            reader.readAsDataURL(content);
            reader.onloadend = async () => {
              const base64data = reader.result as string;
              const base64Content = base64data.includes(',') ? base64data.split(',')[1] : base64data;
              const zipFileName = `comprobantes-pagos-${Date.now()}.zip`;

              const savedFile = await Filesystem.writeFile({
                path: zipFileName,
                data: base64Content,
                directory: Directory.Documents
              });

              await Share.share({
                title: 'Comprobantes de Pago - Pulse Gym',
                url: savedFile.uri,
                dialogTitle: 'Compartir archivo ZIP'
              });
            };
          } else {
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comprobantes-pagos-${Date.now()}.zip`;
            a.click();
            window.URL.revokeObjectURL(url);
          }

          Swal.fire({
            icon: 'success',
            title: '¡ZIP Descargado!',
            text: `Se comprimieron y descargaron ${blobs.length} comprobante(s) en un archivo .zip exitosamente.`,
            timer: 2500,
            showConfirmButton: false
          });

        } catch (zipError) {
          this.loading = false;
          console.error('Error al generar el archivo ZIP', zipError);
          Swal.fire('Error', 'No se pudo empaquetar los comprobantes en el archivo ZIP.', 'error');
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al descargar comprobantes en lote', err);
        Swal.fire('Error', 'No se pudieron obtener algunos comprobantes del servidor.', 'error');
      }
    });
  }

  onSelectPayment(item: Payment, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedPayment = item;
  }

  async onAnularPago(item: Payment, event: Event): Promise<void> {
    event.stopPropagation();

    const { value: motivoInput } = await Swal.fire({
      title: '¿Estás seguro de anular este pago?',
      text: `ID del Pago: #${item.idPago}`,
      input: 'text',
      inputLabel: 'Motivo de anulación',
      inputValue: 'Pago duplicado - Se registró dos veces',
      inputPlaceholder: 'Escribe el motivo aquí...',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return '¡Debes escribir un motivo de anulación!';
        }
        return null;
      }
    });

    if (motivoInput) {
      const payload: AnularPagoRequestDTO = {
        idPago: item.idPago,
        motivo: motivoInput.trim()
      };

      this.paymentService.anularPago(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Pago Anulado!',
            text: 'El pago ha sido anulado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadResumen();
          if (this.selectedPayment?.idPago === item.idPago) {
            this.selectedPayment = null;
          }
        },
        error: (err) => {
          console.error('Error al anular el pago', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo anular el pago: ' + (err.error?.message || err.message)
          });
        }
      });
    }
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.fetchData();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedEstado = 'TODOS';
    this.selectedMetodo = 'TODOS';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 0;
    this.fetchData();
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages && p !== this.currentPage) {
      this.currentPage = p;
      this.fetchData();
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

  onNewPayment(): void {
    this.router.navigate(['/dashboard-admin/payments/new']);
  }

  async descargarPdf(idPago: number): Promise<void> {
    this.paymentService.descargarComprobantePDF(idPago).subscribe({
      next: async (blob) => {
        try {
          if (Capacitor.isNativePlatform()) {
            try {
              const permissionStatus = await Filesystem.requestPermissions();
              console.log('Estado de permisos:', permissionStatus);
            } catch (permErr) {
              console.warn('El sistema de permisos no está disponible o fue denegado:', permErr);
            }

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
              const base64data = reader.result as string;
              const base64Content = base64data.includes(',') ? base64data.split(',')[1] : base64data;
              const fileName = `comprobante-pago-${idPago}.pdf`;

              try {
                const savedFile = await Filesystem.writeFile({
                  path: fileName,
                  data: base64Content,
                  directory: Directory.ExternalStorage
                });

                Swal.fire({
                  icon: 'success',
                  title: '¡Comprobante Descargado!',
                  text: `Guardado correctamente en el dispositivo.`,
                  timer: 3000,
                  showConfirmButton: false
                });

                await Share.share({
                  title: 'Comprobante de Pago Pulse Gym',
                  url: savedFile.uri,
                  dialogTitle: 'Abrir o compartir comprobante'
                });

              } catch (fsError: any) {
                try {
                  const savedFileFallback = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Content,
                    directory: Directory.Documents
                  });

                  await Share.share({
                    title: 'Comprobante de Pago Pulse Gym',
                    url: savedFileFallback.uri,
                    dialogTitle: 'Abrir o compartir comprobante'
                  });
                } catch (fallbackErr: any) {
                  Swal.fire('Error', 'No se pudo guardar el archivo en el almacenamiento', 'error');
                }
              }
            };
          } else {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comprobante-pago-${idPago}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
          }
        } catch (err) {
          Swal.fire('Error', 'Ocurrió un error al procesar el comprobante', 'error');
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudo obtener el comprobante del servidor', 'error');
      }
    });
  }
}