import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CertificateService } from '../../../../../core/services/certificate.service';
import { UserService } from '../../../../../core/services/user.service';
import { CloudinaryService } from '../../../../../core/services/cloudinary.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-certificates-form',
  templateUrl: './certificates-form.component.html',
  styleUrls: ['./certificates-form.component.scss'],
})
export class CertificatesFormComponent implements OnInit {
  certificateForm!: FormGroup;
  isEditMode: boolean = false;
  certificateId: number | null = null;
  loading: boolean = false;
  submitting: boolean = false;

  entrenadores: any[] = [];
  entrenadoresFiltradosModal: any[] = [];
  selectedEntrenador: any = null;
  searchEntrenador: string = '';

  showEntrenadorModal: boolean = false;
  paginaModalActual: number = 1;
  itemsPorPaginaModal: number = 5;

  selectedFile: File | null = null;
  existingUrl: string = '';
  uploadingFile: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private certificateService: CertificateService,
    private userService: UserService,
    private cloudinaryService: CloudinaryService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarEntrenadores();
    this.verificarModoEdicion();
  }

  private initForm(): void {
    this.certificateForm = this.fb.group({
      idEntrenador: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      urlPdf: [''],
    });
  }

  private cargarEntrenadores(): void {
    this.userService.obtenerTodosLosPerfilesActivos().subscribe({
      next: (data: any[]) => {
        const lista = data || [];
        this.entrenadores = lista.filter(u => u.rol && u.rol.toUpperCase() === 'ENTRENADOR');
        this.entrenadoresFiltradosModal = [...this.entrenadores];
      },
      error: () => {
        this.entrenadores = [];
        this.entrenadoresFiltradosModal = [];
      },
    });
  }

  private verificarModoEdicion(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.certificateId = parseInt(id);
        this.cargarCertificacion(this.certificateId);
      }
    });
  }

  private cargarCertificacion(id: number): void {
    this.loading = true;
    this.certificateService.obtenerTodasLasCertificaciones().subscribe({
      next: (certificaciones) => {
        const cert = certificaciones.find(c => c.idCertificacion === id);
        if (cert) {
          this.certificateForm.patchValue({
            idEntrenador: cert.idEntrenador,
            nombre: cert.nombreCertificacion,
            urlPdf: cert.urlPdf
          });

          this.existingUrl = cert.urlPdf;

          const entrenadorEncontrado = this.entrenadores.find((u) => u.idUsuario === cert.idEntrenador);
          this.selectedEntrenador = entrenadorEncontrado || {
            idUsuario: cert.idEntrenador,
            nombre: cert.nombreEntrenador || 'Entrenador',
            apellido: '',
            email: 'Sin email',
            rol: 'ENTRENADOR'
          };
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró la certificación especificada.',
            confirmButtonColor: '#0f1c3f',
          });
          this.volver();
        }
        this.loading = false;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos de la certificación.',
          confirmButtonColor: '#0f1c3f',
        });
        this.loading = false;
        this.volver();
      }
    });
  }

  // --- MODAL Y SELECCIÓN DE ENTRENADOR ---

  abrirModalSeleccionEntrenador(): void {
    if (this.isEditMode) return;
    this.searchEntrenador = '';
    this.entrenadoresFiltradosModal = [...this.entrenadores];
    this.paginaModalActual = 1;
    this.showEntrenadorModal = true;
  }

  cerrarModalSeleccionEntrenador(): void {
    this.showEntrenadorModal = false;
  }

  filtrarEntrenadoresModal(): void {
    const term = this.searchEntrenador.toLowerCase().trim();
    if (!term) {
      this.entrenadoresFiltradosModal = [...this.entrenadores];
    } else {
      this.entrenadoresFiltradosModal = this.entrenadores.filter(
        (u) =>
          u.nombre?.toLowerCase().includes(term) ||
          u.apellido?.toLowerCase().includes(term) ||
          (u.telefono && u.telefono.includes(term)) ||
          u.email?.toLowerCase().includes(term)
      );
    }
    this.paginaModalActual = 1;
  }

  get entrenadoresPaginados(): any[] {
    const inicio = (this.paginaModalActual - 1) * this.itemsPorPaginaModal;
    return this.entrenadoresFiltradosModal.slice(inicio, inicio + this.itemsPorPaginaModal);
  }

  get totalPaginasModal(): number {
    return Math.ceil(this.entrenadoresFiltradosModal.length / this.itemsPorPaginaModal) || 1;
  }

  get paginasVisiblesModal(): number[] {
    const total = this.totalPaginasModal;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  seleccionarEntrenadorDesdeModal(entrenador: any): void {
    this.selectedEntrenador = entrenador;
    this.certificateForm.patchValue({ idEntrenador: entrenador.idUsuario });
    this.cerrarModalSeleccionEntrenador();

    Swal.fire({
      icon: 'success',
      title: 'Entrenador asignado',
      text: `${entrenador.nombre} ${entrenador.apellido} ha sido asignado.`,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  limpiarSeleccion(): void {
    if (this.isEditMode) return;
    this.selectedEntrenador = null;
    this.certificateForm.patchValue({ idEntrenador: '' });
  }

  // --- SUBIDA DE ARCHIVO Y FORMULARIO ---

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

  removerArchivo(): void {
    this.selectedFile = null;
    this.existingUrl = '';
    this.certificateForm.patchValue({ urlPdf: '' });
  }

  private async subirArchivo(): Promise<string> {
    if (!this.selectedFile) return this.existingUrl;

    this.uploadingFile = true;
    try {
      Swal.fire({
        title: 'Subiendo certificación...',
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
        text: error.message || 'No se pudo subir el archivo PDF a Cloudinary.',
        confirmButtonColor: '#0f1c3f',
      });
      throw error;
    } finally {
      this.uploadingFile = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor asigna un entrenador y completa los campos obligatorios.',
        confirmButtonColor: '#0f1c3f',
      });
      return;
    }

    if (!this.selectedFile && !this.existingUrl) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin archivo',
        text: 'Debes adjuntar el PDF de la certificación.',
        confirmButtonColor: '#0f1c3f',
      });
      return;
    }

    this.submitting = true;
    const formValues = this.certificateForm.value;

    try {
      let urlArchivo = this.existingUrl;
      if (this.selectedFile) {
        urlArchivo = await this.subirArchivo();
      }

      if (this.isEditMode && this.certificateId) {
        const updatePayload = {
          nombre: formValues.nombre,
          urlPdf: urlArchivo,
        };

        this.certificateService.actualizarCertificacion(this.certificateId, updatePayload).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Certificación Actualizada',
              text: 'Se actualizaron los datos correctamente.',
              confirmButtonColor: '#0f1c3f',
            });
            this.volver();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo actualizar la certificación.',
              confirmButtonColor: '#0f1c3f',
            });
            this.submitting = false;
          },
        });
      } else {
        const createPayload = {
          idEntrenador: Number(formValues.idEntrenador),
          nombre: formValues.nombre,
          urlPdf: urlArchivo,
        };

        this.certificateService.registrarCertificacion(createPayload).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Certificación Registrada',
              text: 'La certificación ha sido agregada correctamente.',
              confirmButtonColor: '#0f1c3f',
            });
            this.volver();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo registrar la certificación.',
              confirmButtonColor: '#0f1c3f',
            });
            this.submitting = false;
          },
        });
      }
    } catch {
      this.submitting = false;
    }
  }

  volver(): void {
    this.router.navigate(['/dashboard-admin/users/certificates']);
  }
}