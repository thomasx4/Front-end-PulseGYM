import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PaymentService } from '../../../../core/services/payment.service';
import { Payment, PaymentSummaryDTO, AnularPagoRequestDTO } from '../../../../core/models/payment';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss']
})
export class PaymentListComponent implements OnInit {
  paginatedRecords: Payment[] = [];
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
    pagosEsteMes: 0,
    pendientesCount: 0,
    vencidosCount: 0,
    completadosCount: 0
  };

  constructor(private paymentService: PaymentService, private router: Router) {}

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
        this.paginatedRecords = res.content || [];
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

  onSelectPayment(item: Payment, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedPayment = item;
  }

  // ANULAR PAGO CON SWEETALERT2
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

  descargarPdf(idPago: number): void {
    this.paymentService.descargarComprobantePDF(idPago).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante-pago-${idPago}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error al descargar el PDF', err)
    });
  }
}