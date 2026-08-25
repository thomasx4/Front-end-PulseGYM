// src/app/features/users/components/documents/documents-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DocumentService } from '../../../../../core/services/document.service';
import { UserService } from '../../../../../core/services/user.service';
import { getTipoDocumentoLabel } from '../../../../../core/models/document';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-documents-form',
  templateUrl: './documents-form.component.html',
  styleUrls: ['./documents-form.component.scss']
})
export class DocumentsFormComponent implements OnInit {
  documentForm!: FormGroup;
  isEditMode: boolean = false;
  documentId: number | null = null;
  loading: boolean = false;
  submitting: boolean = false;
  tiposDocumento: string[] = [];
  usuarios: any[] = [];
  searchUsuario: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarTiposDocumento();
    this.verificarModoEdicion();
  }

  private initForm(): void {
    this.documentForm = this.fb.group({
      idUsuario: ['', Validators.required],
      nombreUsuario: [''],
      tipoDocumento: ['', Validators.required],
      urlArchivoFirmado: ['']
    });
  }

  private cargarTiposDocumento(): void {
    this.documentService.obtenerTiposDocumento().subscribe({
      next: (data) => {
        this.tiposDocumento = data;
      },
      error: () => {
        this.tiposDocumento = ['CONSENTIEMIENTO_INFORMADO', 'CONTRATO', 'EXONERACION'];
      }
    });
  }

  private verificarModoEdicion(): void {
    this.route.params.subscribe(params => {
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
      next: (data) => {
        this.documentForm.patchValue({
          idUsuario: data.idUsuario,
          nombreUsuario: data.nombreUsuario,
          tipoDocumento: data.tipoDocumento,
          urlArchivoFirmado: data.urlArchivoFirmado
        });
        this.loading = false;
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el documento.',
          confirmButtonColor: '#0f1c3f'
        });
        this.loading = false;
        this.volver();
      }
    });
  }

  buscarUsuario(): void {
    if (!this.searchUsuario || this.searchUsuario.length < 3) {
      Swal.fire({
        icon: 'warning',
        title: 'Búsqueda',
        text: 'Ingresa al menos 3 caracteres para buscar.',
        confirmButtonColor: '#0f1c3f'
      });
      return;
    }

    this.userService.obtenerTodosLosPerfiles().subscribe({
      next: (data: any[]) => {
        const results = data.filter(u =>
          u.nombre.toLowerCase().includes(this.searchUsuario.toLowerCase()) ||
          u.email.toLowerCase().includes(this.searchUsuario.toLowerCase())
        );
        if (results.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Sin resultados',
            text: 'No se encontraron usuarios con ese criterio.',
            confirmButtonColor: '#0f1c3f'
          });
          return;
        }
        // Mostrar resultados para seleccionar
        this.mostrarSeleccionUsuario(results);
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los usuarios.',
          confirmButtonColor: '#0f1c3f'
        });
      }
    });
  }

  private mostrarSeleccionUsuario(usuarios: any[]): void {
    const html = usuarios.map(u =>
      `<div style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer;" onclick="window.selectUser(${u.idUsuario}, '${u.nombre} ${u.apellido}')">
        <strong>${u.nombre} ${u.apellido}</strong><br>
        <span style="font-size: 0.8rem; color: #64748b;">${u.email} - ${u.documentoIdentidad}</span>
      </div>`
    ).join('');

    (window as any).selectUser = (id: number, nombre: string) => {
      this.documentForm.patchValue({
        idUsuario: id,
        nombreUsuario: nombre
      });
      this.searchUsuario = nombre;
      Swal.close();
    };

    Swal.fire({
      title: 'Seleccionar usuario',
      html: `<div style="max-height: 300px; overflow-y: auto;">${html}</div>`,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#0f1c3f',
      width: 500
    });
  }

  onSubmit(): void {
    if (this.documentForm.invalid) {
      Object.keys(this.documentForm.controls).forEach(key => {
        const control = this.documentForm.get(key);
        if (control?.invalid) control.markAsTouched();
      });
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos obligatorios.',
        confirmButtonColor: '#0f1c3f'
      });
      return;
    }

    this.submitting = true;
    const formValues = this.documentForm.value;

    const payload = {
      idUsuario: formValues.idUsuario,
      tipoDocumento: formValues.tipoDocumento,
      urlArchivoFirmado: formValues.urlArchivoFirmado || null
    };

    this.documentService.crearDocumento(payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Documento creado',
          text: 'El documento legal ha sido cargado correctamente.',
          confirmButtonColor: '#0f1c3f'
        });
        this.volver();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo crear el documento.',
          confirmButtonColor: '#0f1c3f'
        });
        this.submitting = false;
      }
    });
  }

  getTipoDocumentoLabel(tipo: string): string {
    return getTipoDocumentoLabel(tipo);
  }

  volver(): void {
    this.router.navigate(['/dashboard-admin/users/documents']);
  }
}