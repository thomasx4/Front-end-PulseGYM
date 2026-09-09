// src/app/features/user/components/pagos-list/pagos-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserPaymentService } from '../../../../core/services/user-payment.service';
import { PagoSocio, FiltroPagosRequest } from '../../models/user-pagos.model';

@Component({
  selector: 'app-pagos-list',
  templateUrl: './pagos-list.component.html',
  styleUrls: ['./pagos-list.component.scss']
})
export class PagosListComponent implements OnInit {
  pagosList: PagoSocio[] = [];
  membresiaActiva: any = null;
  selectedPayment: PagoSocio | null = null;
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
        this.pagosList = res.content || [];
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

  onSelectPayment(item: PagoSocio, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedPayment = item;
  }

  descargarPdf(idPago: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.userPaymentService.descargarComprobantePDFPropio(idPago).subscribe({
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