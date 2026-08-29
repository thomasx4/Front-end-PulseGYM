import { Component, OnInit } from '@angular/core';
import { forkJoin, firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  MembershipService,
  AsignacionRequest,
  AsignacionFlexibleRequest,
  RenovarRequest,
  SuspenderRequest,
  CancelarRequest,
} from '../../../../core/services/membership.service';
import { UserService } from '../../../../core/services/user.service';
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

  // MAPA DE FOTOS POR USUARIO
  fotosUsuariosMap: Map<number, string> = new Map<number, string>();
  avatarErrors: Set<string> = new Set<string>();

  // MODAL DE ASIGNACIÓN
  mostrarModal: boolean = false;
  mostrarModalFlexible: boolean = false;
  searchTermModal: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isInfoAlert: boolean = false;

  // MODAL FLEXIBLE
  diasFlexibles: number = 1;
  observacionesFlexible: string = '';

  // FILTROS
  searchTermSocios: string = '';

  // PAGINACIÓN MEMBRESÍAS (TARJETAS)
  paginaMembresiasActual: number = 1;
  itemsPorPaginaMembresias: number = 6;

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

  constructor(
    private membershipService: MembershipService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.cargarMapaFotos();
    this.cargarMembresias();
    this.cargarPorVencer();
  }

  cargarMapaFotos(): void {
    this.userService.obtenerTodosLosPerfilesActivos().pipe(
      catchError(() => of([]))
    ).subscribe((usuarios: any[]) => {
      if (Array.isArray(usuarios)) {
        usuarios.forEach((u: any) => {
          const id = u.idUsuario || u.id;
          const foto = u.fotoUrl || u.fotoPerfil || u.foto || u.avatar;
          if (id && foto) {
            this.fotosUsuariosMap.set(Number(id), foto);
          }
        });
      }
    });
  }

  // HELPER DE AVATAR Y FOTOS

  getFotoSocio(socio: any): string | null {
    if (!socio) return null;
    const directFoto = socio.fotoUrl || socio.avatarUrl || socio.fotoPerfil || socio.foto || socio.avatar;
    if (directFoto && !directFoto.includes('ui-avatars.com') && !directFoto.includes('default-avatar.png')) {
      let rawUrl = String(directFoto).trim();
      if (rawUrl !== '' && rawUrl !== 'null' && rawUrl !== 'undefined') {
        return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
      }
    }

    const id = socio.idSocio || socio.id || socio.idUsuario;
    if (id && this.fotosUsuariosMap.has(Number(id))) {
      const fotoMap = this.fotosUsuariosMap.get(Number(id));
      if (fotoMap) return fotoMap;
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
    const partes = nombre.trim().split(' ').filter(p => p.length > 0);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  // GETTERS PAGINACIÓN MEMBRESÍAS

  get membresiasPaginadas(): MembresiaUI[] {
    const inicio = (this.paginaMembresiasActual - 1) * this.itemsPorPaginaMembresias;
    return this.membresias.slice(inicio, inicio + this.itemsPorPaginaMembresias);
  }

  get totalPaginasMembresias(): number {
    return Math.ceil(this.membresias.length / this.itemsPorPaginaMembresias) || 1;
  }

  get paginasMembresias(): number[] {
    return Array.from({ length: this.totalPaginasMembresias }, (_, i) => i + 1);
  }

  // GETTERS PAGINACIÓN POR VENCER

  get membresiasPorVencerPaginadas(): any[] {
    const inicio = (this.paginaPorVencerActual - 1) * this.itemsPorPaginaPorVencer;
    const fin = inicio + this.itemsPorPaginaPorVencer;
    return this.membresiasPorVencer.slice(inicio, fin);
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

  // CARGA DE DATOS

  cargarMembresias(): void {
    this.loading = true;
    this.errorMessage = '';

    this.membershipService.getMembresias().subscribe({
      next: (response: any) => {
        this.membresias = (response || []).map((item: any) => ({
          id: item.idMembresia,
          nombre: item.nombre,
          precio: item.precioTotal || 0,
          periodo: 'mo',
          beneficios: item.beneficios
            ? item.beneficios.split(',').map((b: string) => b.trim())
            : ['Sin beneficios'],
          estado: item.activo ? 'Activa' : 'Inactiva',
          sociosActivos: 0,
          incluyeIA: !!item.incluyeIA,
          esFlexible: !!item.esFlexible,
        }));
        this.paginaMembresiasActual = 1;
        this.actualizarConteoSocios();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al cargar membresías.';
        this.loading = false;
      },
    });
  }

  actualizarConteoSocios(): void {
    if (this.membresias.length === 0) return;

    const observables = this.membresias.map((m) =>
      this.membershipService
        .getMembresiaConSociosActivos(m.id)
        .pipe(
          catchError(() => of({ sociosAsignados: [] }))
        )
    );

    forkJoin(observables).subscribe((respuestas: any[]) => {
      respuestas.forEach((response, index) => {
        const sociosData = response?.sociosAsignados || response?.data || [];
        this.membresias[index].sociosActivos = sociosData.length;
      });
    });
  }

  cargarPorVencer(): void {
    this.membershipService.getPorVencer().subscribe({
      next: (response: any) => {
        this.membresiasPorVencer = (response || []).map((item: any) => {
          const idSocioNum = Number(item.idSocio || item.id);
          const foto = item.fotoUrl || item.fotoPerfil || item.foto || item.avatar || this.fotosUsuariosMap.get(idSocioNum) || null;
          return {
            ...item,
            fotoUrl: foto
          };
        });
        this.paginaPorVencerActual = 1;
      },
      error: () => {
        this.membresiasPorVencer = [];
      },
    });
  }

  // MÉTODOS DE PAGINACIÓN MEMBRESÍAS

  cambiarPaginaMembresias(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasMembresias) {
      this.paginaMembresiasActual = pagina;
    }
  }

  paginaAnteriorMembresias(): void {
    if (this.paginaMembresiasActual > 1) {
      this.paginaMembresiasActual--;
    }
  }

  paginaSiguienteMembresias(): void {
    if (this.paginaMembresiasActual < this.totalPaginasMembresias) {
      this.paginaMembresiasActual++;
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

  // VER SOCIOS

  verSocios(id: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.membershipService.getMembresiaConSociosActivos(id).subscribe({
      next: (response: any) => {
        const seleccionada = this.membresias.find((m) => m.id === id);
        if (seleccionada) {
          this.membresiaSeleccionada = seleccionada;

          const sociosData = response?.sociosAsignados || response?.data || [];

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

          this.sociosAsignados = sociosData.map((s: any) => {
            const idSocioNum = Number(s.idSocio || s.id);
            const foto = s.fotoUrl || s.fotoPerfil || s.foto || s.avatar || this.fotosUsuariosMap.get(idSocioNum) || null;

            return {
              id: idSocioNum,
              idSocioMembresia: s.idSocioMembresia,
              nombre: s.nombreCompleto || s.nombre || 'Usuario',
              telefono: s.telefono || 'No disponible',
              precioTotal: s.precioReal !== undefined && s.precioReal !== null
                ? s.precioReal
                : s.precioTotal || seleccionada.precio || 0,
              fechaAsignacion: this.formatearFecha(s.fechaAsignacion || s.fechaCreacion),
              fechaVencimiento: this.formatearFecha(s.fechaVencimiento),
              fotoUrl: foto,
              estado: s.estado || 'ACTIVA',
            };
          });

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

  async asignarMembresia(id: number): Promise<void> {
    const seleccionada = this.membresias.find((m) => m.id === id);
    if (!seleccionada) return;

    this.membresiaSeleccionada = seleccionada;
    await this.cargarUsuariosActivos();

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
      this.cargarMembresias();
    }
    this.cargarPorVencer();
  }

  async cargarUsuariosActivos(): Promise<void> {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(
        this.membershipService.getUsuariosActivos(),
      );
      const usuarios = response || [];
      this.sociosModal = usuarios.map((u: any) => {
        const idSocioNum = Number(u.idUsuario || u.id);
        const foto = u.fotoUrl || u.fotoPerfil || u.foto || u.avatar || this.fotosUsuariosMap.get(idSocioNum) || null;

        return {
          id: idSocioNum,
          nombre: u.nombre || 'Usuario',
          telefono: u.telefono || 'No disponible',
          fechaRegistro: this.formatearFecha(u.fechaRegistro || u.fechaCreacion),
          fotoUrl: foto,
          estado: u.estado || 'ACTIVO',
        };
      });
      this.sociosFiltradosModal = [...this.sociosModal];
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Error al cargar usuarios activos.';
      this.sociosModal = [];
      this.sociosFiltradosModal = [];
    } finally {
      this.loading = false;
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
      confirmButtonColor: '#0f1c3f'
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
          `La membresía se ha asignado correctamente a ${socio.nombre}.`,
        );
        this.cerrarModal();
      },
      error: (error) => {
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
      confirmButtonColor: '#0f1c3f'
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
      observaciones: this.observacionesFlexible || `Asignación flexible desde panel admin - ${new Date().toLocaleDateString('es-ES')}`,
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
          `Se han asignado ${this.diasFlexibles} día(s) a ${socio.nombre}.`,
        );
        this.cerrarModal();
      },
      error: (error) => {
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
      confirmButtonColor: '#0f1c3f'
    });

    if (result.isConfirmed) {
      this.ejecutarRenovar(socio);
    }
  }

  async ejecutarRenovar(socio: SocioUI): Promise<void> {
    if (!socio.idSocioMembresia) {
      this.mostrarAlertaError('No se encontró el ID de la membresía del socio.');
      return;
    }

    const esFlexible = this.membresiaSeleccionada?.esFlexible ??
      (socio as any).esFlexible ?? (socio as any).flexible ?? false;

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
        this.mostrarAlertaExito('¡Membresía Renovada!', `La membresía de ${socio.nombre} ha sido renovada con éxito.`);
        this.cargarMembresias();
        this.cargarPorVencer();
        if (this.membresiaSeleccionada) {
          this.verSocios(this.membresiaSeleccionada.id);
        }
      },
      error: (error) => {
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
      confirmButtonColor: '#0f1c3f'
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
        this.cargarMembresias();
        if (this.membresiaSeleccionada) {
          this.verSocios(this.membresiaSeleccionada.id);
        }
      },
      error: (error) => {
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
      confirmButtonColor: '#ef4444'
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

    this.membershipService.cancelarMembresia(request).subscribe({
      next: () => {
        this.accionEnProceso = false;
        this.mostrarAlertaExito('¡Membresía Cancelada!', `La membresía de ${socio.nombre} ha sido cancelada definitivamente.`);
        this.cargarMembresias();
        if (this.membresiaSeleccionada) {
          this.verSocios(this.membresiaSeleccionada.id);
        }
      },
      error: (error) => {
        this.accionEnProceso = false;
        this.mostrarAlertaError(error.error?.message || 'Error al cancelar la membresía.');
      },
    });
  }

  async renovarDesdePorVencer(item: any): Promise<void> {
    const esFlexible = item.esFlexible ?? item.flexible ?? item.membresiaEsFlexible ??
      item.membresia?.esFlexible ?? (item.cantidadDias !== undefined && item.cantidadDias !== null);

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
        this.cargarPorVencer();
        this.cargarMembresias();
      },
      error: (err: any) => {
        this.accionEnProceso = false;
        Swal.fire('Error', err.error?.message || 'Ocurrió un error al intentar renovar la membresía.', 'error');
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
      confirmButtonColor: '#0f1c3f'
    });
  }

  mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Ocurrió un error',
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0f1c3f'
    });
  }

  // NAVEGACIÓN Y FILTROS

  volverAMembresias(): void {
    this.vistaActual = 'tarjetas';
    this.membresiaSeleccionada = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.cargarPorVencer();
    this.cargarMembresias();
  }

  onSearchModal(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTermModal = value;
    this.sociosFiltradosModal = this.sociosModal.filter(
      (s) => (s.nombre || '').toLowerCase().includes(value) || (s.telefono || '').toLowerCase().includes(value),
    );
    this.sociosModalPaginaActual = 1;
  }

  onSearchSociosAsignados(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTermSocios = value;
    this.sociosAsignadosFiltrados = this.sociosAsignados.filter(
      (s) => (s.nombre || '').toLowerCase().includes(value) || (s.telefono || '').toLowerCase().includes(value),
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