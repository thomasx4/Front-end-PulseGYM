import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { SedeService } from '../../../../core/services/sede.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { AuthService } from '../../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  isEditMode: boolean = false;
  isSocio: boolean = false;
  userId: number | null = null;

  loading: boolean = false;
  submitting: boolean = false;
  verificandoEmail: boolean = false;
  emailVerificado: boolean = false;

  authUserInfo: any = null;
  sedes: any[] = [];
  fotoPreview: string | null = null;
  fotoFile: File | null = null;

  private valoresOriginales: any = {};

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private sedeService: SedeService,
    private cloudinaryService: CloudinaryService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.cargarSedes();
    this.verificarRolUsuario();
    this.verificarModoEdicion();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      sexo: ['', Validators.required],
      documentoIdentidad: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      idSede: ['', Validators.required],
      contactoEmergenciaNombre: ['', Validators.required],
      contactoEmergenciaTelefono: ['', Validators.required],
      fotoUrl: [''],
      objetivoPrincipal: [''],
      nivelExperiencia: [''],
      fechaContratacion: [''],
      especialidad: [''],
      anosExperiencia: [''],
      horarioDisponibilidad: [''],
      tarifaHora: [''],
      turno: ['']
    });
  }

  private cargarSedes(): void {
    this.sedeService.obtenerSedes().subscribe({
      next: (response: any) => {
        let sedesData = [];

        if (response && response.data) {
          sedesData = response.data;
        } else if (Array.isArray(response)) {
          sedesData = response;
        } else {
          sedesData = [];
        }

        this.sedes = sedesData.map((sede: any) => ({
          id: sede.idSede || sede.id,           
          nombre: sede.nombreSede || sede.nombre
        }));
      },
      error: () => {
        this.sedes = [];
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar sedes',
          text: 'No se pudieron cargar las sedes.',
          confirmButtonColor: '#0f1c3f'
        });
      }
    });
  }

  private verificarRolUsuario(): void {
    const user = this.authService.getUser();
    if (user) {
      const rol = user.role?.toUpperCase();
      this.isSocio = rol === 'USER' || rol === 'SOCIO';

      if (this.isSocio) {
        this.userForm.get('email')?.clearValidators();
        this.userForm.get('email')?.updateValueAndValidity();
        this.userForm.get('email')?.setValue(user.email);
        this.emailVerificado = true;

        this.authUserInfo = {
          nombre: user.name,
          apellido: '',
          email: user.email,
          rol: user.role
        };
      }
    }
  }

  private verificarModoEdicion(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.userId = parseInt(id);
        this.cargarDatosUsuario(this.userId);
      }
    });
  }

  private cargarDatosUsuario(id: number): void {
    this.loading = true;
    this.userService.obtenerPerfilPorId(id).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        if (data) {
          this.valoresOriginales = {
            email: data.email,
            nombre: data.nombre,
            apellido: data.apellido,
            sexo: data.sexo || '',
            documentoIdentidad: data.documentoIdentidad,
            telefono: data.telefono,
            fechaNacimiento: data.fechaNacimiento?.split('T')[0] || '',
            idSede: data.idSede,
            contactoEmergenciaNombre: data.contactoEmergenciaNombre,
            contactoEmergenciaTelefono: data.contactoEmergenciaTelefono,
            fotoUrl: data.fotoUrl || '',
            objetivoPrincipal: data.objetivoPrincipal || '',
            nivelExperiencia: data.nivelExperiencia || '',
            fechaContratacion: data.fechaContratacion?.split('T')[0] || '',
            especialidad: data.especialidad || '',
            anosExperiencia: data.anosExperiencia || '',
            horarioDisponibilidad: data.horarioDisponibilidad || '',
            tarifaHora: data.tarifaHora || '',
            turno: data.turno || ''
          };

          this.userForm.patchValue(this.valoresOriginales);

          if (data.fotoUrl) {
            this.fotoPreview = data.fotoUrl;
            this.userForm.get('fotoUrl')?.setValue(data.fotoUrl);
          }

          const rolUsuarioEditado = data.rol || data.rolUsuario || '';

          this.authUserInfo = {
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            rol: rolUsuarioEditado
          };
          this.emailVerificado = true;

          this.userForm.get('email')?.clearValidators();
          this.userForm.get('email')?.updateValueAndValidity();

          if (data.rol?.toUpperCase() === 'SOCIO' || data.rol?.toUpperCase() === 'USER') {
            this.isSocio = true;
            this.userForm.get('email')?.clearValidators();
          }

          this.aplicarValidacionesPorRol(data.rol, true);
        }
        this.loading = false;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del usuario',
          confirmButtonColor: '#0f1c3f'
        });
        this.loading = false;
        this.volver();
      }
    });
  }

  verificarEmail(): void {
    if (this.isEditMode) return;

    const email = this.userForm.get('email')?.value;
    if (!email) return;

    this.verificandoEmail = true;
    this.emailVerificado = false;
    this.authUserInfo = null;

    this.userService.verificarUsuarioAuth(email).subscribe({
      next: (response: any) => {
        this.verificandoEmail = false;
        let userData = response.data || response;

        const rol = userData.rol || userData.role || userData.rolUsuario || '';
        const rolUpper = rol.toUpperCase();

        this.authUserInfo = {
          nombre: userData.nombre || userData.name || '',
          apellido: userData.apellido || userData.lastName || '',
          email: userData.email || email,
          rol: rolUpper
        };

        this.emailVerificado = true;

        Swal.fire({
          icon: 'success',
          title: 'Usuario Verificado',
          text: `El usuario ${this.authUserInfo.nombre || ''} existe en el sistema`,
          confirmButtonColor: '#0f1c3f',
          timer: 3000
        });

        this.aplicarValidacionesPorRol(this.authUserInfo.rol, false);
      },
      error: () => {
        this.verificandoEmail = false;
        this.emailVerificado = false;
        this.authUserInfo = null;

        Swal.fire({
          icon: 'error',
          title: 'Usuario no encontrado',
          text: 'El email no está registrado en autenticación',
          confirmButtonColor: '#0f1c3f'
        });
      }
    });
  }

  private aplicarValidacionesPorRol(rol: string, esEdicion: boolean = false): void {
    const rolUpper = rol?.toUpperCase();

    this.limpiarValidaciones();

    const isSocio = rolUpper === 'SOCIO' || rolUpper === 'USER';
    const isEntrenador = rolUpper === 'ENTRENADOR';
    const isAdmin = rolUpper === 'ADMINISTRADOR' || rolUpper === 'ADMIN';
    const isRecepcionista = rolUpper === 'RECEPCIONISTA';

    if (!esEdicion) {
      if (isSocio || isEntrenador) {
        this.userForm.get('objetivoPrincipal')?.setValidators([Validators.required]);
        this.userForm.get('nivelExperiencia')?.setValidators([Validators.required]);
      }

      if (isEntrenador) {
        this.userForm.get('fechaContratacion')?.setValidators([Validators.required]);
        this.userForm.get('especialidad')?.setValidators([Validators.required]);
        this.userForm.get('anosExperiencia')?.setValidators([Validators.required]);
        this.userForm.get('horarioDisponibilidad')?.setValidators([Validators.required]);
        this.userForm.get('tarifaHora')?.setValidators([Validators.required]);
        this.userForm.get('turno')?.setValidators([Validators.required]);
      }

      if (isAdmin) {
        this.userForm.get('fechaContratacion')?.setValidators([Validators.required]);
      }

      if (isRecepcionista) {
        this.userForm.get('fechaContratacion')?.setValidators([Validators.required]);
        this.userForm.get('turno')?.setValidators([Validators.required]);
      }
    }

    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.updateValueAndValidity();
    });
  }

  private limpiarValidaciones(): void {
    const campos = [
      'objetivoPrincipal', 'nivelExperiencia', 'fechaContratacion',
      'especialidad', 'anosExperiencia', 'horarioDisponibilidad',
      'tarifaHora', 'turno'
    ];

    campos.forEach(campo => {
      this.userForm.get(campo)?.clearValidators();
      this.userForm.get(campo)?.updateValueAndValidity();
    });
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo muy grande',
          text: 'El tamaño máximo permitido es 5MB',
          confirmButtonColor: '#0f1c3f'
        });
        return;
      }

      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Formato no soportado',
          text: 'Solo se permiten JPG, PNG y WEBP',
          confirmButtonColor: '#0f1c3f'
        });
        return;
      }

      this.fotoFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPreview = reader.result as string;
        this.userForm.get('fotoUrl')?.setValue('temp');
        this.userForm.get('fotoUrl')?.updateValueAndValidity();
      };
      reader.readAsDataURL(file);
    }
  }

  removerFoto(): void {
    this.fotoFile = null;
    this.fotoPreview = null;
    this.userForm.get('fotoUrl')?.setValue(null);
    this.userForm.get('fotoUrl')?.updateValueAndValidity();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  private async subirFoto(): Promise<string> {
    if (!this.fotoFile) {
      throw new Error('No hay foto para subir');
    }

    try {
      Swal.fire({
        title: 'Subiendo foto...',
        text: 'Por favor espera',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await this.cloudinaryService.uploadImage(this.fotoFile).toPromise();
      Swal.close();

      if (response && response.secure_url) {
        return response.secure_url;
      } else {
        throw new Error('No se recibió la URL de la imagen');
      }

    } catch (error: any) {
      Swal.close();
      const mensajeError = error.error?.message || error.message || 'No se pudo subir la foto';
      Swal.fire({
        icon: 'error',
        title: 'Error al subir foto',
        text: mensajeError,
        confirmButtonColor: '#0f1c3f'
      });
      throw new Error(mensajeError);
    }
  }

  private construirPayloadParaCreacion(formValues: any, fotoUrl: string): any {
    const payload: any = {
      email: this.isSocio ? undefined : formValues.email,
      nombre: formValues.nombre,
      apellido: formValues.apellido,
      sexo: formValues.sexo,
      telefono: formValues.telefono,
      documentoIdentidad: formValues.documentoIdentidad,
      fotoUrl: fotoUrl,
      fechaNacimiento: formValues.fechaNacimiento,
      contactoEmergenciaNombre: formValues.contactoEmergenciaNombre,
      contactoEmergenciaTelefono: formValues.contactoEmergenciaTelefono,
      idSede: parseInt(formValues.idSede)
    };

    const rol = this.authUserInfo?.rol?.toUpperCase();

    if (rol === 'SOCIO' || rol === 'USER' || rol === 'ENTRENADOR') {
      payload.objetivoPrincipal = formValues.objetivoPrincipal;
      payload.nivelExperiencia = formValues.nivelExperiencia;
    }

    if (rol === 'ENTRENADOR') {
      payload.fechaContratacion = formValues.fechaContratacion;
      payload.especialidad = formValues.especialidad;
      payload.anosExperiencia = parseInt(formValues.anosExperiencia);
      payload.horarioDisponibilidad = formValues.horarioDisponibilidad;
      payload.tarifaHora = parseFloat(formValues.tarifaHora);
      payload.turno = formValues.turno;
    }

    if (rol === 'ADMINISTRADOR' || rol === 'ADMIN') {
      payload.fechaContratacion = formValues.fechaContratacion;
    }

    if (rol === 'RECEPCIONISTA') {
      payload.fechaContratacion = formValues.fechaContratacion;
      payload.turno = formValues.turno;
    }

    return payload;
  }

  private construirPayloadParaEdicion(formValues: any, fotoUrl: string): any {
    const payload: any = {};

    const camposBasicos = [
      'nombre', 'apellido', 'sexo', 'telefono', 'documentoIdentidad',
      'fechaNacimiento', 'contactoEmergenciaNombre', 'contactoEmergenciaTelefono',
      'idSede', 'objetivoPrincipal', 'nivelExperiencia'
    ];

    camposBasicos.forEach(campo => {
      const valorActual = formValues[campo];
      const valorOriginal = this.valoresOriginales[campo];

      if (valorActual !== undefined && valorActual !== null && valorActual !== '') {
        if (String(valorActual) !== String(valorOriginal)) {
          if (campo === 'idSede') {
            payload[campo] = parseInt(valorActual);
          } else {
            payload[campo] = valorActual;
          }
        }
      }
    });

    if (fotoUrl && fotoUrl !== this.valoresOriginales.fotoUrl) {
      payload.fotoUrl = fotoUrl;
    }

    const camposRol = [
      'fechaContratacion', 'especialidad', 'anosExperiencia',
      'horarioDisponibilidad', 'tarifaHora', 'turno'
    ];

    camposRol.forEach(campo => {
      const valorActual = formValues[campo];
      const valorOriginal = this.valoresOriginales[campo];

      if (valorActual !== undefined && valorActual !== null && valorActual !== '') {
        if (String(valorActual) !== String(valorOriginal)) {
          if (campo === 'anosExperiencia') {
            payload[campo] = parseInt(valorActual);
          } else if (campo === 'tarifaHora') {
            payload[campo] = parseFloat(valorActual);
          } else {
            payload[campo] = valorActual;
          }
        }
      }
    });

    return payload;
  }

  async onSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos obligatorios',
        confirmButtonColor: '#0f1c3f'
      });
      return;
    }

    this.submitting = true;

    try {
      let fotoUrl = '';

      if (this.fotoFile) {
        fotoUrl = await this.subirFoto();
      } else if (this.userForm.get('fotoUrl')?.value && this.userForm.get('fotoUrl')?.value !== 'temp') {
        fotoUrl = this.userForm.get('fotoUrl')?.value;
      }

      const formValues = this.userForm.value;

      if (this.isEditMode && this.userId) {
        const payload = this.construirPayloadParaEdicion(formValues, fotoUrl);

        if (Object.keys(payload).length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Sin cambios',
            text: 'No se detectaron cambios en el perfil.',
            confirmButtonColor: '#0f1c3f'
          });
          this.submitting = false;
          return;
        }

        await this.userService.actualizarPerfil(this.userId, payload).toPromise();

        Swal.fire({
          icon: 'success',
          title: '¡Usuario actualizado!',
          text: `El usuario ${formValues.nombre} ${formValues.apellido} ha sido actualizado`,
          confirmButtonColor: '#0f1c3f'
        }).then(() => this.volver());

      } else {
        const payload = this.construirPayloadParaCreacion(formValues, fotoUrl);
        await this.userService.completarPerfil(payload).toPromise();

        Swal.fire({
          icon: 'success',
          title: '¡Usuario creado exitosamente!',
          text: `El usuario ${formValues.nombre} ${formValues.apellido} ha sido registrado`,
          confirmButtonColor: '#0f1c3f'
        }).then(() => this.volver());
      }

    } catch (error: any) {
      const mensajeError = error.error?.message || error.message || 'Ocurrió un error al guardar el usuario';
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: mensajeError,
        confirmButtonColor: '#0f1c3f'
      });
    } finally {
      this.submitting = false;
    }
  }

  volver(): void {
    this.router.navigate(['/dashboard-admin/users/profiles']);
  }

  suspenderUsuario(): void {
    if (!this.userId) return;

    Swal.fire({
      title: 'Suspender usuario',
      html: `
        <div style="text-align: left;">
          <div style="background: #fef3c7; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: #92400e; font-weight: 600; margin: 0; font-size: 0.9rem;">
              El usuario <strong>${this.authUserInfo?.nombre || 'usuario'}</strong> no podrá acceder al sistema durante el periodo seleccionado.
            </p>
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; font-size: 0.8rem; color: #374151; text-transform: uppercase; margin-bottom: 6px;">
              Duración de la suspensión
            </label>
            <select id="suspensionDuration" style="width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #d1d5db; background-color: #ffffff; font-size: 0.95rem; color: #1f2937; outline: none;">
              <option value="1">1 día</option>
              <option value="3">3 días</option>
              <option value="7" selected>7 días</option>
              <option value="15">15 días</option>
              <option value="30">30 días</option>
            </select>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Suspender',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#9ca3af',
      reverseButtons: true,
      width: 480,
      padding: '24px',
      preConfirm: () => {
        const select = document.getElementById('suspensionDuration') as HTMLSelectElement;
        return select ? select.value : '7';
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const dias = result.value || '7';
        this.userService.cambiarEstadoPerfil(this.userId!, 'INACTIVO').subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Usuario suspendido!',
              text: `El usuario ha sido suspendido por ${dias} días.`,
              confirmButtonColor: '#0f1c3f',
              timer: 3000
            }).then(() => this.volver());
          },
          error: (error: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Error al suspender',
              text: error.error?.message || 'No se pudo suspender el usuario.',
              confirmButtonColor: '#0f1c3f'
            });
          }
        });
      }
    });
  }

  eliminarUsuario(): void {
    if (!this.userId) return;

    const emailUsuario = this.authUserInfo?.email || '';

    Swal.fire({
      title: 'Eliminar cuenta',
      html: `
        <div style="text-align: left;">
          <div style="background: #fee2e2; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: #991b1b; font-weight: 700; margin: 0; font-size: 0.9rem;">
              Esta acción es IRREVERSIBLE
            </p>
          </div>
          <div>
            <label style="display: block; font-weight: 600; font-size: 0.8rem; color: #374151; text-transform: uppercase; margin-bottom: 6px;">
              Confirma escribiendo el correo del usuario
            </label>
            <div style="background: #f1f5f9; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">
              <span style="font-size: 0.8rem; color: #475569; font-family: monospace;">${emailUsuario}</span>
            </div>
            <input id="confirmEmail" type="email" placeholder="Ingresa el correo" style="width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #d1d5db; background-color: #ffffff; font-size: 0.95rem; outline: none; box-sizing: border-box;">
          </div>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Eliminar cuenta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af',
      reverseButtons: true,
      width: 480,
      padding: '24px',
      preConfirm: () => {
        const input = document.getElementById('confirmEmail') as HTMLInputElement;
        const email = input?.value?.trim() || '';
        if (email !== emailUsuario) {
          Swal.showValidationMessage('El correo electrónico no coincide');
          return false;
        }
        return email;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.cambiarEstadoPerfil(this.userId!, 'INACTIVO').subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Cuenta eliminada!',
              text: 'La cuenta ha sido dada de baja permanentemente.',
              confirmButtonColor: '#0f1c3f',
              timer: 3000
            }).then(() => this.volver());
          },
          error: (error: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Error al eliminar',
              text: error.error?.message || 'No se pudo eliminar la cuenta.',
              confirmButtonColor: '#0f1c3f'
            });
          }
        });
      }
    });
  }
}