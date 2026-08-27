import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PhysicalHistoryService } from '../../../../../core/services/physical-history.service';
import { UserService } from '../../../../../core/services/user.service';
import { PhysicalHistoryRequest } from '../../../../../core/models/physical-history';
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

  // Lógica y Modales de Usuarios
  allUsers: any[] = [];

  // Usuario a Evaluar (Cualquier rol)
  socios: any[] = [];
  sociosFiltradosModal: any[] = [];
  selectedSocio: any = null;
  searchSocio: string = '';
  showSocioModal: boolean = false;
  paginaSocioModalActual: number = 1;
  itemsPorPaginaSocioModal: number = 5;

  // Encargado (Solo RECEPCIONISTA o ENTRENADOR)
  recepcionistas: any[] = [];
  recepcionistasFiltradosModal: any[] = [];
  selectedRecepcionista: any = null;
  searchRecepcionista: string = '';
  showRecepcionistaModal: boolean = false;
  paginaRecepcionistaModalActual: number = 1;
  itemsPorPaginaRecepcionistaModal: number = 5;

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
    this.loadUsers();

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

  private loadUsers(): void {
    this.userService.obtenerTodosLosPerfilesActivos().subscribe({
      next: (users: any[]) => {
        this.allUsers = users || [];

        // 1. Asignable Usuario a evaluar: CUALQUIER USUARIO REGISTRADO
        this.socios = [...this.allUsers];
        this.sociosFiltradosModal = [...this.socios];

        // 2. Asignable Encargado: ÚNICAMENTE RECEPCIONISTA O ENTRENADOR
        this.recepcionistas = this.allUsers.filter(u => {
          const rol = this.getRolNombre(u).toUpperCase();
          return rol.includes('RECEPCIONISTA') || rol.includes('ENTRENADOR');
        });
        this.recepcionistasFiltradosModal = [...this.recepcionistas];
      },
      error: (err) => {
        console.error('Error al cargar lista de usuarios:', err);
      }
    });
  }

  private loadRecordData(id: number): void {
    this.loading = true;
    this.physicalHistoryService.getAll().subscribe({
      next: (records) => {
        const item = records.find(r => r.idHistorialFisico === id);
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

          // Vincular Usuario seleccionado en Edición
          const socioEncontrado = this.allUsers.find(u => (u.idUsuario || u.id) === item.idSocio);
          this.selectedSocio = socioEncontrado || {
            idUsuario: item.idSocio,
            nombre: item.nombreSocio || 'Usuario',
            apellido: '',
            email: ''
          };

          // Vincular Encargado seleccionado en Edición si existe
          if (item.idRecepcionista) {
            const recEncontrado = this.allUsers.find(u => (u.idUsuario || u.id) === item.idRecepcionista);
            this.selectedRecepcionista = recEncontrado || {
              idUsuario: item.idRecepcionista,
              nombre: item.nombreRecepcionista || 'Recepcionista',
              apellido: '',
              email: ''
            };
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

  // --- MÉTODOS AUXILIARES DE FOTO CLOUDINARY (`fotoUrl`), ROL Y BADGES ---

  getUserFoto(user: any): string | null {
    if (!user) return null;

    // Se agrega fotoUrl que es como viene en UserProfile
    let rawUrl = 
      user.fotoUrl ||
      user.fotoPerfil || 
      user.foto || 
      user.avatar || 
      user.imagen || 
      user.profilePicture ||
      user.perfil?.fotoUrl ||
      user.perfil?.fotoPerfil ||
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

  // --- LÓGICA DE MODAL Y SELECCIÓN DE USUARIO A EVALUAR ---

  abrirModalSocio(): void {
    if (this.isEditMode) return;
    this.searchSocio = '';
    this.sociosFiltradosModal = [...this.socios];
    this.paginaSocioModalActual = 1;
    this.showSocioModal = true;
  }

  cerrarModalSocio(): void {
    this.showSocioModal = false;
  }

  filtrarSociosModal(): void {
    const term = this.searchSocio.toLowerCase().trim();
    if (!term) {
      this.sociosFiltradosModal = [...this.socios];
    } else {
      this.sociosFiltradosModal = this.socios.filter(
        u =>
          u.nombre?.toLowerCase().includes(term) ||
          u.apellido?.toLowerCase().includes(term) ||
          (u.telefono && u.telefono.includes(term)) ||
          u.email?.toLowerCase().includes(term)
      );
    }
    this.paginaSocioModalActual = 1;
  }

  get sociosPaginados(): any[] {
    const inicio = (this.paginaSocioModalActual - 1) * this.itemsPorPaginaSocioModal;
    return this.sociosFiltradosModal.slice(inicio, inicio + this.itemsPorPaginaSocioModal);
  }

  get totalPaginasSocioModal(): number {
    return Math.ceil(this.sociosFiltradosModal.length / this.itemsPorPaginaSocioModal) || 1;
  }

  get paginasVisiblesSocioModal(): number[] {
    const total = this.totalPaginasSocioModal;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  seleccionarSocioModal(socio: any): void {
    const id = socio.idUsuario || socio.id;
    this.selectedSocio = socio;
    this.form.patchValue({ idSocio: id });
    this.cerrarModalSocio();

    Swal.fire({
      icon: 'success',
      title: 'Usuario seleccionado',
      text: `${socio.nombre} ${socio.apellido} ha sido asignado para evaluación.`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  limpiarSocio(): void {
    if (this.isEditMode) return;
    this.selectedSocio = null;
    this.form.patchValue({ idSocio: null });
  }

  // --- LÓGICA DE MODAL Y SELECCIÓN DE RECEPCIONISTA / ENTRENADOR ---

  abrirModalRecepcionista(): void {
    if (this.isEditMode) return;
    this.searchRecepcionista = '';
    this.recepcionistasFiltradosModal = [...this.recepcionistas];
    this.paginaRecepcionistaModalActual = 1;
    this.showRecepcionistaModal = true;
  }

  cerrarModalRecepcionista(): void {
    this.showRecepcionistaModal = false;
  }

  filtrarRecepcionistasModal(): void {
    const term = this.searchRecepcionista.toLowerCase().trim();
    if (!term) {
      this.recepcionistasFiltradosModal = [...this.recepcionistas];
    } else {
      this.recepcionistasFiltradosModal = this.recepcionistas.filter(
        u =>
          u.nombre?.toLowerCase().includes(term) ||
          u.apellido?.toLowerCase().includes(term) ||
          (u.telefono && u.telefono.includes(term)) ||
          u.email?.toLowerCase().includes(term)
      );
    }
    this.paginaRecepcionistaModalActual = 1;
  }

  get recepcionistasPaginados(): any[] {
    const inicio = (this.paginaRecepcionistaModalActual - 1) * this.itemsPorPaginaRecepcionistaModal;
    return this.recepcionistasFiltradosModal.slice(inicio, inicio + this.itemsPorPaginaRecepcionistaModal);
  }

  get totalPaginasRecepcionistaModal(): number {
    return Math.ceil(this.recepcionistasFiltradosModal.length / this.itemsPorPaginaRecepcionistaModal) || 1;
  }

  get paginasVisiblesRecepcionistaModal(): number[] {
    const total = this.totalPaginasRecepcionistaModal;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  seleccionarRecepcionistaModal(recepcionista: any): void {
    const id = recepcionista.idUsuario || recepcionista.id;
    this.selectedRecepcionista = recepcionista;
    this.form.patchValue({ idRecepcionista: id });
    this.cerrarModalRecepcionista();

    Swal.fire({
      icon: 'success',
      title: 'Encargado asignado',
      text: `${recepcionista.nombre} ${recepcionista.apellido} ha sido asignado.`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  limpiarRecepcionista(): void {
    if (this.isEditMode) return;
    this.selectedRecepcionista = null;
    this.form.patchValue({ idRecepcionista: null });
  }

  // --- ENVÍO DE FORMULARIO ---

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