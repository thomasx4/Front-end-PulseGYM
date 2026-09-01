import { Component, OnInit } from '@angular/core';
import {
  MembershipService,
  AsignacionRequest,
  AsignacionFlexibleRequest,
  RenovarRequest,
  SuspenderRequest,
  CancelarRequest,
} from '../../../../core/services/membership.service';
import Swal from 'sweetalert2';

export interface MembresiaUI {
  id: number;
  nombre: string;
  precio: number;
  periodo: string;
  beneficios: string[];
  estado: string;
  sociosActivos: number;
  incluyeIA: boolean;
  esFlexible: boolean;
}

export interface SocioUI {
  id: number;
  idSocioMembresia?: number;
  nombre: string;
  telefono: string;
  precioTotal?: number;
  fechaAsignacion?: string;
  fechaVencimiento?: string;
  fechaRegistro?: string;
  avatarUrl?: string;
  fotoUrl?: string;
  estado: string;
}

@Component({
  selector: 'app-assign-membership',
  templateUrl: './assign-membership.component.html',
  styleUrls: ['./assign-membership.component.scss'],
})
export class AssignMembershipComponent implements OnInit {
  // CONTROL DE VISTA
  vistaActual: 'tarjetas' | 'socios' = 'tarjetas';

  // DATOS
  membresias: MembresiaUI[] = [];
  membresiaSeleccionada: MembresiaUI | null = null;
  membresiasPorVencer: any[] = [];

  avatarErrors: Set<string> = new Set<string>();

  // MODAL DE ASIGNACIÓN
  mostrarModal: boolean = false;
  mostrarModalFlexible: boolean = false;
  searchTermModal: string = '';
  loading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  // MODAL FLEXIBLE
  diasFlexibles: number = 1;
  observacionesFlexible: string = '';

  // FILTROS
  searchTermSocios: string = '';

  // PAGINACIÓN MEMBRESÍAS (TARJETAS)
  paginaMembresiasActual: number = 1;
  itemsPorPaginaMembresias: number = 6;
  totalMembresiasBackend: number = 0;

  // SOCIOS ASIGNADOS (PAGINACIÓN)
  sociosAsignados: SocioUI[] = [];
  sociosAsignadosFiltrados: SocioUI[] = [];
  sociosPaginaActual: number = 1;
  sociosItemsPorPagina: number = 5;

  // SOCIOS MODAL (PAGINACIÓN)
  sociosModal: SocioUI[] = [];
  sociosFiltradosModal: SocioUI[] = [];
  sociosModalPaginaActual: number = 1;
  sociosModalItemsPorPagina: number = 5;

  // ACCIONES - Estado de carga
  accionEnProceso: boolean = false;

  // PAGINACIÓN POR VENCER
  paginaPorVencerActual: number = 1;
  readonly itemsPorPaginaPorVencer: number = 6;

  constructor(private membershipService: MembershipService) { }

  ngOnInit(): void {
    this.cargarDashboard(0);
  }

  cargarDashboard(page: number = 0): void {
    this.loading = true;
    this.errorMessage = '';

    this.membershipService.getDashboardMembresias(page, this.itemsPorPaginaMembresias).subscribe({
      next: (res: any) => {
        try {
          const responseBody = res?.data || res || {};

          const membresiasPaginadas = responseBody.membresiasPaginadas || responseBody.membresias || {};
          const listMembresias: any[] = Array.isArray(membresiasPaginadas)
            ? membresiasPaginadas
            : (membresiasPaginadas.content || responseBody.content || []);

          this.totalMembresiasBackend = membresiasPaginadas.totalElements ?? listMembresias.length;

          this.membresias = listMembresias.map((item: any) => ({
            id: Number(item.idMembresia || item.id),
            nombre: item.nombre || 'Sin nombre',
            precio: item.precioTotal ?? item.precio ?? 0,
            periodo: 'mo',
            beneficios: item.beneficios
              ? typeof item.beneficios === 'string'
                ? item.beneficios.split(',').map((b: string) => b.trim())
                : Array.isArray(item.beneficios) ? item.beneficios : [item.beneficios]
              : ['Sin beneficios'],
            estado: item.activo !== false ? 'Activa' : 'Inactiva',
            sociosActivos: item.sociosActivosCount ?? item.cantidadSocios ?? (item.sociosAsignados?.length || 0),
            incluyeIA: !!item.incluyeIA,
            esFlexible: !!item.esFlexible,
          }));

          const usuariosRaw = responseBody.usuariosActivos || [];
          const usuariosData = Array.isArray(usuariosRaw) ? usuariosRaw : (usuariosRaw.content || []);
          this.sociosModal = usuariosData.map((u: any) => ({
            id: Number(u.idUsuario || u.id),
            nombre: u.nombreCompleto || `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Usuario',
            telefono: u.telefono || u.celular || 'No disponible',
            fechaRegistro: this.formatearFecha(u.fechaRegistro || u.fechaCreacion || u.createdAt),
            fotoUrl: u.fotoUrl || u.fotoPerfil || u.foto || u.avatar || null,
            estado: u.estado || 'ACTIVO',
          }));
          this.sociosFiltradosModal = [...this.sociosModal];

          const porVencerRaw =
            responseBody.membresiasPorVencer ||
            responseBody.membresiasProximasAVencer ||
            responseBody.porVencer ||
            [];

          const porVencerData = Array.isArray(porVencerRaw)
            ? porVencerRaw
            : (porVencerRaw.content || []);

          this.membresiasPorVencer = porVencerData.map((item: any) => ({
            ...item,
            id: Number(item.idSocioMembresia || item.id || item.idSocio),
            idSocio: Number(item.idSocio || item.idUsuario || item.id),
            idSocioMembresia: Number(item.idSocioMembresia || item.id),
            nombreSocio: item.nombreSocio || item.nombreCompleto || item.nombre || 'Socio',
            tipoMembresia: item.tipoMembresia || item.nombreMembresia || item.membresia || 'Plan Activo',
            diasRestantes: item.diasRestantes ?? item.diasParaVencer ?? item.diasRestantesVencimiento ?? 0,
            fotoUrl: item.fotoUrl || item.fotoPerfil || item.foto || item.avatar || null,
          }));

        } catch (err) {
          console.error('Error al mapear la respuesta del dashboard:', err);
        } finally {
          this.loading = false;
        }
      },
      error: (error: any) => {
        console.error('Error HTTP al cargar dashboard:', error);
        this.errorMessage = error.error?.message || 'Error al conectar con el servidor de membresías.';
        this.loading = false;
      },
    });
  }

  // HELPER DE AVATAR Y FOTOS

  getFotoSocio(socio: any): string | null {
    if (!socio) return null;
    const directFoto =
      socio.fotoUrl ||
      socio.avatarUrl ||
      socio.fotoPerfil ||
      socio.foto ||
      socio.avatar;

    if (
      directFoto &&
      !directFoto.includes('ui-avatars.com') &&
      !directFoto.includes('default-avatar.png')
    ) {
      let rawUrl = String(directFoto).trim();
      if (rawUrl !== '' && rawUrl !== 'null' && rawUrl !== 'undefined') {
        return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
      }
    }
    return null;
  }

  onAvatarError(key: string | number): void {
    if (key) {
      this.avatarErrors.add(String(key));
    }
  }

  hasAvatarError(key: string | number): boolean {
    return this.avatarErrors.has(String(key));
  }

  getInitials(nombre?: string): string {
    if (!nombre) return 'U';
    const partes = nombre.trim().split(' ').filter((p) => p.length > 0);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  // GETTERS PAGINACIÓN MEMBRESÍAS

  get membresiasPaginadas(): MembresiaUI[] {
    return this.membresias;
  }

  get totalPaginasMembresias(): number {
    return Math.ceil(this.totalMembresiasBackend / this.itemsPorPaginaMembresias) || 1;
  }

  get paginasMembresias(): number[] {
    return Array.from({ length: this.totalPaginasMembresias }, (_, i) => i + 1);
  }

  // GETTERS PAGINACIÓN POR VENCER

  get membresiasPorVencerPaginadas(): any[] {
    const inicio = (this.paginaPorVencerActual - 1) * this.itemsPorPaginaPorVencer;
    return this.membresiasPorVencer.slice(inicio, inicio + this.itemsPorPaginaPorVencer);
  }

  get totalPaginasPorVencer(): number {
    return Math.ceil(this.membresiasPorVencer.length / this.itemsPorPaginaPorVencer) || 1;
  }

  get paginasPorVencer(): number[] {
    return Array.from({ length: this.totalPaginasPorVencer }, (_, i) => i + 1);
  }

  // GETTERS PAGINACIÓN SOCIOS

  get sociosPaginados(): SocioUI[] {
    const inicio = (this.sociosPaginaActual - 1) * this.sociosItemsPorPagina;
    return this.sociosAsignadosFiltrados.slice(inicio, inicio + this.sociosItemsPorPagina);
  }

  get totalSociosPaginas(): number {
    return Math.ceil(this.sociosAsignadosFiltrados.length / this.sociosItemsPorPagina) || 1;
  }

  get paginasSocios(): number[] {
    return Array.from({ length: this.totalSociosPaginas }, (_, i) => i + 1);
  }

  // GETTERS PAGINACIÓN MODAL

  get sociosModalPaginados(): SocioUI[] {
    const inicio = (this.sociosModalPaginaActual - 1) * this.sociosModalItemsPorPagina;
    return this.sociosFiltradosModal.slice(inicio, inicio + this.sociosModalItemsPorPagina);
  }

  get totalSociosModalPaginas(): number {
    return Math.ceil(this.sociosFiltradosModal.length / this.sociosModalItemsPorPagina) || 1;
  }

  get paginasModal(): number[] {
    return Array.from({ length: this.totalSociosModalPaginas }, (_, i) => i + 1);
  }

  // MÉTODOS DE PAGINACIÓN MEMBRESÍAS

  cambiarPaginaMembresias(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasMembresias) {
      this.paginaMembresiasActual = pagina;
      this.cargarDashboard(pagina - 1);
    }
  }

  paginaAnteriorMembresias(): void {
    if (this.paginaMembresiasActual > 1) {
      this.cambiarPaginaMembresias(this.paginaMembresiasActual - 1);
    }
  }

  paginaSiguienteMembresias(): void {
    if (this.paginaMembresiasActual < this.totalPaginasMembresias) {
      this.cambiarPaginaMembresias(this.paginaMembresiasActual + 1);
    }
  }

  // MÉTODOS DE PAGINACIÓN POR VENCER

  paginaAnteriorPorVencer(): void {
    if (this.paginaPorVencerActual > 1) {
      this.paginaPorVencerActual--;
    }
  }

  paginaSiguientePorVencer(): void {
    if (this.paginaPorVencerActual < this.totalPaginasPorVencer) {
      this.paginaPorVencerActual++;
    }
  }

  irAPaginaPorVencer(pagina: number): void {
    this.paginaPorVencerActual = pagina;
  }

  // MÉTODOS DE PAGINACIÓN SOCIOS

  cambiarPaginaSocios(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalSociosPaginas) {
      this.sociosPaginaActual = pagina;
    }
  }

  // MÉTODOS DE PAGINACIÓN MODAL

  cambiarPaginaModal(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalSociosModalPaginas) {
      this.sociosModalPaginaActual = pagina;
    }
  }

  // VER SOCIOS DETALLE

  verSocios(id: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.membershipService.getMembresiaConSociosActivos(id).subscribe({
      next: (response: any) => {
        const seleccionada = this.membresias.find((m) => m.id === id);
        if (seleccionada) {
          this.membresiaSeleccionada = seleccionada;
          const sociosData = response?.sociosAsignados || response?.data || response?.content || [];

          if (!sociosData || sociosData.length === 0) {
            this.loading = false;
            Swal.fire({
              icon: 'info',
              title: 'Sin socios asignados',
              text: `La membresía "${seleccionada.nombre}" no tiene socios asignados actualmente.`,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#0f1c3f',
            });
            return;
          }

          this.sociosAsignados = sociosData.map((s: any) => ({
            id: Number(s.idSocio || s.id),
            idSocioMembresia: s.idSocioMembresia,
            nombre: s.nombreCompleto || s.nombre || 'Usuario',
            telefono: s.telefono || 'No disponible',
            precioTotal: s.precioReal ?? s.precioTotal ?? seleccionada.precio ?? 0,
            fechaAsignacion: this.formatearFecha(s.fechaAsignacion || s.fechaCreacion),
            fechaVencimiento: this.formatearFecha(s.fechaVencimiento),
            fotoUrl: s.fotoUrl || s.fotoPerfil || s.foto || s.avatar || null,
            estado: s.estado || 'ACTIVA',
          }));

          this.membresiaSeleccionada.sociosActivos = this.sociosAsignados.length;
          this.sociosAsignadosFiltrados = [...this.sociosAsignados];
          this.sociosPaginaActual = 1;
          this.vistaActual = 'socios';
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        const seleccionada = this.membresias.find((m) => m.id === id);
        Swal.fire({
          icon: 'info',
          title: 'Sin socios asignados',
          text: `La membresía "${seleccionada?.nombre || 'seleccionada'}" no tiene socios asignados actualmente.`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0f1c3f',
        });
      },
    });
  }

  // MODAL DE ASIGNACIÓN

  asignarMembresia(id: number): void {
    const seleccionada = this.membresias.find((m) => m.id === id);
    if (!seleccionada) return;

    this.membresiaSeleccionada = seleccionada;

    if (seleccionada.esFlexible) {
      this.mostrarModalFlexible = true;
      this.diasFlexibles = 1;
      this.observacionesFlexible = '';
    } else {
      this.mostrarModal = true;
      this.searchTermModal = '';
      this.sociosModalPaginaActual = 1;
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.mostrarModalFlexible = false;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.vistaActual === 'socios' && this.membresiaSeleccionada) {
      this.verSocios(this.membresiaSeleccionada.id);
    } else {
      this.cargarDashboard(this.paginaMembresiasActual - 1);
    }
  }

  // CONFIRMACIONES Y ACCIONES

  async confirmarAsignacion(socio: SocioUI) {
    if (!this.membresiaSeleccionada) return;

    const result = await Swal.fire({
      title: '¿Confirmar Asignación?',
      text: `¿Estás seguro de que deseas asignar la membresía ${this.membresiaSeleccionada.nombre} a ${socio.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Confirmar y Asignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f1c3f',
    });

    if (result.isConfirmed) {
      this.ejecutarAsignacionServicio(socio);
    }
  }

  ejecutarAsignacionServicio(socio: SocioUI): void {
    if (!this.membresiaSeleccionada) return;

    const request: AsignacionRequest = {
      idSocio: socio.id,
      idMembresia: this.membresiaSeleccionada.id,
      observaciones: `Asignación desde panel admin - ${new Date().toLocaleDateString('es-ES')}`,
    };

    this.loading = true;

    this.membershipService.asignarMembresia(request).subscribe({
      next: () => {
        this.loading = false;
        if (this.membresiaSeleccionada) {
          this.membresiaSeleccionada.sociosActivos += 1;
        }
        this.mostrarAlertaExito(
          '¡Membresía Asignada!',
          `La membresía se ha asignado correctamente a ${socio.nombre}.`
        );
        this.cerrarModal();
      },
      error: (error: any) => {
        this.loading = false;
        this.mostrarAlertaError(error.error?.message || 'Error al asignar la membresía.');
      },
    });
  }

  async confirmarAsignacionFlexible(socio: SocioUI) {
    if (!this.membresiaSeleccionada) return;

    const result = await Swal.fire({
      title: '¿Confirmar Asignación Flexible?',
      text: `¿Estás seguro de asignar ${this.diasFlexibles} día(s) de la membresía ${this.membresiaSeleccionada.nombre} a ${socio.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Confirmar y Asignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f1c3f',
    });

    if (result.isConfirmed) {
      this.ejecutarAsignacionFlexibleServicio(socio);
    }
  }

  ejecutarAsignacionFlexibleServicio(socio: SocioUI): void {
    if (!this.membresiaSeleccionada) return;

    const request: AsignacionFlexibleRequest = {
      idSocio: socio.id,
      idMembresia: this.membresiaSeleccionada.id,
      cantidadDias: this.diasFlexibles,
      observaciones:
        this.observacionesFlexible ||
        `Asignación flexible desde panel admin - ${new Date().toLocaleDateString('es-ES')}`,
    };

    this.loading = true;

    this.membershipService.asignarMembresiaFlexible(request).subscribe({
      next: () => {
        this.loading = false;
        if (this.membresiaSeleccionada) {
          this.membresiaSeleccionada.sociosActivos += 1;
        }
        this.mostrarAlertaExito(
          '¡Membresía Flexible Asignada!',
          `Se han asignado ${this.diasFlexibles} día(s) a ${socio.nombre}.`
        );
        this.cerrarModal();
      },
      error: (error: any) => {
        this.loading = false;
        this.mostrarAlertaError(error.error?.message || 'Error al asignar la membresía flexible.');
      },
    });
  }

  // RENOVAR, SUSPENDER, CANCELAR

  async abrirModalRenovar(socio: SocioUI) {
    if (!socio.idSocioMembresia) {
      this.mostrarAlertaError('No se puede renovar: falta el ID de la membresía.');
      return;
    }

    const result = await Swal.fire({
      title: '¿Renovar Membresía?',
      text: `¿Estás seguro de que deseas renovar el periodo activo para ${socio.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Renovar Membresía',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f1c3f',
    });

    if (result.isConfirmed) {
      this.ejecutarRenovar(socio);
    }
  }

  async ejecutarRenovar(socio: SocioUI): Promise<void> {
    if (!socio.idSocioMembresia) return;

    const esFlexible =
      this.membresiaSeleccionada?.esFlexible ??
      (socio as any).esFlexible ??
      false;

    let cantidadDias: number | undefined;

    if (esFlexible) {
      const { value: diasIngresados, isConfirmed } = await Swal.fire({
        title: 'Renovar Membresía Flexible',
        text: `Ingrese la cantidad de días a renovar para ${socio.nombre}:`,
        input: 'number',
        inputValue: 15,
        showCancelButton: true,
        confirmButtonText: 'Renovar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value || Number(value) <= 0) {
            return 'Debe ingresar una cantidad de días válida mayor a 0';
          }
          return null;
        },
      });

      if (!isConfirmed) return;
      cantidadDias = parseInt(diasIngresados, 10);
    }

    this.accionEnProceso = true;

    const request: RenovarRequest & { cantidadDias?: number } = {
      idSocioMembresia: socio.idSocioMembresia,
      ...(cantidadDias && { cantidadDias }),
      observaciones: `Renovación manual - ${new Date().toLocaleDateString('es-ES')}`,
    };

    this.membershipService.renovarMembresia(request).subscribe({
      next: () => {
        this.accionEnProceso = false;
        this.mostrarAlertaExito(
          '¡Membresía Renovada!',
          `La membresía de ${socio.nombre} ha sido renovada con éxito.`
        );
        this.cargarDashboard(this.paginaMembresiasActual - 1);
        if (this.membresiaSeleccionada) {
          this.verSocios(this.membresiaSeleccionada.id);
        }
      },
      error: (error: any) => {
        this.accionEnProceso = false;
        this.mostrarAlertaError(error.error?.message || 'Error al renovar la membresía.');
      },
    });
  }

  async abrirModalSuspender(socio: SocioUI) {
    if (!socio.idSocioMembresia) {
      this.mostrarAlertaError('No se puede suspender: falta el ID de la membresía.');
      return;
    }

    const { value: motivo, isConfirmed } = await Swal.fire({
      title: '¿Suspender Membresía?',
      text: `¿Estás seguro de que deseas suspender temporalmente el acceso a ${socio.nombre}?`,
      input: 'textarea',
      inputPlaceholder: 'Escribe el motivo de la suspensión...',
      showCancelButton: true,
      confirmButtonText: 'Suspender Membresía',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f1c3f',
    });

    if (isConfirmed) {
      this.ejecutarSuspender(socio, motivo || 'Suspensión manual');
    }
  }

  ejecutarSuspender(socio: SocioUI, motivo: string): void {
    if (!socio.idSocioMembresia) return;

    this.accionEnProceso = true;

    const request: SuspenderRequest = {
      idSocioMembresia: socio.idSocioMembresia,
      motivo: motivo,
    };

    this.membershipService.suspenderMembresia(request).subscribe({
      next: () => {
        this.accionEnProceso = false;
        this.mostrarAlertaExito('¡Membresía Suspendida!', `La membresía de ${socio.nombre} fue suspendida.`);
        this.cargarDashboard(this.paginaMembresiasActual - 1);
        if (this.membresiaSeleccionada) {
          this.verSocios(this.membresiaSeleccionada.id);
        }
      },
      error: (error: any) => {
        this.accionEnProceso = false;
        this.mostrarAlertaError(error.error?.message || 'Error al suspender la membresía.');
      },
    });
  }

  async abrirModalCancelar(socio: SocioUI) {
    if (!socio.idSocioMembresia) {
      this.mostrarAlertaError('No se puede cancelar: falta el ID de la membresía.');
      return;
    }

    const { value: motivo, isConfirmed } = await Swal.fire({
      title: '¿Confirmar Eliminación?',
      text: `¿Estás seguro de que deseas cancelar permanentemente la membresía de ${socio.nombre}?`,
      input: 'textarea',
      inputPlaceholder: 'Escribe el motivo de la cancelación...',
      showCancelButton: true,
      confirmButtonText: 'Eliminar / Cancelar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });

    if (isConfirmed) {
      this.ejecutarCancelar(socio, motivo || 'Cancelación manual');
    }
  }

  ejecutarCancelar(socio: SocioUI, motivo: string): void {
    if (!socio.idSocioMembresia) return;

    this.accionEnProceso = true;

    const request: CancelarRequest = {
      idSocioMembresia: socio.idSocioMembresia,
      motivo: motivo,
    };

    this.membershipService.cancelaMembresia(request).subscribe({
      next: () => {
        this.accionEnProceso = false;
        this.mostrarAlertaExito(
          '¡Membresía Cancelada!',
          `La membresía de ${socio.nombre} ha sido cancelada definitivamente.`
        );
        this.cargarDashboard(this.paginaMembresiasActual - 1);
        if (this.membresiaSeleccionada) {
          this.verSocios(this.membresiaSeleccionada.id);
        }
      },
      error: (error: any) => {
        this.accionEnProceso = false;
        this.mostrarAlertaError(error.error?.message || 'Error al cancelar la membresía.');
      },
    });
  }

  async renovarDesdePorVencer(item: any): Promise<void> {
    const esFlexible =
      item.esFlexible ??
      item.flexible ??
      item.membresiaEsFlexible ??
      item.membresia?.esFlexible ??
      (item.cantidadDias !== undefined && item.cantidadDias !== null);

    let cantidadDias: number | undefined = item.cantidadDias;

    if (esFlexible || !cantidadDias) {
      const { value: diasIngresados, isConfirmed } = await Swal.fire({
        title: 'Renovar Membresía Flexible',
        text: 'Ingrese la cantidad de días para la renovación:',
        input: 'number',
        inputValue: item.cantidadDias || 15,
        showCancelButton: true,
        confirmButtonText: 'Renovar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value || Number(value) <= 0) {
            return 'Debe ingresar una cantidad de días válida mayor a 0';
          }
          return null;
        },
      });

      if (!isConfirmed) return;
      cantidadDias = parseInt(diasIngresados, 10);
    }

    const dto: RenovarRequest = {
      idSocioMembresia: item.idSocioMembresia || item.id,
      cantidadDias: cantidadDias,
      observaciones: 'Renovación rápida desde panel',
    };

    this.accionEnProceso = true;

    this.membershipService.renovarMembresia(dto).subscribe({
      next: () => {
        this.accionEnProceso = false;
        Swal.fire('Éxito', 'La membresía ha sido renovada correctamente', 'success');
        this.cargarDashboard(this.paginaMembresiasActual - 1);
      },
      error: (err: any) => {
        this.accionEnProceso = false;
        Swal.fire(
          'Error',
          err.error?.message || 'Ocurrió un error al intentar renovar la membresía.',
          'error'
        );
      },
    });
  }

  // ALERTAS

  mostrarAlertaExito(titulo: string, mensaje: string): void {
    Swal.fire({
      icon: 'success',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Entendido',
      timer: 3000,
      confirmButtonColor: '#0f1c3f',
    });
  }

  mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Ocurrió un error',
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0f1c3f',
    });
  }

  // NAVEGACIÓN Y FILTROS

  volverAMembresias(): void {
    this.vistaActual = 'tarjetas';
    this.membresiaSeleccionada = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.cargarDashboard(this.paginaMembresiasActual - 1);
  }

  onSearchModal(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTermModal = value;
    this.sociosFiltradosModal = this.sociosModal.filter(
      (s) =>
        (s.nombre || '').toLowerCase().includes(value) ||
        (s.telefono || '').toLowerCase().includes(value)
    );
    this.sociosModalPaginaActual = 1;
  }

  onSearchSociosAsignados(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTermSocios = value;
    this.sociosAsignadosFiltrados = this.sociosAsignados.filter(
      (s) =>
        (s.nombre || '').toLowerCase().includes(value) ||
        (s.telefono || '').toLowerCase().includes(value)
    );
    this.sociosPaginaActual = 1;
  }

  // UTILIDADES

  formatearFecha(fecha: string | Date | undefined): string {
    if (!fecha) return '-';
    const parsedDate = new Date(fecha);
    if (isNaN(parsedDate.getTime())) return '-';
    return parsedDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio || 0);
  }

  trackByMembresiaId(index: number, item: MembresiaUI): number {
    return item.id;
  }

  trackBySocioId(index: number, item: SocioUI): number {
    return item.id;
  }

  trackByItemId(index: number, item: any): any {
    return item.id || index;
  }

  trackByString(index: number, item: string): string {
    return item;
  }

  trackByIndex(index: number): number {
    return index;
  }
}