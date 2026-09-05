import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PaymentService } from '../../../../core/services/payment.service';
import { MembershipService, SocioAsignado, FiltrosSociosMembresias } from '../../../../core/services/membership.service';
import { RegistrarPagoRequestDTO } from '../../../../core/models/payment';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  loading: boolean = false;

  showPartnerModal: boolean = false;
  listaSociosMembresias: SocioAsignado[] = [];
  selectedSocioMembresia: SocioAsignado | null = null;
  searchUsuario: string = '';

  paginaModalActual: number = 0;
  itemsPorPaginaModal: number = 5;
  totalElementosModal: number = 0;
  totalPaginasModal: number = 0;
  loadingModalUsers: boolean = false;

  avatarSelectedError: boolean = false;
  modalAvatarErrors: Set<number> = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private membershipService: MembershipService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.paymentForm = this.fb.group({
      idSocioMembresia: [null, [Validators.required, Validators.min(1)]],
      metodoPago: ['EFECTIVO', Validators.required],
      cantidadDias: [15, [Validators.min(1), Validators.max(365)]],
      observaciones: ['', Validators.maxLength(250)]
    });
  }


  abrirModalSeleccionSocio(): void {
    this.searchUsuario = '';
    this.paginaModalActual = 0;
    this.showPartnerModal = true;
    this.cargarSociosMembresiasModal();
  }

  cerrarModalSeleccionSocio(): void {
    this.showPartnerModal = false;
  }

  filtrarSociosModal(): void {
    this.paginaModalActual = 0;
    this.cargarSociosMembresiasModal();
  }

  cargarSociosMembresiasModal(): void {
    this.loadingModalUsers = true;
    const filtros: FiltrosSociosMembresias = {
      pagina: this.paginaModalActual,
      tamanio: this.itemsPorPaginaModal
    };

    if (this.searchUsuario && this.searchUsuario.trim() !== '') {
      filtros.busqueda = this.searchUsuario.trim();
    }

    this.membershipService.getSociosActivosPaginadosServer(filtros).subscribe({
      next: (res: any) => {
        this.loadingModalUsers = false;
        this.listaSociosMembresias = res.content || [];
        this.totalElementosModal = res.totalElements || 0;
        this.totalPaginasModal = res.totalPages || 0;
      },
      error: (err) => {
        console.error('Error al cargar socios con membresía', err);
        this.listaSociosMembresias = [];
        this.totalElementosModal = 0;
        this.totalPaginasModal = 0;
        this.loadingModalUsers = false;
      }
    });
  }

  irPaginaModal(pZeroBased: number): void {
    if (pZeroBased !== this.paginaModalActual && pZeroBased >= 0 && pZeroBased < this.totalPaginasModal) {
      this.paginaModalActual = pZeroBased;
      this.cargarSociosMembresiasModal();
    }
  }

  paginaAnteriorModal(): void {
    if (this.paginaModalActual > 0) {
      this.irPaginaModal(this.paginaModalActual - 1);
    }
  }

  paginaSiguienteModal(): void {
    if (this.paginaModalActual < this.totalPaginasModal - 1) {
      this.irPaginaModal(this.paginaModalActual + 1);
    }
  }

  get paginasVisiblesModal(): number[] {
    const maxVisibles = 4;
    let inicio = Math.max(0, this.paginaModalActual - 1);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPaginasModal) {
      fin = this.totalPaginasModal;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  seleccionarSocioDesdeModal(socio: SocioAsignado): void {
    this.selectedSocioMembresia = socio;
    this.avatarSelectedError = false;
    this.paymentForm.patchValue({ 
      idSocioMembresia: socio.idSocioMembresia,
      cantidadDias: (socio as any).cantidadDias || 15
    });
    this.cerrarModalSeleccionSocio();

    Swal.fire({
      icon: 'success',
      title: 'Membresía Seleccionada',
      text: `${socio.nombreCompleto} ha sido asignado para el pago.`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  limpiarSeleccion(): void {
    this.selectedSocioMembresia = null;
    this.avatarSelectedError = false;
    this.paymentForm.patchValue({ idSocioMembresia: null });
  }

  get esMembresiaFlexible(): boolean {
    return !!(
      this.selectedSocioMembresia?.esFlexible || 
      (this.selectedSocioMembresia as any)?.flexible || 
      this.selectedSocioMembresia?.membresia?.esFlexible
    );
  }


  onAvatarError(): void {
    this.avatarSelectedError = true;
  }

  hasAvatarError(): boolean {
    return this.avatarSelectedError;
  }

  onModalAvatarError(idSocioMembresia: number): void {
    if (idSocioMembresia) {
      this.modalAvatarErrors.add(idSocioMembresia);
    }
  }

  hasModalAvatarError(idSocioMembresia: number): boolean {
    return this.modalAvatarErrors.has(idSocioMembresia);
  }

  getInitials(nombreCompleto?: string): string {
    if (!nombreCompleto) return '?';
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    }
    return partes[0].charAt(0).toUpperCase();
  }


  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, completa los campos requeridos correctamente.',
        confirmButtonColor: '#0e3b72'
      });
      return;
    }

    this.loading = true;
    const formValue = this.paymentForm.value;

    const requestDTO: RegistrarPagoRequestDTO & { cantidadDias?: number } = {
      idSocioMembresia: Number(formValue.idSocioMembresia),
      metodoPago: formValue.metodoPago,
      observaciones: formValue.observaciones ? formValue.observaciones.trim() : undefined,
      ...(this.esMembresiaFlexible && { cantidadDias: Number(formValue.cantidadDias) })
    };

    this.paymentService.registrarPago(requestDTO).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: '¡Pago Registrado!',
          text: 'El pago se ha registrado exitosamente.',
          timer: 2000,
          showConfirmButton: false
        });
        this.router.navigate(['/dashboard-admin/payments']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al registrar pago', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo registrar el pago: ' + (err.error?.message || err.message),
          confirmButtonColor: '#0e3b72'
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard-admin/payments']);
  }
}