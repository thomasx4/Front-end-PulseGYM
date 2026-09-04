import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentService } from '../../../../core/services/payment.service';
import { Payment, PaymentSummaryDTO } from '../../../../core/models/payment';

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
  selectedTipo: string = 'TODOS';
  startDate: string = '';
  endDate: string = '';

  currentPage: number = 0;
  pageSize: number = 7;
  totalPages: number = 1;
  totalElements: number = 0;

  resumen: PaymentSummaryDTO = {
    ingresosMes: 8450000,
    pagosEsteMes: 128,
    pendientesCount: 15,
    vencidosCount: 7,
    completadosCount: 106
  };

  constructor(private paymentService: PaymentService, private router: Router) {}

  ngOnInit(): void {
    this.loadResumen();
  }

  loadResumen(): void {
    this.paymentService.getResumen().subscribe({
      next: (res) => { if (res) this.resumen = res; },
      error: () => {}
    });
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.paymentService.getPaginados(
      this.currentPage,
      this.pageSize,
      this.selectedEstado,
      this.selectedMetodo,
      this.selectedTipo,
      this.startDate,
      this.endDate,
      this.searchQuery
    ).subscribe({
      next: (res) => {
        this.paginatedRecords = res.content || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 1;
        this.loading = false;
        
        // Seleccionar por defecto el primer elemento si hay datos y ninguno está seleccionado
        if (this.paginatedRecords.length > 0 && !this.selectedPayment) {
          this.selectedPayment = this.paginatedRecords[0];
        }
      },
      error: () => {
        this.paginatedRecords = [];
        this.loading = false;
      }
    });
  }

  onSelectPayment(item: Payment): void {
    this.selectedPayment = item;
  }

  applyFilters(): void {
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
}