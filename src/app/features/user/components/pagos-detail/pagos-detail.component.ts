// src/app/features/user/components/pagos-detail/pagos-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserPaymentService } from '../../../../core/services/user-payment.service';
import { PagoSocio } from '../../models/user-pagos.model';

@Component({
  selector: 'app-pagos-detail',
  templateUrl: './pagos-detail.component.html',
  styleUrls: ['./pagos-detail.component.scss']
})
export class PagosDetailComponent implements OnInit {
  pago: PagoSocio | null = null;

  constructor(
    private route: ActivatedRoute,
    private userPaymentService: UserPaymentService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.userPaymentService.obtenerMiHistorialPagos().subscribe({
        next: (res) => {
          const historial: PagoSocio[] = res.historialPagos || [];
          this.pago = historial.find(p => p.idPago === id) || null;
        },
        error: (err) => {
          console.error('Error al cargar el detalle del pago', err);
        }
      });
    }
  }
}