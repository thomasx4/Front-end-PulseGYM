import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PhysicalHistoryService } from '../../../../../core/services/physical-history.service';
import { UserService, FiltrosPerfiles } from '../../../../../core/services/user.service';
import { PhysicalHistory, PhysicalHistoryRequest } from '../../../../../core/models/physical-history';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-physical-history-form',
  templateUrl: './physical-history-form.component.html',
  styleUrls: ['./physical-history-form.component.scss']
})
export class PhysicalHistoryFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  idHistorial: number | null = null;
  loading: boolean = false;
  submitting: boolean = false;

  // Modales y Paginación de Usuario a Evaluar
  socios: any[] = [];
  selectedSocio: any = null;
  searchSocio: string = '';
  showSocioModal: boolean = false;
  paginaSocioModalActual: number = 0;
  itemsPorPaginaSocioModal: number = 5;
  totalElementosSocioModal: number = 0;
  totalPaginasSocioModal: number = 0;
  loadingSocioUsers: boolean = false;

  // Modales y Paginación de Encargado (RECEPCIONISTA / ENTRENADOR)
  recepcionistas: any[] = [];
  selectedRecepcionista: any = null;
  searchRecepcionista: string = '';
  showRecepcionistaModal: boolean = false;
  paginaRecepcionistaModalActual: number = 0;
  itemsPorPaginaRecepcionistaModal: number = 5;
  totalElementosRecepcionistaModal: number = 0;
  totalPaginasRecepcionistaModal: number = 0;
  loadingRecepcionistaUsers: boolean = false;

  editMetaInfo = {
    fechaFormatted: '',
    registradoPor: ''
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private physicalHistoryService: PhysicalHistoryService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.idHistorial = +params['id'];
        this.loadRecordData(this.idHistorial);
      }
    });
  }

  private initForm(): void {
    const defaultDate = this.formatDateForInput(new Date());

    this.form = this.fb.group({
      idSocio: [null, [Validators.required]],
      idRecepcionista: [null],
      fechaMedicion: [defaultDate],
      pesoKg: [null, [Validators.required, Validators.min(0)]],
      alturaCm: [null, [Validators.min(0), Validators.max(300)]],
      porcentajeGrasa: [null, [Validators.min(0), Validators.max(100)]],
      porcentajeMusculo: [null, [Validators.min(0), Validators.max(100)]],
      cuelloCm: [null, [Validators.min(0)]],
      cinturaEscapularCm: [null, [Validators.min(0)]],
      cinturaCm: [null, [Validators.min(0)]],
      caderaCm: [null, [Validators.min(0)]],
      toraxCm: [null, [Validators.min(0)]],
      pechoCm: [null, [Validators.min(0)]],
      brazoIzqCm: [null, [Validators.min(0)]],
      brazoDerCm: [null, [Validators.min(0)]],
      piernaIzqCm: [null, [Validators.min(0)]],
      piernaDerCm: [null, [Validators.min(0)]],
      pantorrillaIzqCm: [null, [Validators.min(0)]],
      pantorrillaDerCm: [null, [Validators.min(0)]]
    });
  }

  // --- OBTENCIÓN DINÁMICA DE USUARIOS PARA MODAL (SOCIOS) ---
  cargarSociosModal(): void {
    this.loadingSocioUsers = true;
    const busquedaTerm = this.searchSocio.trim();

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

        if (Array.isArray(response) || listaFiltrada.length !== arrayCompleto.length) {
          this.totalElementosSocioModal = listaFiltrada.length;
          this.totalPaginasSocioModal = Math.ceil(this.totalElementosSocioModal / this.itemsPorPaginaSocioModal) || 1;
          const inicioSlice = this.paginaSocioModalActual * this.itemsPorPaginaSocioModal;
          this.socios = listaFiltrada.slice(inicioSlice, inicioSlice + this.itemsPorPaginaSocioModal);
        } else {
          this.socios = listaFiltrada;
          this.totalElementosSocioModal = response.totalElementos ?? response.totalElements ?? listaFiltrada.length;
          this.totalPaginasSocioModal = response.totalPaginas ?? response.totalPages ?? 1;
          this.paginaSocioModalActual = response.numeroPagina ?? response.currentPage ?? response.number ?? 0;
        }

        this.loadingSocioUsers = false;
      },
      error: () => {
        this.socios = [];
        this.totalElementosSocioModal = 0;
        this.totalPaginasSocioModal = 0;
        this.loadingSocioUsers = false;
      }
    });
  }

  // --- OBTENCIÓN DINÁMICA DE ENCARGADOS PARA MODAL ---
  cargarRecepcionistasModal(): void {
    this.loadingRecepcionistaUsers = true;
    const busquedaTerm = this.searchRecepcionista.trim();

    const filtros: FiltrosPerfiles = {
      pagina: this.paginaRecepcionistaModalActual,
      tamanio: this.itemsPorPaginaRecepcionistaModal,
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

        let listaFiltrada = arrayCompleto.filter(u => {
          const rol = this.getRolNombre(u).toUpperCase();
          return rol.includes('RECEPCIONISTA') || rol.includes('ENTRENADOR') || rol.includes('ADMIN');
        });

        if (busquedaTerm) {
          const query = busquedaTerm.toLowerCase();
          listaFiltrada = listaFiltrada.filter(u =>
            (u.nombre && u.nombre.toLowerCase().includes(query)) ||
            (u.apellido && u.apellido.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query)) ||
            (u.telefono && u.telefono.includes(query))
          );
        }

        this.totalElementosRecepcionistaModal = listaFiltrada.length;
        this.totalPaginasRecepcionistaModal = Math.ceil(this.totalElementosRecepcionistaModal / this.itemsPorPaginaRecepcionistaModal) || 1;
        const inicioSlice = this.paginaRecepcionistaModalActual * this.itemsPorPaginaRecepcionistaModal;
        this.recepcionistas = listaFiltrada.slice(inicioSlice, inicioSlice + this.itemsPorPaginaRecepcionistaModal);

        this.loadingRecepcionistaUsers = false;
      },
      error: () => {
        this.recepcionistas = [];
        this.totalElementosRecepcionistaModal = 0;
        this.totalPaginasRecepcionistaModal = 0;
        this.loadingRecepcionistaUsers = false;
      }
    });
  }

private loadRecordData(id: number): void {
  this.loading = true;
  this.physicalHistoryService.getAll().subscribe({
    next: (response) => {
      // Extraemos el arreglo dependiendo de la estructura de la respuesta
      let records: PhysicalHistory[] = [];
      if (Array.isArray(response)) {
        records = response;
      } else {
        records = response.data || response.contenido || response.content || [];
      }

      const item = records.find((r: PhysicalHistory) => r.idHistorialFisico === id);
      if (item) {
        this.form.patchValue({
          idSocio: item.idSocio,
          idRecepcionista: item.idRecepcionista || null,
          fechaMedicion: item.fechaMedicion ? this.formatDateForInput(new Date(item.fechaMedicion)) : '',
          pesoKg: item.pesoKg,
          alturaCm: item.alturaCm || null,
          porcentajeGrasa: item.porcentajeGrasa,
          porcentajeMusculo: item.porcentajeMusculo,
          cuelloCm: item.cuelloCm || null,
          cinturaEscapularCm: item.cinturaEscapularCm || null,
          cinturaCm: item.cinturaCm,
          caderaCm: item.caderaCm || null,
          toraxCm: item.toraxCm || null,
          pechoCm: item.pechoCm,
          brazoIzqCm: item.brazoIzqCm,
          brazoDerCm: item.brazoDerCm,
          piernaIzqCm: item.piernaIzqCm,
          piernaDerCm: item.piernaDerCm,
          pantorrillaIzqCm: item.pantorrillaIzqCm || null,
          pantorrillaDerCm: item.pantorrillaDerCm || null
        });

        if (item.idSocio) {
          this.userService.obtenerPerfilPorId(item.idSocio).subscribe({
            next: (perfil) => {
              this.selectedSocio = perfil || {
                idUsuario: item.idSocio,
                nombre: item.nombreSocio || 'Usuario',
                apellido: '',
                email: ''
              };
            },
            error: () => {
              this.selectedSocio = {
                idUsuario: item.idSocio,
                nombre: item.nombreSocio || 'Usuario',
                apellido: '',
                email: ''
              };
            }
          });
        }

        if (item.idRecepcionista) {
          this.userService.obtenerPerfilPorId(item.idRecepcionista).subscribe({
            next: (perfil) => {
              this.selectedRecepcionista = perfil || {
                idUsuario: item.idRecepcionista,
                nombre: item.nombreRecepcionista || 'Recepcionista',
                apellido: '',
                email: ''
              };
            },
            error: () => {
              this.selectedRecepcionista = {
                idUsuario: item.idRecepcionista,
                nombre: item.nombreRecepcionista || 'Recepcionista',
                apellido: '',
                email: ''
              };
            }
          });
        }

        this.editMetaInfo = {
          fechaFormatted: item.fechaMedicion ? new Date(item.fechaMedicion).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
          registradoPor: item.nombreRecepcionista || 'Sistema'
        };
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error al cargar medición:', err);
      this.loading = false;
    }
  });
}

  // --- AUXILIARES Y FOTOS ---

  getUserFoto(user: any): string | null {
    if (!user) return null;

    let rawUrl = 
      user.fotoUrl ||
      user.fotoPerfil || 
      user.foto || 
      user.avatar || 
      null;

    if (!rawUrl || typeof rawUrl !== 'string') return null;

    rawUrl = rawUrl.trim();
    if (rawUrl === '' || rawUrl === 'null' || rawUrl === 'undefined') return null;

    if (rawUrl.startsWith('//')) {
      return `https:${rawUrl}`;
    }

    return rawUrl;
  }

  onImageError(user: any): void {
    if (user) {
      user.fotoUrl = '';
      user.fotoPerfil = '';
      user.foto = '';
      user._avatarError = true;
    }
  }

  getRolNombre(user: any): string {
    if (!user) return 'Usuario';
    if (typeof user.rol === 'string') return user.rol;
    return user.rol?.nombreRol || user.rol?.nombre || 'Socio';
  }

  getBadgeClass(user: any): string {
    const rol = this.getRolNombre(user).toUpperCase();
    if (rol.includes('SOCIO')) return 'rol-socio';
    if (rol.includes('RECEPCIONISTA')) return 'rol-recepcion';
    if (rol.includes('ENTRENADOR')) return 'rol-entrenador';
    if (rol.includes('ADMIN')) return 'rol-admin';
    return 'rol-default';
  }

  // --- SELECCIÓN Y MODAL DE USUARIO (SOCIO) ---

  abrirModalSocio(): void {
    if (this.isEditMode) return;
    this.searchSocio = '';
    this.paginaSocioModalActual = 0;
    this.showSocioModal = true;
    this.cargarSociosModal();
  }

  cerrarModalSocio(): void {
    this.showSocioModal = false;
  }

  filtrarSociosModal(): void {
    this.paginaSocioModalActual = 0;
    this.cargarSociosModal();
  }

  irPaginaSocioModal(pZeroBased: number): void {
    if (pZeroBased !== this.paginaSocioModalActual && pZeroBased >= 0 && pZeroBased < this.totalPaginasSocioModal) {
      this.paginaSocioModalActual = pZeroBased;
      this.cargarSociosModal();
    }
  }

  paginaAnteriorSocioModal(): void {
    if (this.paginaSocioModalActual > 0) {
      this.irPaginaSocioModal(this.paginaSocioModalActual - 1);
    }
  }

  paginaSiguienteSocioModal(): void {
    if (this.paginaSocioModalActual < this.totalPaginasSocioModal - 1) {
      this.irPaginaSocioModal(this.paginaSocioModalActual + 1);
    }
  }

  get paginasVisiblesSocioModal(): number[] {
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

  seleccionarSocioModal(socio: any): void {
    const id = socio.idUsuario || socio.id;
    this.selectedSocio = socio;
    this.form.patchValue({ idSocio: id });
    this.cerrarModalSocio();

    Swal.fire({
      icon: 'success',
      title: 'Usuario seleccionado',
      text: `${socio.nombre} ${socio.apellido || ''} ha sido asignado para evaluación.`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  limpiarSocio(): void {
    if (this.isEditMode) return;
    this.selectedSocio = null;
    this.form.patchValue({ idSocio: null });
  }

  // --- SELECCIÓN Y MODAL DE ENCARGADO (RECEPCIONISTA) ---

  abrirModalRecepcionista(): void {
    if (this.isEditMode) return;
    this.searchRecepcionista = '';
    this.paginaRecepcionistaModalActual = 0;
    this.showRecepcionistaModal = true;
    this.cargarRecepcionistasModal();
  }

  cerrarModalRecepcionista(): void {
    this.showRecepcionistaModal = false;
  }

  filtrarRecepcionistasModal(): void {
    this.paginaRecepcionistaModalActual = 0;
    this.cargarRecepcionistasModal();
  }

  irPaginaRecepcionistaModal(pZeroBased: number): void {
    if (pZeroBased !== this.paginaRecepcionistaModalActual && pZeroBased >= 0 && pZeroBased < this.totalPaginasRecepcionistaModal) {
      this.paginaRecepcionistaModalActual = pZeroBased;
      this.cargarRecepcionistasModal();
    }
  }

  paginaAnteriorRecepcionistaModal(): void {
    if (this.paginaRecepcionistaModalActual > 0) {
      this.irPaginaRecepcionistaModal(this.paginaRecepcionistaModalActual - 1);
    }
  }

  paginaSiguienteRecepcionistaModal(): void {
    if (this.paginaRecepcionistaModalActual < this.totalPaginasRecepcionistaModal - 1) {
      this.irPaginaRecepcionistaModal(this.paginaRecepcionistaModalActual + 1);
    }
  }

  get paginasVisiblesRecepcionistaModal(): number[] {
    const maxVisibles = 4;
    let inicio = Math.max(0, this.paginaRecepcionistaModalActual - 1);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPaginasRecepcionistaModal) {
      fin = this.totalPaginasRecepcionistaModal;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  seleccionarRecepcionistaModal(recepcionista: any): void {
    const id = recepcionista.idUsuario || recepcionista.id;
    this.selectedRecepcionista = recepcionista;
    this.form.patchValue({ idRecepcionista: id });
    this.cerrarModalRecepcionista();

    Swal.fire({
      icon: 'success',
      title: 'Encargado asignado',
      text: `${recepcionista.nombre} ${recepcionista.apellido || ''} ha sido asignado.`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  limpiarRecepcionista(): void {
    if (this.isEditMode) return;
    this.selectedRecepcionista = null;
    this.form.patchValue({ idRecepcionista: null });
  }

  // --- ENVÍO DEL FORMULARIO ---

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor asigna un usuario a evaluar y completa los campos obligatorios.',
        confirmButtonColor: '#0e3b72'
      });
      return;
    }

    this.submitting = true;
    const rawVal = this.form.value;

    const payload: PhysicalHistoryRequest = {
      idSocio: Number(rawVal.idSocio),
      idRecepcionista: rawVal.idRecepcionista ? Number(rawVal.idRecepcionista) : undefined,
      fechaMedicion: rawVal.fechaMedicion ? new Date(rawVal.fechaMedicion).toISOString() : undefined,
      pesoKg: Number(rawVal.pesoKg),
      alturaCm: rawVal.alturaCm ? Number(rawVal.alturaCm) : undefined,
      porcentajeGrasa: rawVal.porcentajeGrasa !== null && rawVal.porcentajeGrasa !== '' ? Number(rawVal.porcentajeGrasa) : 0,
      porcentajeMusculo: rawVal.porcentajeMusculo !== null && rawVal.porcentajeMusculo !== '' ? Number(rawVal.porcentajeMusculo) : 0,
      cuelloCm: rawVal.cuelloCm ? Number(rawVal.cuelloCm) : 0,
      cinturaEscapularCm: rawVal.cinturaEscapularCm ? Number(rawVal.cinturaEscapularCm) : 0,
      cinturaCm: rawVal.cinturaCm ? Number(rawVal.cinturaCm) : 0,
      caderaCm: rawVal.caderaCm ? Number(rawVal.caderaCm) : 0,
      toraxCm: rawVal.toraxCm ? Number(rawVal.toraxCm) : 0,
      pechoCm: rawVal.pechoCm ? Number(rawVal.pechoCm) : 0,
      brazoIzqCm: rawVal.brazoIzqCm ? Number(rawVal.brazoIzqCm) : 0,
      brazoDerCm: rawVal.brazoDerCm ? Number(rawVal.brazoDerCm) : 0,
      piernaIzqCm: rawVal.piernaIzqCm ? Number(rawVal.piernaIzqCm) : 0,
      piernaDerCm: rawVal.piernaDerCm ? Number(rawVal.piernaDerCm) : 0,
      pantorrillaIzqCm: rawVal.pantorrillaIzqCm ? Number(rawVal.pantorrillaIzqCm) : 0,
      pantorrillaDerCm: rawVal.pantorrillaDerCm ? Number(rawVal.pantorrillaDerCm) : 0
    };

    if (this.isEditMode && this.idHistorial) {
      this.physicalHistoryService.update(this.idHistorial, payload).subscribe({
        next: () => {
          this.submitting = false;
          Swal.fire({
            icon: 'success',
            title: 'Medición Actualizada',
            text: 'Se actualizaron los datos correctamente.',
            confirmButtonColor: '#0e3b72'
          });
          this.onCancel();
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.submitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'No se pudo actualizar la medición.',
            confirmButtonColor: '#0e3b72'
          });
        }
      });
    } else {
      this.physicalHistoryService.create(payload).subscribe({
        next: () => {
          this.submitting = false;
          Swal.fire({
            icon: 'success',
            title: 'Medición Registrada',
            text: 'La medición física ha sido guardada correctamente.',
            confirmButtonColor: '#0e3b72'
          });
          this.onCancel();
        },
        error: (err) => {
          console.error('Error al crear:', err);
          this.submitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'No se pudo registrar la medición física.',
            confirmButtonColor: '#0e3b72'
          });
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard-admin/users/physical-history']);
  }

  private formatDateForInput(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}