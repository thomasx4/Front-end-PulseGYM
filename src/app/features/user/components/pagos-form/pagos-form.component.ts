import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserPaymentService } from '../../../../core/services/user-payment.service';
import Swal from 'sweetalert2';
import { environment } from '../../../../../environments/environment.prod';

declare const MercadoPago: any;

@Component({
  selector: 'app-pagos-form',
  templateUrl: './pagos-form.component.html',
  styleUrls: ['./pagos-form.component.scss']
})
export class PagosFormComponent implements OnInit, AfterViewInit {
  idSocioMembresia: number | null = null;
  membresiaActiva: any = null;
  emailSocio: string = 'socio@pulse.com';
  loading: boolean = false;
  mpPublicKey: string = environment.cloudinary.MERCADOPAGO_PUBLIC_KEY;
  
  // Propiedad para la opción elegida por el usuario
  tipoTarjetaSeleccionada: string = 'TARJETA_CREDITO';

  constructor(private userPaymentService: UserPaymentService, private router: Router) { }

  ngOnInit(): void {
    console.log('🔄 Inicializando PagosFormComponent...');
    this.cargarMembresiaActiva();
  }

  ngAfterViewInit(): void {}

  cargarMembresiaActiva(): void {
    console.log('📡 Solicitando información de membresía actual...');
    this.userPaymentService.obtenerMiHistorialPagos().subscribe({
      next: (res) => {
        console.log('✅ Respuesta de historial/membresía recibida:', res);
        this.membresiaActiva = res.membresiaActual;
        if (res.emailSocio) {
          this.emailSocio = res.emailSocio;
        }

        if (this.membresiaActiva && this.membresiaActiva.idSocioMembresia) {
          this.idSocioMembresia = this.membresiaActiva.idSocioMembresia;
          console.log('🆔 ID Socio Membresía detectado:', this.idSocioMembresia);
          this.inicializarPaymentBrick();
        } else {
          console.warn('⚠️ No se encontró una membresía activa asociada al usuario.');
        }
      },
      error: (err) => {
        console.error('❌ Error al obtener la membresía activa:', err);
        Swal.fire('Error', 'No se pudo cargar la información de tu membresía.', 'error');
      }
    });
  }

  async inicializarPaymentBrick() {
    if (typeof MercadoPago === 'undefined') {
      console.error('❌ SDK de Mercado Pago no está cargado.');
      Swal.fire('Error', 'El sistema de pagos no está disponible.', 'error');
      return;
    }

    console.log('💳 Inicializando Payment Brick con Public Key...');
    const mp = new MercadoPago(this.mpPublicKey, {
      locale: 'es-CO'
    });

    const bricksBuilder = mp.bricks();
    const montoPagar = this.membresiaActiva?.precioReal || 250000;

    const settings = {
      initialization: {
        amount: montoPagar,
        payer: {
          email: this.emailSocio,
        },
      },
      customization: {
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
        },
      },
      callbacks: {
        onReady: () => {
          console.log('✅ Payment Brick renderizado y listo.');
        },
        onSubmit: async (cardFormData: any) => {
          console.log('🚀 onSubmit disparado. Estructura recibida:', cardFormData);

          try {
            if (!this.idSocioMembresia) {
              Swal.fire('Atención', 'No hay una membresía seleccionada.', 'warning');
              throw new Error('idSocioMembresia es nulo');
            }

            const rawData = cardFormData?.formData || cardFormData;

            const token = rawData?.token;
            const paymentMethodId = rawData?.payment_method_id;
            const issuerId = rawData?.issuer_id;
            const installments = Number(rawData?.installments || 1);
            
            const payer = rawData?.payer || {};
            const identification = payer?.identification || {};
            
            const payerIdentificationType = identification?.type || 'CC';
            const payerIdentificationNumber = identification?.number || '123456789';
            const payerEmail = payer?.email || rawData?.email || this.emailSocio;

            if (!token || !paymentMethodId) {
              throw new Error('Faltan datos obligatorios de la tarjeta (token o paymentMethodId).');
            }

            const payload = {
              idSocioMembresia: this.idSocioMembresia,
              token: token,
              paymentMethodId: paymentMethodId,
              issuerId: issuerId,
              installments: installments,
              payerIdentificationType: payerIdentificationType,
              payerIdentificationNumber: payerIdentificationNumber,
              payerEmail: payerEmail,
              monto: montoPagar,
              metodoPago: this.tipoTarjetaSeleccionada // <--- Se envía el valor seleccionado explícitamente por el socio (TARJETA_CREDITO o TARJETA_DEBITO)
            };

            console.log('📤 Payload blindado listo para enviar al backend:', payload);

            const res: any = await this.userPaymentService.procesarPagoToken(payload).toPromise();
            
            console.log('✅ Respuesta exitosa del backend:', res);
            Swal.fire('¡Éxito!', res.mensaje || 'Pago procesado correctamente.', 'success');
            this.router.navigate(['/user/pagos']);

          } catch (err: any) {
            console.error('❌ ERROR ATRAPADO EN onSubmit:', err);
            const mensajeError = err?.error?.message || err?.error || err?.message || 'No se pudo procesar el pago.';
            Swal.fire('Error en el pago', typeof mensajeError === 'string' ? mensajeError : JSON.stringify(mensajeError), 'error');
            throw err;
          }
        },
        onError: (error: any) => {
          console.error('❌ Error interno reportado por el Brick de Mercado Pago:', error);
        },
      },
    };

    window.setTimeout(async () => {
      try {
        const container = document.getElementById('paymentBrick_container');
        if (container) {
          container.innerHTML = '';
        }
        
        await bricksBuilder.create('payment', 'paymentBrick_container', settings);
        console.log('✨ Payment Brick creado con éxito en el DOM.');
      } catch (e) {
        console.error('❌ Error crítico creando el Payment Brick:', e);
      }
    }, 300);
  }
}