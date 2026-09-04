import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  MembershipService,
  AsignacionRequest,
  AsignacionFlexibleRequest,
  RenovarRequest,
  SuspenderRequest,
  CancelarRequest,
  PageResponse,
  SocioAsignado
} from '../../../../core/services/membership.service';
import Swal from 'sweetalert2';
import { UserService, UsuarioPerfilResponseDTO, PageResponse as UserPageResponse } from '../../../../core/services/user.service';

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
  apellido?: string;
  telefono: string;
  email?: string;
  precioTotal?: number;
  fechaAsignacion?: string;
  fechaVencimiento?: string;
  fechaRegistro?: string;
  fotoUrl?: string | null;
  estado: string;
  rol?: any;
}

@Component({
  selector: 'app-assign-membership',
  templateUrl: './assign-membership.component.html',
  styleUrls: ['./assign-membership.component.scss'],
})
export class AssignMembershipComponent implements OnInit {
  vistaActual: 'tarjetas' | 'socios' = 'tarjetas';

  membresias: MembresiaUI[] = [];
  membresiaSeleccionada: MembresiaUI | null = null;
  membresiasPorVencer: any[] = [];

  failedAvatars: Set<string> = new Set<string>();

  mostrarModal: boolean = false;
  mostrarModalFlexible: boolean = false;
  loading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  private searchModalSubject: Subject<string> = new Subject<string>();
  private searchSociosSubject: Subject<string> = new Subject<string>();

  diasFlexibles: number = 1;
  observacionesFlexible: string = '';

  searchTermSocios: string = '';

  paginaMembresiasActual: number = 0;
  readonly itemsPorPaginaMembresias: number = 6;
  totalMembresiasBackend: number = 0;
  totalPaginasMembresiasBackend: number = 1;

  sociosAsignados: SocioUI[] = [];
  sociosPaginaActual: number = 0;
  readonly sociosItemsPorPagina: number = 6;
  totalSociosAsignadosBackend: number = 0;
  totalPaginasSociosBackend: number = 1;

  sociosModal: SocioUI[] = [];
  searchTermModal: string = '';
  loadingModalSocios: boolean = false;
  paginaSocioModalActual: number = 0;
  readonly itemsPorPaginaSocioModal: number = 5;
  totalElementosSocioModal: number = 0;
  totalPaginasSocioModal: number = 0;

  accionEnProceso: boolean = false;

  paginaPorVencerActual: number = 1;
  readonly itemsPorPaginaPorVencer: number = 6;
  totalPaginasPorVencerBackend: number = 1;
  totalElementosPorVencer: number = 0;

  constructor(
    private membershipService: MembershipService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.cargarDashboard(0, 0);

    this.searchModalSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe((term: string) => {
      this.searchTermModal = term;
      this.paginaSocioModalActual = 0;
      this.cargarSociosModalBackend();
    });

    this.searchSociosSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe((term: string) => {
      this.searchTermSocios = term;
      this.sociosPaginaActual = 0;
      if (this.membresiaSeleccionada) {
        this.verSocios(this.membresiaSeleccionada.id, 0);
      }
    });
  }

  cargarDashboard(
    pageMembresias: number = 0,
    pagePorVencer: number = 0,
    silent: boolean = false
  ): void {
    if (!silent) {
      this.loading = true;
    }
    this.errorMessage = '';
    this.paginaMembresiasActual = pageMembresias;

    this.membershipService.getDashboardMembresias({
      pagina: pageMembresias,
      tamanio: this.itemsPorPaginaMembresias,
      pagePorVencer: pagePorVencer,
      sizePorVencer: this.itemsPorPaginaPorVencer
    }).subscribe({
      next: (res: any) => {
        try {
          const responseBody = res?.data || res || {};
          const membresiasPaginadas = responseBody.membresiasPaginadas || responseBody.membresias || responseBody;
          
          const usuariosActivosList = responseBody.usuariosActivos || [];

          let listMembresias: any[] = [];
          if (Array.isArray(membresiasPaginadas)) {
            listMembresias = membresiasPaginadas;
            this.totalMembresiasBackend = listMembresias.length;
            this.totalPaginasMembresiasBackend = Math.ceil(this.totalMembresiasBackend / this.itemsPorPaginaMembresias) || 1;
          } else {
            listMembresias = membresiasPaginadas?.content || membresiasPaginadas?.data || membresiasPaginadas?.contenido || [];
            this.totalMembresiasBackend = membresiasPaginadas?.totalElementos ?? membresiasPaginadas?.totalElements ?? listMembresias.length;
            this.totalPaginasMembresiasBackend = membresiasPaginadas?.totalPaginas ?? membresiasPaginadas?.totalPages ?? 1;
            this.paginaMembresiasActual = membresiasPaginadas?.numeroPagina ?? membresiasPaginadas?.currentPage ?? membresiasPaginadas?.number ?? pageMembresias;
          }

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

          const porVencerRaw = responseBody.membresiasPorVencer || responseBody.porVencer || {};

          if (porVencerRaw && typeof porVencerRaw === 'object') {
            this.totalElementosPorVencer = porVencerRaw.totalElements ?? porVencerRaw.totalElementos ?? 0;
            this.totalPaginasPorVencerBackend = porVencerRaw.totalPages ?? porVencerRaw.totalPaginas ?? 1;
            if (porVencerRaw.number !== undefined) {
              this.paginaPorVencerActual = porVencerRaw.number + 1;
            }
          }

          const porVencerData = Array.isArray(porVencerRaw)
            ? porVencerRaw
            : (porVencerRaw.content || porVencerRaw.data || []);

          this.membresiasPorVencer = porVencerData.map((item: any) => {
            const nombreSocio = item.nombreSocio || item.nombreCompleto || item.nombre || 'Socio';
            const idSocioReal = Number(item.idSocio || item.idUsuario || item.id);

            const usuarioEncontrado = usuariosActivosList.find((u: any) => Number(u.idUsuario) === idSocioReal);

            const fotoRaw = usuarioEncontrado?.fotoUrl 
                        || item.fotoUrl 
                        || item.fotoPerfil 
                        || item.foto 
                        || item.avatar 
                        || item.usuario?.fotoUrl 
                        || null;

            return {
              ...item,
              id: Number(item.idSocioMembresia || item.id || item.idSocio),
              idSocio: idSocioReal,
              idSocioMembresia: Number(item.idSocioMembresia || item.id),
              nombreSocio: nombreSocio,
              tipoMembresia: item.tipoMembresia || item.nombreMembresia || item.membresia || 'Plan Activo',
              diasRestantes: item.diasRestantes ?? item.diasParaVencer ?? 0,
              fotoUrl: fotoRaw
            };
          });
        } catch (err) {
          console.error('Error al mapear dashboard:', err);
        } finally {
          this.loading = false;
        }
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Error al conectar con el servidor de membresías.';
        this.loading = false;
      },
    });
  }

  verSocios(id: number, pageIndexZeroBased: number = 0): void {
    this.loading = true;
    this.sociosPaginaActual = pageIndexZeroBased;

    this.membershipService.getSociosAsignadosPaginados(
      id,
      pageIndexZeroBased,
      this.sociosItemsPorPagina,
      this.searchTermSocios.trim() || undefined
    ).subscribe({
      next: (response: PageResponse<SocioAsignado> | any) => {
        const seleccionada = this.membresias.find((m) => m.id === id);
        if (seleccionada) {
          this.membresiaSeleccionada = seleccionada;

          this.totalSociosAsignadosBackend = response.totalElements || 0;
          this.totalPaginasSociosBackend = response.totalPages || 1;
          this.sociosPaginaActual = response.number || 0;

          const rawContent = response.content || [];

          this.userService.obtenerTodosLosUsuariosActivos().subscribe({
            next: (usuariosActivosList: UsuarioPerfilResponseDTO[] | any) => {
              const listaUsuarios = Array.isArray(usuariosActivosList) ? usuariosActivosList : (usuariosActivosList?.data || []);

              this.sociosAsignados = rawContent.map((s: any) => {
                const nombreSocio = s.nombreCompleto || s.nombre || 'Usuario';
                const idSocioReal = Number(s.idSocio || s.idUsuario || s.id);

                const usuarioEncontrado = listaUsuarios.find((u: any) => Number(u.idUsuario || u.id) === idSocioReal);

                const fotoSocio = usuarioEncontrado?.fotoUrl 
                                || s.fotoUrl 
                                || s.avatarUrl 
                                || s.fotoPerfil 
                                || s.foto 
                                || s.avatar 
                                || s.usuario?.fotoUrl 
                                || null;

                return {
                  id: idSocioReal,
                  idSocioMembresia: s.idSocioMembresia || s.id,
                  nombre: nombreSocio,
                  telefono: s.telefono || 'No disponible',
                  email: s.email || '',
                  precioTotal: s.precioReal ?? s.precioTotal ?? seleccionada.precio ?? 0,
                  fechaAsignacion: this.formatearFecha(s.fechaInicio || s.fechaAsignacion),
                  fechaVencimiento: this.formatearFecha(s.fechaVencimiento),
                  fotoUrl: fotoSocio,
                  estado: s.estado || 'ACTIVA',
                };
              });

              this.membresiaSeleccionada!.sociosActivos = this.totalSociosAsignadosBackend;
              this.vistaActual = 'socios';
              this.loading = false;
            },
            error: (errProfile) => {
              console.warn('No se pudo obtener el listado global de usuarios para las fotos, usando datos base:', errProfile);
              
              this.sociosAsignados = rawContent.map((s: any) => ({
                id: Number(s.idSocio || s.id),
                idSocioMembresia: s.idSocioMembresia || s.id,
                nombre: s.nombreCompleto || s.nombre || 'Usuario',
                telefono: s.telefono || 'No disponible',
                email: s.email || '',
                precioTotal: s.precioReal ?? s.precioTotal ?? seleccionada.precio ?? 0,
                fechaAsignacion: this.formatearFecha(s.fechaInicio || s.fechaAsignacion),
                fechaVencimiento: this.formatearFecha(s.fechaVencimiento),
                fotoUrl: s.fotoUrl || s.avatarUrl || null,
                estado: s.estado || 'ACTIVA',
              }));

              this.membresiaSeleccionada!.sociosActivos = this.totalSociosAsignadosBackend;
              this.vistaActual = 'socios';
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar socios asignados:', err);
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

  cargarSociosModalBackend(): void {
    this.loadingModalSocios = true;
    const busquedaTerm = this.searchTermModal.trim();

    this.userService.listarPerfilesPaginados({
      pagina: this.paginaSocioModalActual,
      tamanio: this.itemsPorPaginaSocioModal,
      busqueda: busquedaTerm || undefined,
      estado: 'ACTIVO'
    }).subscribe({
      next: (response: UserPageResponse<UsuarioPerfilResponseDTO>) => {
        this.totalElementosSocioModal = response.totalElements || 0;
        this.totalPaginasSocioModal = response.totalPages || 1;
        this.paginaSocioModalActual = response.number || 0;

        this.sociosModal = response.content.map((u: UsuarioPerfilResponseDTO) => {
          const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Usuario';
          const fotoUrl = u.fotoUrl || null;

          return {
            id: u.idUsuario,
            nombre: nombreCompleto,
            apellido: u.apellido || '',
            telefono: u.telefono || 'No disponible',
            email: u.email || '',
            fechaRegistro: this.formatearFecha(u.fechaRegistro || u.fechaCreacion),
            fotoUrl: fotoUrl,
            estado: u.estado || 'ACTIVO',
            rol: u.rol
          };
        });

        this.loadingModalSocios = false;
      },
      error: (err: any) => {
        console.error('Error al consultar usuarios con UserService:', err);
        this.sociosModal = [];
        this.totalElementosSocioModal = 0;
        this.totalPaginasSocioModal = 0;
        this.loadingModalSocios = false;
      }
    });
  }

  getUserFoto(socio: any): string | null {
    if (!socio) return null;

    let rawUrl = socio.fotoUrl || socio.avatarUrl || socio.fotoPerfil || socio.foto || socio.avatar || null;

    if (!rawUrl || typeof rawUrl !== 'string') return null;

    rawUrl = rawUrl.trim();
    
    if (
      rawUrl === '' || 
      rawUrl === 'null' || 
      rawUrl === 'undefined' || 
      rawUrl.includes('socio_default_avatar.jpg')
    ) {
      return null;
    }

    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }

    if (rawUrl.startsWith('//')) {
      return `https:${rawUrl}`;
    }

    return rawUrl;
  }

  onAvatarError(key: string): void {
    if (key) {
      this.failedAvatars.add(key);
    }
  }

  hasAvatarError(key: string): boolean {
    return this.failedAvatars.has(key);
  }

  getInitials(nombre?: string): string {
    if (!nombre) return '?';
    const partes = nombre.trim().split(' ').filter((p) => p.length > 0);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  onSearchModal(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchModalSubject.next(value);
  }

  irPaginaSocioModal(pZeroBased: number): void {
    if (pZeroBased !== this.paginaSocioModalActual && pZeroBased >= 0 && pZeroBased < this.totalPaginasSocioModal) {
      this.paginaSocioModalActual = pZeroBased;
      this.cargarSociosModalBackend();
    }
  }

  paginaAnteriorModal(): void {
    if (this.paginaSocioModalActual > 0) {
      this.irPaginaSocioModal(this.paginaSocioModalActual - 1);
    }
  }

  paginaSiguienteModal(): void {
    if (this.paginaSocioModalActual < this.totalPaginasSocioModal - 1) {
      this.irPaginaSocioModal(this.paginaSocioModalActual + 1);
    }
  }

  get paginasVisiblesModal(): number[] {
    const maxVisibles = 4;
    let inicio = Math.max(0, this.paginaSocioModalActual - 1);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPaginasSocioModal) {
      fin = this.totalPaginasSocioModal;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  asignarMembresia(id: number): void {
    const seleccionada = this.membresias.find((m) => m.id === id);
    if (!seleccionada) return;

    this.membresiaSeleccionada = seleccionada;
    this.searchTermModal = '';
    this.paginaSocioModalActual = 0;

    this.cargarSociosModalBackend();

    if (seleccionada.esFlexible) {
      this.mostrarModalFlexible = true;
      this.diasFlexibles = 1;
      this.observacionesFlexible = '';
    } else {
      this.mostrarModal = true;
    }
  }

  get paginasMembresias(): number[] {
    const maxVisibles = 5;
    let inicio = Math.max(0, this.paginaMembresiasActual - 2);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPaginasMembresiasBackend) {
      fin = this.totalPaginasMembresiasBackend;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  cambiarPaginaMembresias(pZeroBased: number): void {
    if (pZeroBased >= 0 && pZeroBased < this.totalPaginasMembresiasBackend) {
      this.cargarDashboard(pZeroBased, this.paginaPorVencerActual - 1);
    }
  }

  paginaAnteriorMembresias(): void {
    if (this.paginaMembresiasActual > 0) this.cambiarPaginaMembresias(this.paginaMembresiasActual - 1);
  }

  paginaSiguienteMembresias(): void {
    if (this.paginaMembresiasActual < this.totalPaginasMembresiasBackend - 1) {
      this.cambiarPaginaMembresias(this.paginaMembresiasActual + 1);
    }
  }

  get paginasSocios(): number[] {
    const maxVisibles = 5;
    let inicio = Math.max(0, this.sociosPaginaActual - 2);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPaginasSociosBackend) {
      fin = this.totalPaginasSociosBackend;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  cambiarPaginaSocios(pZeroBased: number): void {
    if (pZeroBased >= 0 && pZeroBased < this.totalPaginasSociosBackend && this.membresiaSeleccionada) {
      this.verSocios(this.membresiaSeleccionada.id, pZeroBased);
    }
  }

  paginaAnteriorSocios(): void {
    if (this.sociosPaginaActual > 0) this.cambiarPaginaSocios(this.sociosPaginaActual - 1);
  }

  paginaSiguienteSocios(): void {
    if (this.sociosPaginaActual < this.totalPaginasSociosBackend - 1) {
      this.cambiarPaginaSocios(this.sociosPaginaActual + 1);
    }
  }

  get membresiasPorVencerPaginadas(): any[] {
    return this.membresiasPorVencer;
  }

  get totalPaginasPorVencer(): number {
    return this.totalPaginasPorVencerBackend || 1;
  }

  get paginasPorVencer(): number[] {
    return Array.from({ length: this.totalPaginasPorVencer }, (_, i) => i + 1);
  }

  cambiarPaginaPorVencer(pagina: number): void {
    if (pagina !== this.paginaPorVencerActual && pagina >= 1 && pagina <= this.totalPaginasPorVencer) {
      this.paginaPorVencerActual = pagina;
      this.cargarDashboard(this.paginaMembresiasActual, pagina - 1, true);
    }
  }

  paginaAnteriorPorVencer(): void {
    if (this.paginaPorVencerActual > 1) {
      this.cambiarPaginaPorVencer(this.paginaPorVencerActual - 1);
    }
  }

  paginaSiguientePorVencer(): void {
    if (this.paginaPorVencerActual < this.totalPaginasPorVencer) {
      this.cambiarPaginaPorVencer(this.paginaPorVencerActual + 1);
    }
  }

  irAPaginaPorVencer(pagina: number): void {
    this.cambiarPaginaPorVencer(pagina);
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.mostrarModalFlexible = false;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.vistaActual === 'socios' && this.membresiaSeleccionada) {
      this.verSocios(this.membresiaSeleccionada.id, 0);
    } else {
      this.cargarDashboard(this.paginaMembresiasActual, this.paginaPorVencerActual - 1);
    }
  }

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

    const esFlexible = this.membresiaSeleccionada?.esFlexible ?? (socio as any).esFlexible ?? false;
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
        this.cargarDashboard(this.paginaMembresiasActual, this.paginaPorVencerActual - 1);
        if (this.membresiaSeleccionada) {
          this.verSocios(this.membresiaSeleccionada.id, 0);
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
        this.cargarDashboard(this.paginaMembresiasActual, this.paginaPorVencerActual - 1);
        if (this.membresiaSeleccionada) {
          this.verSocios(this.membresiaSeleccionada.id, 0);
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
        this.mostrarAlertaExito('¡Membresía Cancelada!', `La membresía de ${socio.nombre} ha sido cancelada definitivamente.`);
        this.cargarDashboard(this.paginaMembresiasActual, this.paginaPorVencerActual - 1);
        if (this.membresiaSeleccionada) {
          this.verSocios(this.membresiaSeleccionada.id, 0);
        }
      },
      error: (error: any) => {
        this.accionEnProceso = false;
        this.mostrarAlertaError(error.error?.message || 'Error al cancelar la membresía.');
      },
    });
  }

  async renovarDesdePorVencer(item: any): Promise<void> {
    const esFlexible = item.esFlexible ?? item.flexible ?? item.membresiaEsFlexible ?? item.membresia?.esFlexible ?? (item.cantidadDias !== undefined && item.cantidadDias !== null);
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
        this.cargarDashboard(this.paginaMembresiasActual, this.paginaPorVencerActual - 1);
      },
      error: (err: any) => {
        this.accionEnProceso = false;
        Swal.fire('Error', err.error?.message || 'Ocurrió un error al intentar renovar la membresía.', 'error');
      },
    });
  }

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

  volverAMembresias(): void {
    this.vistaActual = 'tarjetas';
    this.membresiaSeleccionada = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.cargarDashboard(this.paginaMembresiasActual, this.paginaPorVencerActual - 1);
  }

  onSearchSociosAsignados(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSociosSubject.next(value);
  }

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