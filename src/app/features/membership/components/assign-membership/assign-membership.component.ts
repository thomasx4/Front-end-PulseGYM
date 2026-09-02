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
} from '../../../../core/services/membership.service';
import { UserService, FiltrosPerfiles } from '../../../../core/services/user.service';
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
  apellido?: string;
  telefono: string;
  email?: string;
  precioTotal?: number;
  fechaAsignacion?: string;
  fechaVencimiento?: string;
  fechaRegistro?: string;
  fotoUrl?: string;
  estado: string;
  rol?: any;
  _avatarError?: boolean;
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

  failedAvatars: Set<string> = new Set<string>();

  // MODALES Y ESTADOS DE CARGA
  mostrarModal: boolean = false;
  mostrarModalFlexible: boolean = false;
  loading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  // SUBJECTS PARA BÚSQUEDAS CON DEBOUNCE
  private searchModalSubject: Subject<string> = new Subject<string>();
  private searchSociosSubject: Subject<string> = new Subject<string>();

  // MODAL FLEXIBLE
  diasFlexibles: number = 1;
  observacionesFlexible: string = '';

  // FILTROS Y BÚSQUEDA EN LISTA DE SOCIOS ASIGNADOS
  searchTermSocios: string = '';

  // PAGINACIÓN DE TARJETAS DE MEMBRESÍAS
  paginaMembresiasActual: number = 0; // 0-based
  readonly itemsPorPaginaMembresias: number = 6;
  totalMembresiasBackend: number = 0;
  totalPaginasMembresiasBackend: number = 1;

  // PAGINACIÓN Y LISTADO DE SOCIOS ASIGNADOS
  sociosAsignados: SocioUI[] = [];
  sociosPaginaActual: number = 0; // 0-based
  readonly sociosItemsPorPagina: number = 6;
  totalSociosAsignadosBackend: number = 0;
  totalPaginasSociosBackend: number = 1;

  // MODAL SELECCIÓN SOCIOS
  sociosModal: SocioUI[] = [];
  searchTermModal: string = '';
  loadingModalSocios: boolean = false;
  paginaSocioModalActual: number = 0; // 0-based
  readonly itemsPorPaginaSocioModal: number = 5;
  totalElementosSocioModal: number = 0;
  totalPaginasSocioModal: number = 0;

  // ACCIONES GENERALES
  accionEnProceso: boolean = false;

  // PAGINACIÓN SOCIOS POR VENCER
  paginaPorVencerActual: number = 1; // 1-based local
  readonly itemsPorPaginaPorVencer: number = 6;

  constructor(
    private membershipService: MembershipService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.cargarDashboard(0);

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

  // --- DASHBOARD PRINCIPAL ---
  cargarDashboard(pageIndexZeroBased: number = 0): void {
    this.loading = true;
    this.errorMessage = '';
    this.paginaMembresiasActual = pageIndexZeroBased;

    this.membershipService.getDashboardMembresias({
      pagina: pageIndexZeroBased,
      tamanio: this.itemsPorPaginaMembresias
    }).subscribe({
      next: (res: any) => {
        try {
          const responseBody = res?.data || res || {};

          const membresiasPaginadas = responseBody.membresiasPaginadas || responseBody.membresias || responseBody;
          let listMembresias: any[] = [];

          if (Array.isArray(membresiasPaginadas)) {
            listMembresias = membresiasPaginadas;
            this.totalMembresiasBackend = listMembresias.length;
            this.totalPaginasMembresiasBackend = Math.ceil(this.totalMembresiasBackend / this.itemsPorPaginaMembresias) || 1;
          } else {
            listMembresias = membresiasPaginadas?.content || membresiasPaginadas?.data || membresiasPaginadas?.contenido || [];
            this.totalMembresiasBackend = membresiasPaginadas?.totalElementos ?? membresiasPaginadas?.totalElements ?? listMembresias.length;
            this.totalPaginasMembresiasBackend = membresiasPaginadas?.totalPaginas ?? membresiasPaginadas?.totalPages ?? (Math.ceil(this.totalMembresiasBackend / this.itemsPorPaginaMembresias) || 1);
            this.paginaMembresiasActual = membresiasPaginadas?.numeroPagina ?? membresiasPaginadas?.currentPage ?? membresiasPaginadas?.number ?? pageIndexZeroBased;
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

          const porVencerRaw = responseBody.membresiasPorVencer || responseBody.porVencer || [];
          const porVencerData = Array.isArray(porVencerRaw) ? porVencerRaw : (porVencerRaw.content || porVencerRaw.data || []);

          this.membresiasPorVencer = porVencerData.map((item: any) => ({
            ...item,
            id: Number(item.idSocioMembresia || item.id || item.idSocio),
            idSocio: Number(item.idSocio || item.idUsuario || item.id),
            idSocioMembresia: Number(item.idSocioMembresia || item.id),
            nombreSocio: item.nombreSocio || item.nombreCompleto || item.nombre || 'Socio',
            tipoMembresia: item.tipoMembresia || item.nombreMembresia || item.membresia || 'Plan Activo',
            diasRestantes: item.diasRestantes ?? item.diasParaVencer ?? 0,
            fotoUrl: item.fotoUrl || item.fotoPerfil || item.foto || item.avatar || null,
          }));

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

  // --- SOCIOS ASIGNADOS ---
  verSocios(id: number, pageIndexZeroBased: number = 0): void {
    this.loading = true;
    this.sociosPaginaActual = pageIndexZeroBased;

    this.membershipService.getMembresiaConSociosActivos(id, {
      pagina: pageIndexZeroBased,
      tamanio: this.sociosItemsPorPagina,
      busqueda: this.searchTermSocios.trim() || undefined
    }).subscribe({
      next: (response: any) => {
        const seleccionada = this.membresias.find((m) => m.id === id) || this.membresiaSeleccionada;
        if (seleccionada) {
          this.membresiaSeleccionada = seleccionada;
          const sociosDataRaw = response?.sociosAsignados || response?.data || response;
          let listSocios: any[] = [];

          if (Array.isArray(sociosDataRaw)) {
            // Paginación manual client-side si el backend no la manda estructurada
            const todosLosSocios = sociosDataRaw;
            this.totalSociosAsignadosBackend = response?.totalSociosAsignados ?? response?.totalElements ?? todosLosSocios.length;
            this.totalPaginasSociosBackend = Math.ceil(this.totalSociosAsignadosBackend / this.sociosItemsPorPagina) || 1;
            
            const inicio = pageIndexZeroBased * this.sociosItemsPorPagina;
            listSocios = todosLosSocios.slice(inicio, inicio + this.sociosItemsPorPagina);
          } else {
            listSocios = sociosDataRaw?.content || sociosDataRaw?.data || sociosDataRaw?.contenido || [];
            this.totalSociosAsignadosBackend = sociosDataRaw?.totalElementos ?? sociosDataRaw?.totalElements ?? response?.totalSociosAsignados ?? listSocios.length;
            this.totalPaginasSociosBackend = sociosDataRaw?.totalPaginas ?? sociosDataRaw?.totalPages ?? (Math.ceil(this.totalSociosAsignadosBackend / this.sociosItemsPorPagina) || 1);
            this.sociosPaginaActual = sociosDataRaw?.numeroPagina ?? sociosDataRaw?.currentPage ?? sociosDataRaw?.number ?? pageIndexZeroBased;
          }

          if ((!listSocios || listSocios.length === 0) && pageIndexZeroBased === 0 && !this.searchTermSocios) {
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

          this.sociosAsignados = listSocios.map((s: any) => ({
            id: Number(s.idSocio || s.idUsuario || s.id),
            idSocioMembresia: s.idSocioMembresia || s.id,
            nombre: s.nombreCompleto || `${s.nombre || ''} ${s.apellido || ''}`.trim() || 'Usuario',
            telefono: s.telefono || s.celular || 'No disponible',
            email: s.email || s.correo || '',
            precioTotal: s.precioReal ?? s.precioTotal ?? seleccionada.precio ?? 0,
            fechaAsignacion: this.formatearFecha(s.fechaAsignacion || s.fechaCreacion),
            fechaVencimiento: this.formatearFecha(s.fechaVencimiento),
            fotoUrl: s.fotoUrl || s.fotoPerfil || s.foto || s.avatar || null,
            estado: s.estado || 'ACTIVA',
          }));

          this.membresiaSeleccionada.sociosActivos = this.totalSociosAsignadosBackend;
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

  // --- CARGA MODAL SOCIOS ---
  cargarSociosModalBackend(): void {
    this.loadingModalSocios = true;
    const busquedaTerm = this.searchTermModal.trim();

    const filtros: FiltrosPerfiles = {
      pagina: this.paginaSocioModalActual,
      tamanio: this.itemsPorPaginaSocioModal,
      busqueda: busquedaTerm || undefined,
      estado: 'ACTIVO'
    };

    this.userService.listarPerfilesPaginados(filtros).subscribe({
      next: (response: any) => {
        let arrayCompleto: any[] = [];

        if (Array.isArray(response)) {
          arrayCompleto = response;
        } else {
          const listData = response.data || response.contenido || response.content || [];
          arrayCompleto = Array.isArray(listData) ? listData : [];
        }

        let listaFiltrada = arrayCompleto;

        if (busquedaTerm) {
          const query = busquedaTerm.toLowerCase();
          listaFiltrada = listaFiltrada.filter(u =>
            (u.nombre && u.nombre.toLowerCase().includes(query)) ||
            (u.apellido && u.apellido.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query)) ||
            (u.telefono && u.telefono.includes(query))
          );
        }

        let MappedList: SocioUI[] = [];

        if (Array.isArray(response) || listaFiltrada.length !== arrayCompleto.length) {
          this.totalElementosSocioModal = listaFiltrada.length;
          this.totalPaginasSocioModal = Math.ceil(this.totalElementosSocioModal / this.itemsPorPaginaSocioModal) || 1;
          const inicioSlice = this.paginaSocioModalActual * this.itemsPorPaginaSocioModal;
          MappedList = listaFiltrada.slice(inicioSlice, inicioSlice + this.itemsPorPaginaSocioModal);
        } else {
          MappedList = listaFiltrada;
          this.totalElementosSocioModal = response.totalElementos ?? response.totalElements ?? listaFiltrada.length;
          this.totalPaginasSocioModal = response.totalPaginas ?? response.totalPages ?? 1;
          this.paginaSocioModalActual = response.numeroPagina ?? response.currentPage ?? response.number ?? 0;
        }

        this.sociosModal = MappedList.map((u: any) => ({
          id: Number(u.idUsuario || u.id),
          nombre: u.nombreCompleto || `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Usuario',
          apellido: u.apellido || '',
          telefono: u.telefono || u.celular || 'No disponible',
          email: u.email || '',
          fechaRegistro: this.formatearFecha(u.fechaRegistro || u.fechaCreacion || u.createdAt),
          fotoUrl: u.fotoUrl || u.fotoPerfil || u.foto || u.avatar || null,
          estado: u.estado || 'ACTIVO',
          rol: u.rol
        }));

        this.loadingModalSocios = false;
      },
      error: (err) => {
        console.error('Error al consultar usuarios:', err);
        this.sociosModal = [];
        this.totalElementosSocioModal = 0;
        this.totalPaginasSocioModal = 0;
        this.loadingModalSocios = false;
      }
    });
  }

  // --- PROPIEDADES DE COMPATIBILIDAD CON TEMPLATE ---
  get getFotoSocio(): (socio: any) => string | null {
    return this.getUserFoto.bind(this);
  }

  get totalPaginasMembresias(): number {
    return this.totalPaginasMembresiasBackend;
  }

  get totalSociosPaginas(): number {
    return this.totalPaginasSociosBackend;
  }

  get sociosModalPaginaActual(): number {
    return this.paginaSocioModalActual + 1;
  }

  get totalSociosModalPaginas(): number {
    return this.totalPaginasSocioModal;
  }

  get paginasModal(): number[] {
    return this.paginasVisiblesModal.map(p => p + 1);
  }

  cambiarPaginaModal(paginaUnoBased: number): void {
    this.irPaginaSocioModal(paginaUnoBased - 1);
  }

  // --- MANEJO DE IMÁGENES Y AVATAR ---
  getUserFoto(socio: any): string | null {
    if (!socio) return null;
    let rawUrl = socio.fotoUrl || socio.avatarUrl || socio.fotoPerfil || socio.foto || socio.avatar || null;

    if (!rawUrl || typeof rawUrl !== 'string') return null;

    rawUrl = rawUrl.trim();
    if (rawUrl === '' || rawUrl === 'null' || rawUrl === 'undefined') return null;

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

  // --- ACCIONES MODAL ---
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

  // --- PAGINACIÓN TARJETAS Y SOCIOS ---
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
      this.cargarDashboard(pZeroBased);
    }
  }

  paginaAnteriorMembresias(): void {
    if (this.paginaMembresiasActual > 0) this.cambiarPaginaMembresias(this.paginaMembresiasActual - 1);
  }

  paginaSiguienteMembresias(): void {
    if (this.paginaMembresiasActual < this.totalPaginasMembresiasBackend - 1) this.cambiarPaginaMembresias(this.paginaMembresiasActual + 1);
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
    if (this.sociosPaginaActual < this.totalPaginasSociosBackend - 1) this.cambiarPaginaSocios(this.sociosPaginaActual + 1);
  }

  // --- PAGINACIÓN POR VENCER ---
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

  paginaAnteriorPorVencer(): void {
    if (this.paginaPorVencerActual > 1) this.paginaPorVencerActual--;
  }

  paginaSiguientePorVencer(): void {
    if (this.paginaPorVencerActual < this.totalPaginasPorVencer) this.paginaPorVencerActual++;
  }

  irAPaginaPorVencer(pagina: number): void {
    this.paginaPorVencerActual = pagina;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.mostrarModalFlexible = false;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.vistaActual === 'socios' && this.membresiaSeleccionada) {
      this.verSocios(this.membresiaSeleccionada.id, 0);
    } else {
      this.cargarDashboard(this.paginaMembresiasActual);
    }
  }

  // --- OPERACIONES ---
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
        this.cargarDashboard(this.paginaMembresiasActual);
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
        this.cargarDashboard(this.paginaMembresiasActual);
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
        this.cargarDashboard(this.paginaMembresiasActual);
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
        this.cargarDashboard(this.paginaMembresiasActual);
      },
      error: (err: any) => {
        this.accionEnProceso = false;
        Swal.fire('Error', err.error?.message || 'Ocurrió un error al intentar renovar la membresía.', 'error');
      },
    });
  }

  // --- AUXILIARES ---
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
    this.cargarDashboard(this.paginaMembresiasActual);
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