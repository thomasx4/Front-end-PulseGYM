import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DocumentService } from '../../../../../core/services/document.service';
import { UserService } from '../../../../../core/services/user.service';
import { CloudinaryService } from '../../../../../core/services/cloudinary.service';
import { getTipoDocumentoLabel } from '../../../../../core/models/document';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-documents-form',
  templateUrl: './documents-form.component.html',
  styleUrls: ['./documents-form.component.scss'],
})
export class DocumentsFormComponent implements OnInit {
  documentForm!: FormGroup;
  isEditMode: boolean = false;
  documentId: number | null = null;
  loading: boolean = false;
  submitting: boolean = false;
  tiposDocumento: string[] = [];

  usuarios: any[] = [];
  sociosFiltradosModal: any[] = [];
  selectedUsuario: any = null;
  searchUsuario: string = '';

  showPartnerModal: boolean = false;
  paginaModalActual: number = 1;
  itemsPorPaginaModal: number = 5;

  selectedFile: File | null = null;
  uploadingFile: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private userService: UserService,
    private cloudinaryService: CloudinaryService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarTiposDocumento();
    this.cargarUsuarios();
    this.verificarModoEdicion();
  }

  private initForm(): void {
    this.documentForm = this.fb.group({
      idUsuario: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      urlArchivoFirmado: [''],
    });
  }

  private cargarTiposDocumento(): void {
    this.documentService.obtenerTiposDocumento().subscribe({
      next: (data) => (this.tiposDocumento = data),
      error: () => {
        this.tiposDocumento = ['CONSENTIEMIENTO_INFORMADO', 'CONTRATO', 'EXONERACION'];
      },
    });
  }

  private cargarUsuarios(): void {
    this.userService.obtenerTodosLosPerfilesActivos().subscribe({
      next: (data: any[]) => {
        this.usuarios = data || [];
        this.sociosFiltradosModal = [...this.usuarios];
      },
      error: () => {
        this.usuarios = [];
        this.sociosFiltradosModal = [];
      },
    });
  }

  private verificarModoEdicion(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.documentId = parseInt(id);
        this.cargarDocumento(this.documentId);
      }
    });
  }

private cargarDocumento(id: number): void {
    this.loading = true;
    this.documentService.obtenerDocumentoPorId(id).subscribe({
      next: (data: any) => {
        this.documentForm.patchValue({
          idUsuario: data.idUsuario,
          tipoDocumento: data.tipoDocumento,
          urlArchivoFirmado: data.urlArchivoFirmado,
        });

        const usuarioEncontrado = this.usuarios.find((u) => u.idUsuario === data.idUsuario);

        this.selectedUsuario = usuarioEncontrado || {
          idUsuario: data.idUsuario,
          nombre: data.nombreUsuario || 'Usuario',
          apellido: '',
          email: 'Sin email',
          rol: data.rolUsuario || 'SOCIO'
        };
        
        this.loading = false;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el documento.',
          confirmButtonColor: '#0f1c3f',
        });
        this.loading = false;
        this.volver();
      },
    });
  }

  // --- MODAL Y NAVEGACIÓN DE USUARIOS ---

  abrirModalSeleccionSocio(): void {
    this.searchUsuario = '';
    this.sociosFiltradosModal = [...this.usuarios];
    this.paginaModalActual = 1;
    this.showPartnerModal = true;
  }

  cerrarModalSeleccionSocio(): void {
    this.showPartnerModal = false;
  }

  filtrarSociosModal(): void {
    const term = this.searchUsuario.toLowerCase().trim();
    if (!term) {
      this.sociosFiltradosModal = [...this.usuarios];
    } else {
      this.sociosFiltradosModal = this.usuarios.filter(
        (u) =>
          u.nombre?.toLowerCase().includes(term) ||
          u.apellido?.toLowerCase().includes(term) ||
          (u.telefono && u.telefono.includes(term)) ||
          u.email?.toLowerCase().includes(term) ||
          u.rol?.toLowerCase().includes(term)
      );
    }
    this.paginaModalActual = 1;
  }

  get sociosPaginados(): any[] {
    const inicio = (this.paginaModalActual - 1) * this.itemsPorPaginaModal;
    return this.sociosFiltradosModal.slice(inicio, inicio + this.itemsPorPaginaModal);
  }

  get totalPaginasModal(): number {
    return Math.ceil(this.sociosFiltradosModal.length / this.itemsPorPaginaModal) || 1;
  }

  get paginasVisiblesModal(): number[] {
    const total = this.totalPaginasModal;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  seleccionarSocioDesdeModal(usuario: any): void {
    this.selectedUsuario = usuario;
    this.documentForm.patchValue({ idUsuario: usuario.idUsuario });
    this.cerrarModalSeleccionSocio();

    Swal.fire({
      icon: 'success',
      title: 'Usuario asignado',
      text: `${usuario.nombre} ${usuario.apellido} ha sido asignado al documento.`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  limpiarSeleccion(): void {
    this.selectedUsuario = null;
    this.documentForm.patchValue({ idUsuario: '' });
  }

  // --- FORMATO DE ROLES PARA LA VISTA ---

  getRolLabel(rol: string): string {
    if (!rol) return 'Socio';
    switch (rol.toUpperCase()) {
      case 'ADMIN':
      case 'ADMINISTRADOR':
        return 'Administrador';
      case 'RECEPCIONISTA':
      case 'RECP':
        return 'Recepcionista';
      case 'ENTRENADOR':
      case 'TRAINER':
        return 'Entrenador';
      case 'SOCIO':
      case 'USER':
      case 'CLIENTE':
        return 'Socio';
      default:
        return rol;
    }
  }

  getRolClass(rol: string): string {
    if (!rol) return 'rol-socio';
    switch (rol.toUpperCase()) {
      case 'ADMIN':
      case 'ADMINISTRADOR':
        return 'rol-admin';
      case 'RECEPCIONISTA':
      case 'RECP':
        return 'rol-recep';
      case 'ENTRENADOR':
      case 'TRAINER':
        return 'rol-entrenador';
      default:
        return 'rol-socio';
    }
  }

  // --- ARCHIVO PDF Y ENVÍO ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.type !== 'application/pdf') {
        Swal.fire({
          icon: 'error',
          title: 'Formato no válido',
          text: 'Solo se permiten archivos PDF.',
          confirmButtonColor: '#0f1c3f',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo excede límite',
          text: 'El tamaño máximo permitido es 10MB.',
          confirmButtonColor: '#0f1c3f',
        });
        return;
      }

      this.selectedFile = file;
    }
  }

  private async subirArchivo(): Promise<string> {
    if (!this.selectedFile) return '';

    this.uploadingFile = true;
    try {
      Swal.fire({
        title: 'Subiendo documento...',
        text: 'Por favor espera un momento.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await this.cloudinaryService.uploadImage(this.selectedFile).toPromise();
      Swal.close();

      if (response && response.secure_url) {
        return response.secure_url;
      }
      throw new Error('No se recibió la URL del archivo');
    } catch (error: any) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error al subir archivo',
        text: error.message || 'No se pudo subir el archivo PDF.',
        confirmButtonColor: '#0f1c3f',
      });
      throw error;
    } finally {
      this.uploadingFile = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor asigna un usuario y elige un tipo de documento.',
        confirmButtonColor: '#0f1c3f',
      });
      return;
    }

    this.submitting = true;
    const formValues = this.documentForm.value;

    try {
      let urlArchivo = formValues.urlArchivoFirmado;
      if (this.selectedFile) {
        urlArchivo = await this.subirArchivo();
      }

      const payload = {
        idUsuario: formValues.idUsuario,
        tipoDocumento: formValues.tipoDocumento,
        urlArchivoFirmado: urlArchivo || null,
      };

      this.documentService.crearDocumento(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Documento Guardado',
            text: 'El documento se registró correctamente.',
            confirmButtonColor: '#0f1c3f',
          });
          this.volver();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.message || 'No se pudo guardar el documento.',
            confirmButtonColor: '#0f1c3f',
          });
          this.submitting = false;
        },
      });
    } catch {
      this.submitting = false;
    }
  }

  getTipoDocumentoLabel(tipo: string): string {
    return getTipoDocumentoLabel(tipo);
  }

  volver(): void {
    this.router.navigate(['/dashboard-admin/users/documents']);
  }
}