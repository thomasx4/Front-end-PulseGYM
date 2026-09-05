import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment.prod';
import { UserService, FiltrosPerfiles } from '../../../../../core/services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-medical-profile-form',
  templateUrl: './medical-profile-form.component.html',
  styleUrls: ['./medical-profile-form.component.scss']
})
export class MedicalProfileFormComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/perfil-medico`;

  profileForm!: FormGroup;
  isEditMode: boolean = false;
  idSocio: number | null = null;
  loading: boolean = false;

  // Variables para el modal de asignación de usuarios
  usuarios: any[] = [];
  selectedUsuario: any = null;
  searchUsuario: string = '';
  showPartnerModal: boolean = false;
  paginaModalActual: number = 0;
  itemsPorPaginaModal: number = 5;
  totalElementosModal: number = 0;
  totalPaginasModal: number = 0;
  loadingModalUsers: boolean = false;

  avatarSelectedError: boolean = false;
  modalAvatarErrors: Set<number> = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.idSocio = +idParam;
      this.cargarPerfilParaEditar(this.idSocio);
    }
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      pesoKg: [null, [Validators.min(0)]],
      estaturaCm: [null, [Validators.min(0)]],
      porcentajeGrasa: [null, [Validators.min(0), Validators.max(100)]],
      alergias: [''],
      condicionesCronicas: [''],
      lesionesPrevias: [''],
      idUsuario: ['', Validators.required]
    });
  }

  cargarPerfilParaEditar(id: number): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
      next: (response) => {
        this.profileForm.patchValue({
          pesoKg: response.pesoKg,
          estaturaCm: response.estaturaCm,
          porcentajeGrasa: response.porcentajeGrasa,
          alergias: response.alergias,
          condicionesCronicas: response.condicionesCronicas,
          lesionesPrevias: response.lesionesPrevias,
          idUsuario: response.idSocio
        });

        if (response.idSocio) {
          this.userService.obtenerPerfilPorId(response.idSocio).subscribe({
            next: (perfil) => {
              this.selectedUsuario = perfil || {
                idUsuario: response.idSocio,
                nombre: response.nombreSocio || 'Usuario',
                apellido: '',
                email: 'Sin email',
                rol: 'SOCIO'
              };
            },
            error: () => {
              this.selectedUsuario = {
                idUsuario: response.idSocio,
                nombre: response.nombreSocio || 'Usuario',
                apellido: '',
                email: 'Sin email',
                rol: 'SOCIO'
              };
            }
          });
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar perfil para editar:', err);
        Swal.fire('Error', 'No se pudo cargar la información del perfil médico.', 'error');
        this.loading = false;
        this.volverALista();
      }
    });
  }

  cargarUsuariosModal(): void {
    this.loadingModalUsers = true;
    const busquedaTerm = this.searchUsuario.trim();

    const filtros: FiltrosPerfiles = {
      pagina: this.paginaModalActual,
      tamanio: this.itemsPorPaginaModal,
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
            (u.telefono && u.telefono.includes(query)) ||
            (u.rol && u.rol.toLowerCase().includes(query))
          );
        }

        if (Array.isArray(response) || listaFiltrada.length !== arrayCompleto.length) {
          this.totalElementosModal = listaFiltrada.length;
          this.totalPaginasModal = Math.ceil(this.totalElementosModal / this.itemsPorPaginaModal) || 1;
          const inicioSlice = this.paginaModalActual * this.itemsPorPaginaModal;
          this.usuarios = listaFiltrada.slice(inicioSlice, inicioSlice + this.itemsPorPaginaModal);
        } else {
          this.usuarios = listaFiltrada;
          this.totalElementosModal = response.totalElementos ?? response.totalElements ?? listaFiltrada.length;
          this.totalPaginasModal = response.totalPaginas ?? response.totalPages ?? 1;
          this.paginaModalActual = response.numeroPagina ?? response.currentPage ?? response.number ?? 0;
        }

        this.loadingModalUsers = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios en modal:', error);
        this.usuarios = [];
        this.totalElementosModal = 0;
        this.totalPaginasModal = 0;
        this.loadingModalUsers = false;
      }
    });
  }

  // --- MODAL Y SELECCIÓN ---
  abrirModalSeleccionSocio(): void {
    this.searchUsuario = '';
    this.paginaModalActual = 0;
    this.showPartnerModal = true;
    this.cargarUsuariosModal();
  }

  cerrarModalSeleccionSocio(): void {
    this.showPartnerModal = false;
  }

  filtrarSociosModal(): void {
    this.paginaModalActual = 0;
    this.cargarUsuariosModal();
  }

  irPaginaModal(pZeroBased: number): void {
    if (pZeroBased !== this.paginaModalActual && pZeroBased >= 0 && pZeroBased < this.totalPaginasModal) {
      this.paginaModalActual = pZeroBased;
      this.cargarUsuariosModal();
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

  seleccionarSocioDesdeModal(usuario: any): void {
    this.selectedUsuario = usuario;
    this.avatarSelectedError = false;
    this.profileForm.patchValue({ idUsuario: usuario.idUsuario });
    this.cerrarModalSeleccionSocio();

    Swal.fire({
      icon: 'success',
      title: 'Usuario asignado',
      text: `${usuario.nombre} ${usuario.apellido || ''} ha sido asignado al perfil médico.`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  limpiarSeleccion(): void {
    this.selectedUsuario = null;
    this.avatarSelectedError = false;
    this.profileForm.patchValue({ idUsuario: '' });
  }

  // --- AVATARES Y ROLES ---
  getUsuarioFoto(usuario: any): string | null {
    if (!usuario) return null;
    let rawUrl = usuario.fotoUrl || usuario.fotoPerfil || usuario.foto || usuario.avatar || null;
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    rawUrl = rawUrl.trim();
    if (rawUrl === '' || rawUrl === 'null' || rawUrl === 'undefined') return null;
    if (rawUrl.startsWith('//')) return `https:${rawUrl}`;
    return rawUrl;
  }

  onAvatarError(): void { this.avatarSelectedError = true; }
  hasAvatarError(): boolean { return this.avatarSelectedError; }

  onModalAvatarError(idUsuario: number): void {
    if (idUsuario) this.modalAvatarErrors.add(idUsuario);
  }

  hasModalAvatarError(idUsuario: number): boolean {
    return this.modalAvatarErrors.has(idUsuario);
  }

  getInitials(nombre?: string, apellido?: string): string {
    const n = nombre ? nombre.trim().charAt(0) : '?';
    const a = apellido ? apellido.trim().charAt(0) : '';
    return (n + a).toUpperCase() || '?';
  }

  getRolLabel(rol: string): string {
    if (!rol) return 'Socio';
    switch (rol.toUpperCase()) {
      case 'ADMIN': case 'ADMINISTRADOR': return 'Administrador';
      case 'RECEPCIONISTA': case 'RECP': return 'Recepcionista';
      case 'ENTRENADOR': case 'TRAINER': return 'Entrenador';
      case 'SOCIO': case 'USER': case 'CLIENTE': return 'Socio';
      default: return rol;
    }
  }

  getRolClass(rol: string): string {
    if (!rol) return 'rol-socio';
    switch (rol.toUpperCase()) {
      case 'ADMIN': case 'ADMINISTRADOR': return 'rol-admin';
      case 'RECEPCIONISTA': case 'RECP': return 'rol-recep';
      case 'ENTRENADOR': case 'TRAINER': return 'rol-entrenador';
      default: return 'rol-socio';
    }
  }

  guardarPerfil(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      Swal.fire('Atención', 'Por favor asigna un usuario y completa los campos correctamente.', 'warning');
      return;
    }

    this.loading = true;
    const formValues = this.profileForm.getRawValue();
    
    // El backend espera idSocio en lugar de idUsuario según el modelo de perfiles médicos
    const payload = {
      pesoKg: formValues.pesoKg,
      estaturaCm: formValues.estaturaCm,
      porcentajeGrasa: formValues.porcentajeGrasa,
      alergias: formValues.alergias,
      condicionesCronicas: formValues.condicionesCronicas,
      lesionesPrevias: formValues.lesionesPrevias,
      idSocio: formValues.idUsuario
    };

    if (this.isEditMode && this.idSocio) {
      this.http.put(`${this.apiUrl}/${this.idSocio}`, payload).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'El perfil médico ha sido actualizado exitosamente.', 'success');
          this.volverALista();
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          Swal.fire('Error', err.error?.message || 'No se pudo actualizar el perfil médico.', 'error');
          this.loading = false;
        }
      });
    } else {
      this.http.post(this.apiUrl, payload).subscribe({
        next: () => {
          Swal.fire('¡Registrado!', 'El perfil médico ha sido registrado exitosamente.', 'success');
          this.volverALista();
        },
        error: (err) => {
          console.error('Error al registrar:', err);
          Swal.fire('Error', err.error?.message || 'No se pudo registrar el perfil médico.', 'error');
          this.loading = false;
        }
      });
    }
  }

  volverALista(): void {
    this.router.navigate(['/dashboard-admin/users/medical-profile']);
  }
}