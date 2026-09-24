import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { UserService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment.prod';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  editando: boolean = false;
  guardando: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;
  mensajeExito: string | null = null;

  userName: string = 'Administrador';
  userRole: string = 'Administrador';
  avatarUrl: string = '';
  userId: number = 0;
  userEmail: string = '';
  userUsername: string = '';
  sedeNombre: string = 'Cargando...';

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadingImage: boolean = false;

  mostrarModalError: boolean = false;
  modalErrorMessage: string = '';
  errorAccion: (() => void) | null = null;

  profileForm!: FormGroup;

  userProfile: any = {
    nombre: '',
    apellido: '',
    nombreCompleto: '',
    email: '',
    telefono: '',
    documentoIdentidad: '',
    fechaNacimiento: '',
    edad: 0,
    sexo: '',
    fotoUrl: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
    idSede: 0,
    nombreSede: '',
    username: ''
  };

  contactos: any[] = [];
  profileBackup: any = {};

  opcionesSexo = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMENINO', label: 'Femenino' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  buildForm(): void {
    this.profileForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      apellido: ['', [Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]*$/)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      documentoIdentidad: ['', [Validators.required, Validators.pattern(/^\d{6,10}$/)]],
      fechaNacimiento: ['', [Validators.required]],
      sexo: ['', [Validators.required]],
      contactoEmergenciaNombre: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      contactoEmergenciaTelefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  irAjustes(): void {
    this.router.navigate(['/dashboard-admin/ajustes']);
  }

  loadUserInfo(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        if (user) {
          this.userName = user.name || 'Administrador';
          this.userRole = user.role || 'Administrador';
          this.userId = typeof user.id === 'string' ? parseInt(user.id, 10) : (user.id || 0);
          this.userEmail = user.email || '';
          this.userUsername = (user as any).username || user.name || this.userName;
          this.userProfile.nombreCompleto = this.userUsername;
          this.userProfile.username = this.userUsername;
          this.userProfile.email = this.userEmail;
          this.userName = this.userUsername;
        }
        this.loadProfileData();
      },
      error: () => {
        this.loadProfileData();
      }
    });
  }

  loadProfileData(): void {
    this.isLoading = true;
    this.error = null;
    this.mensajeExito = null;

    this.userService.getUserProfile().subscribe({
      next: (data: any) => {
        if (data) {
          this.procesarPerfil(data);
        } else {
          this.usarDatosDelToken();
        }
        this.isLoading = false;
      },
      error: () => {
        this.usarDatosDelToken();
        this.isLoading = false;
      }
    });

    this.sedeNombre = 'Sede Principal / Global';
  }

  usarDatosDelToken(): void {
    const nombre = this.userUsername || this.userName || 'Administrador';

    this.userProfile = {
      ...this.userProfile,
      nombre: nombre,
      apellido: '',
      nombreCompleto: nombre,
      email: this.userEmail || '',
      telefono: '',
      documentoIdentidad: '',
      fechaNacimiento: '',
      edad: 0,
      sexo: 'MASCULINO',
      fotoUrl: '',
      contactoEmergenciaNombre: '',
      contactoEmergenciaTelefono: '',
      idSede: 0,
      nombreSede: '',
      username: nombre
    };

    this.profileForm.patchValue(this.userProfile);
    this.avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nombre) + '&background=0F1C3F&color=fff&bold=true';
    this.sedeNombre = 'Sede Principal';
    this.profileBackup = { ...this.userProfile };
  }

  procesarPerfil(data: any): void {
    const nombre = (data.nombre || '').trim();
    const apellido = (data.apellido || '').trim();

    let nombreCompleto = '';
    if (nombre && apellido) {
      nombreCompleto = `${nombre} ${apellido}`;
    } else if (nombre) {
      nombreCompleto = nombre;
    } else if (apellido) {
      nombreCompleto = apellido;
    } else {
      nombreCompleto = data.nombreCompleto || this.userUsername || this.userName || 'Administrador';
    }

    const sexo = (data.sexo === 'FEMENINO' || data.sexo === 'MASCULINO') ? data.sexo : 'MASCULINO';

    this.userProfile = {
      ...this.userProfile,
      nombre: nombre,
      apellido: apellido,
      nombreCompleto: nombreCompleto.trim(),
      email: data.email || this.userEmail || '',
      telefono: data.telefono || '',
      documentoIdentidad: data.documentoIdentidad || '',
      fechaNacimiento: data.fechaNacimiento || '',
      edad: this.calcularEdad(data.fechaNacimiento),
      sexo: sexo,
      fotoUrl: data.fotoUrl || data.urlFoto || '',
      contactoEmergenciaNombre: data.contactoEmergenciaNombre || '',
      contactoEmergenciaTelefono: data.contactoEmergenciaTelefono || '',
      idSede: data.idSede || 0,
      nombreSede: data.nombreSede || '',
      username: data.username || this.userUsername || this.userName
    };

    this.profileForm.patchValue(this.userProfile);
    this.sedeNombre = data.nombreSede || 'Sede Principal';

    if (nombreCompleto.trim()) {
      this.userName = nombreCompleto.trim();
    }

    if (this.userProfile.fotoUrl) {
      this.avatarUrl = this.userProfile.fotoUrl;
    } else {
      this.avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.userName) + '&background=0F1C3F&color=fff&bold=true';
    }

    if (data.contactoEmergenciaNombre) {
      this.contactos = [{
        nombre: data.contactoEmergenciaNombre,
        telefono: data.contactoEmergenciaTelefono,
        parentesco: 'Emergencia'
      }];
    }

    this.profileBackup = { ...this.userProfile };
  }

  activarEdicion(): void {
    this.profileBackup = { ...this.userProfile };
    this.profileForm.patchValue(this.userProfile);
    this.editando = true;
    this.mensajeExito = null;
    this.error = null;
    this.imagePreview = null;
    this.selectedFile = null;
  }

  cancelarEdicion(): void {
    this.userProfile = { ...this.profileBackup };
    this.profileForm.patchValue(this.userProfile);
    this.editando = false;
    this.mensajeExito = null;
    this.error = null;
    this.imagePreview = null;
    this.selectedFile = null;
  }

  openFileSelector(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.error = 'Por favor selecciona una imagen valida (JPG, PNG, etc.)';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.error = 'La imagen no puede superar los 5MB';
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      this.error = null;
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      this.mostrarErrorModal('Por favor selecciona una imagen');
      return;
    }

    this.uploadingImage = true;
    this.error = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('upload_preset', environment.cloudinary.uploadPreset);
    formData.append('cloud_name', environment.cloudinary.cloudName);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;

    this.uploadToCloudinary(cloudinaryUrl, formData).subscribe({
      next: (response: any) => {
        const imageUrl = response.secure_url || response.url;

        if (imageUrl) {
          const formValues = this.profileForm.value;
          const dataToSend = {
            nombre: formValues.nombre || '',
            apellido: formValues.apellido || '',
            email: this.userProfile.email || '',
            telefono: formValues.telefono || '',
            documentoIdentidad: formValues.documentoIdentidad || '',
            fechaNacimiento: formValues.fechaNacimiento || '',
            sexo: formValues.sexo || '',
            contactoEmergenciaNombre: formValues.contactoEmergenciaNombre || '',
            contactoEmergenciaTelefono: formValues.contactoEmergenciaTelefono || '',
            fotoUrl: imageUrl
          };

          this.userService.updateUserProfile(dataToSend).subscribe({
            next: (updateResponse: any) => {
              if (updateResponse && updateResponse.fotoUrl) {
                this.userProfile.fotoUrl = updateResponse.fotoUrl;
                this.avatarUrl = updateResponse.fotoUrl;
              } else if (updateResponse) {
                this.userProfile.fotoUrl = imageUrl;
                this.avatarUrl = imageUrl;
              }

              this.guardando = false;
              this.editando = false;
              this.selectedFile = null;
              this.imagePreview = null;
              this.uploadingImage = false;
              this.mensajeExito = 'Foto de perfil actualizada correctamente';

              setTimeout(() => {
                this.mensajeExito = null;
                this.loadProfileData();
              }, 1500);
            },
            error: (err: any) => {
              this.uploadingImage = false;
              let mensajeError = 'Error al guardar la foto en el perfil';
              if (err.error) {
                if (typeof err.error === 'string') mensajeError = err.error;
                else if (err.error.message) mensajeError = err.error.message;
              }
              this.mostrarErrorModal(mensajeError, () => this.uploadImage());
            }
          });
        } else {
          this.uploadingImage = false;
          this.mostrarErrorModal('No se pudo obtener la URL de la imagen', () => this.uploadImage());
        }
      },
      error: (err: any) => {
        this.uploadingImage = false;
        let mensaje = 'Error al subir la imagen a Cloudinary.';
        if (err.status === 400) {
          mensaje = 'La imagen no es valida. Verifica el formato o el upload preset.';
        }
        this.mostrarErrorModal(mensaje, () => this.uploadImage());
      }
    });
  }

  uploadToCloudinary(url: string, formData: FormData): Observable<any> {
    return new Observable((observer: any) => {
      fetch(url, {
        method: 'POST',
        body: formData
      })
        .then((response: any) => response.json())
        .then((data: any) => {
          observer.next(data);
          observer.complete();
        })
        .catch((error: any) => {
          observer.error(error);
        });
    });
  }

  mostrarErrorModal(mensaje: string, accionReintentar?: () => void): void {
    this.modalErrorMessage = mensaje;
    this.errorAccion = accionReintentar || null;
    this.mostrarModalError = true;
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
    this.errorAccion = null;
  }

  reintentarSubida(): void {
    this.cerrarModalError();
    if (this.errorAccion) {
      this.errorAccion();
    } else {
      this.uploadImage();
    }
  }

  guardarCambios(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.error = 'Por favor completa correctamente todos los campos obligatorios.';
      return;
    }

    if (this.selectedFile) {
      this.uploadImage();
      return;
    }

    this.guardando = true;
    this.error = null;
    this.mensajeExito = null;

    const formValues = this.profileForm.value;
    const dataToSend = {
      nombre: formValues.nombre || '',
      apellido: formValues.apellido || '',
      email: this.userProfile.email || '',
      telefono: formValues.telefono || '',
      documentoIdentidad: formValues.documentoIdentidad || '',
      fechaNacimiento: formValues.fechaNacimiento || '',
      sexo: formValues.sexo || '',
      contactoEmergenciaNombre: formValues.contactoEmergenciaNombre || '',
      contactoEmergenciaTelefono: formValues.contactoEmergenciaTelefono || '',
      fotoUrl: this.userProfile.fotoUrl || ''
    };

    this.userService.updateUserProfile(dataToSend).subscribe({
      next: (response: any) => {
        if (response) {
          this.guardando = false;
          this.editando = false;
          this.userProfile = { ...this.userProfile, ...formValues };
          this.profileBackup = { ...this.userProfile };
          this.userProfile.nombreCompleto = (formValues.nombre || '') + ' ' + (formValues.apellido || '');
          if (this.userProfile.nombreCompleto.trim()) {
            this.userName = this.userProfile.nombreCompleto.trim();
          }
          this.mensajeExito = 'Datos actualizados correctamente';
          setTimeout(() => {
            this.mensajeExito = null;
            this.loadProfileData();
          }, 1500);
        } else {
          this.guardando = false;
          this.error = 'Error al guardar los cambios. Verifica los datos e intentalo de nuevo.';
        }
      },
      error: (err: any) => {
        let mensajeError = 'Error al guardar los cambios. Intenta de nuevo.';
        if (err.error) {
          if (typeof err.error === 'string') {
            mensajeError = err.error;
          } else if (err.error.message) {
            mensajeError = err.error.message;
          }
        }
        this.error = mensajeError;
        this.guardando = false;
      }
    });
  }

  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  refreshData(): void {
    this.loadProfileData();
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard-admin']);
  }

  public isSidebarOpen: boolean = false;

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}