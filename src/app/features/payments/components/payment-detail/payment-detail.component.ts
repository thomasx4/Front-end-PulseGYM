import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, ParamMap } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.prod';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.scss']
})
export class PaymentDetailComponent implements OnInit {
  idPago: string | null = null;
  pagoDetalle: any = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      let rawId = params.get('idPago');

      if (rawId && rawId.includes('=')) {
        rawId = rawId.split('=')[1];
      }

      if (!rawId) {
        const urlPath = window.location.href;
        const match = urlPath.match(/idPago=(\d+)/) || urlPath.match(/\/(\d+)$/);
        if (match) {
          rawId = match[1];
        }
      }

      this.idPago = rawId;

      if (this.idPago) {
        this.consultarDetallePago(this.idPago);
      } else {
        this.isLoading = false;
        this.errorMessage = 'No se encontró un ID de pago válido en el código QR.';
      }
    });
  }

  consultarDetallePago(id: string): void {
    this.isLoading = true;

    const urlApi = `${environment.apiUrl}/pg-ms-users/api/v1/pagos/comprobante/${id}`;

    this.http.get(urlApi).subscribe({
      next: (data) => {
        this.pagoDetalle = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener el pago:', err);
        this.errorMessage = 'No se pudo verificar la información del pago o el comprobante no existe.';
        this.isLoading = false;
      }
    });
  }
}