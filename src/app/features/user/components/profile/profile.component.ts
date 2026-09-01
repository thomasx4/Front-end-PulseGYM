import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

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

  userName: string = 'Usuario';
  userRole: string = 'Socio';
  avatarUrl: string = '';
  userId: number = 0;
  userEmail: string = '';
  userUsername: string = '';
  tipoMembresia: string = '';
  sedeNombre: string = 'Cargando...';

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadingImage: boolean = false;

  mostrarModalError: boolean = false;
  modalErrorMessage: string = '';
  errorAccion: (() => void) | null = null;

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
    tipoMembresia: '',
    objetivo: '',
    fotoUrl: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
    idSede: 0,
    nivelExperiencia: '',
    username: ''
  };

  perfilMedico: any = {
    pesoKg: 0,
    estaturaCm: 0,
    alergias: '',
    condicionesCronicas: ''
  };

  historialFisico: any = {
    pesoKg: 0,
    porcentajeGrasa: 0,
    porcentajeMusculo: 0,
    cinturaCm: 0,
    pechoCm: 0,
    brazoIzqCm: 0,
    brazoDerCm: 0,
    piernaIzqCm: 0,
    piernaDerCm: 0
  };

  medidas: any = {
    peso: 0,
    pesoCambio: '',
    masaMuscular: 0,
    masaMuscularCambio: '',
    grasaCorporal: 0,
    grasaCorporalCambio: '',
    imc: 0,
    imcEstado: 'Normal',
    fechaActualizacion: ''
  };

  contactos: any[] = [];
  profileBackup: any = {};

  nivelesExperiencia = [
    { value: 'novato', label: 'Novato' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];

  opcionesSexo = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMENINO', label: 'Femenino' },
    { value: 'OTRO', label: 'Otro' },
    { value: 'PREFIERO NO DECIR', label: 'Prefiero no decir' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        if (user) {
          this.userName = user.name || 'Usuario';
          this.userRole = user.role || 'Socio';
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

    this.userService.getPerfilMedico().subscribe({
      next: (data: any) => {
        if (data) {
          this.perfilMedico = {
            pesoKg: data.pesoKg || 0,
            estaturaCm: data.estaturaCm || 0,
            alergias: data.alergias || '',
            condicionesCronicas: data.condicionesCronicas || ''
          };
          this.actualizarMedidas();
        }
      },
      error: (err: any) => {
        console.warn('perfil-medico fallo:', err.status);
      }
    });

    this.userService.getHistorialFisico().subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          const historialData = data[0] || data;
          this.historialFisico = {
            pesoKg: historialData.pesoKg || 0,
            porcentajeGrasa: historialData.porcentajeGrasa || 0,
            porcentajeMusculo: historialData.porcentajeMusculo || 0,
            cinturaCm: historialData.cinturaCm || 0,
            pechoCm: historialData.pechoCm || 0,
            brazoIzqCm: historialData.brazoIzqCm || 0,
            brazoDerCm: historialData.brazoDerCm || 0,
            piernaIzqCm: historialData.piernaIzqCm || 0,
            piernaDerCm: historialData.piernaDerCm || 0
          };
          this.actualizarMedidas();
        }
      },
      error: (err: any) => {
        console.warn('historial-fisico fallo:', err.status);
      }
    });

    this.userService.getMiMembresia().subscribe({
      next: (data: any) => {
        if (data) {
          this.tipoMembresia = data.nombreMembresia || data.tipo || data.nombre || '';
          this.userProfile.tipoMembresia = this.tipoMembresia;
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.warn('membresia fallo:', err.status);
        this.isLoading = false;
      }
    });

    this.sedeNombre = 'Sede Principal';
  }

  usarDatosDelToken(): void {
    const nombre = this.userUsername || this.userName || 'Usuario';

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
      sexo: '',
      tipoMembresia: this.tipoMembresia || 'Miembro',
      objetivo: 'Mejorar condicion fisica',
      fotoUrl: '',
      contactoEmergenciaNombre: '',
      contactoEmergenciaTelefono: '',
      idSede: 0,
      nivelExperiencia: 'intermedio',
      username: nombre
    };

    this.avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nombre) + '&background=0F1C3F&color=fff&bold=true';
    this.profileBackup = { ...this.userProfile };
  }

  procesarPerfil(data: any): void {
    const nombreCompleto = data.nombreCompleto || data.nombre + ' ' + data.apellido || data.nombre || this.userUsername || this.userName;

    let nivelExperiencia = data.nivelExperiencia || 'intermedio';
    const nivelesValidos = ['novato', 'intermedio', 'avanzado'];
    if (!nivelesValidos.includes(nivelExperiencia)) {
      nivelExperiencia = 'intermedio';
    }

    const sexo = data.sexo || '';

    this.userProfile = {
      ...this.userProfile,
      nombre: data.nombre || '',
      apellido: data.apellido || '',
      nombreCompleto: nombreCompleto.trim(),
      email: data.email || this.userEmail || '',
      telefono: data.telefono || '',
      documentoIdentidad: data.documentoIdentidad || '',
      fechaNacimiento: data.fechaNacimiento || '',
      edad: this.calcularEdad(data.fechaNacimiento),
      sexo: sexo,
      objetivo: data.objetivoPrincipal || 'Mejorar condicion fisica',
      fotoUrl: data.fotoUrl || data.urlFoto || '',
      contactoEmergenciaNombre: data.contactoEmergenciaNombre || '',
      contactoEmergenciaTelefono: data.contactoEmergenciaTelefono || '',
      idSede: data.idSede || 0,
      nivelExperiencia: nivelExperiencia,
      tipoMembresia: this.tipoMembresia || this.userProfile.tipoMembresia,
      username: data.username || this.userUsername || this.userName
    };

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

    if (this.userProfile.nombreCompleto) {
      this.userName = this.userProfile.nombreCompleto;
    }

    this.profileBackup = { ...this.userProfile };
  }

  actualizarMedidas(): void {
    const peso = this.historialFisico.pesoKg || this.perfilMedico.pesoKg || 0;
    const grasa = this.historialFisico.porcentajeGrasa || 0;
    const musculo = this.historialFisico.porcentajeMusculo || 0;
    const estatura = this.perfilMedico.estaturaCm || 0;

    let imc = 0;
    if (estatura > 0 && peso > 0) {
      const estaturaM = estatura / 100;
      imc = peso / (estaturaM * estaturaM);
    }

    this.medidas = {
      peso: peso,
      pesoCambio: '',
      masaMuscular: musculo,
      masaMuscularCambio: '',
      grasaCorporal: grasa,
      grasaCorporalCambio: '',
      imc: Math.round(imc * 10) / 10,
      imcEstado: this.getImcEstado(imc),
      fechaActualizacion: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  }

  activarEdicion(): void {
    this.profileBackup = { ...this.userProfile };
    this.editando = true;
    this.mensajeExito = null;
    this.error = null;
    this.imagePreview = null;
    this.selectedFile = null;
  }

  cancelarEdicion(): void {
    this.userProfile = { ...this.profileBackup };
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

    console.log('Subiendo imagen a Cloudinary...');
    console.log('Cloud Name:', environment.cloudinary.cloudName);
    console.log('Upload Preset:', environment.cloudinary.uploadPreset);

    this.uploadToCloudinary(cloudinaryUrl, formData).subscribe({
      next: (response: any) => {
        console.log('Cloudinary response:', response);

        const imageUrl = response.secure_url || response.url;

        if (imageUrl) {
          const dataToSend = {
            nombre: this.userProfile.nombre || '',
            apellido: this.userProfile.apellido || '',
            email: this.userProfile.email || '',
            telefono: this.userProfile.telefono || '',
            documentoIdentidad: this.userProfile.documentoIdentidad || '',
            fechaNacimiento: this.userProfile.fechaNacimiento || '',
            sexo: this.userProfile.sexo || '',
            objetivoPrincipal: this.userProfile.objetivo || '',
            contactoEmergenciaNombre: this.userProfile.contactoEmergenciaNombre || '',
            contactoEmergenciaTelefono: this.userProfile.contactoEmergenciaTelefono || '',
            nivelExperiencia: this.userProfile.nivelExperiencia || 'intermedio',
            fotoUrl: imageUrl
          };

          this.userService.updateUserProfile(dataToSend).subscribe({
            next: (updateResponse: any) => {
              console.log('Perfil actualizado con foto:', updateResponse);

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
            error: (updateErr: any) => {
              console.error('Error al actualizar perfil:', updateErr);
              this.uploadingImage = false;
              this.mostrarErrorModal('Error al guardar la foto en el perfil', () => this.uploadImage());
            }
          });
        } else {
          this.uploadingImage = false;
          this.mostrarErrorModal('No se pudo obtener la URL de la imagen', () => this.uploadImage());
        }
      },
      error: (err: any) => {
        console.error('Error al subir a Cloudinary:', err);
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
    if (this.selectedFile) {
      this.uploadImage();
      return;
    }

    if (!this.userProfile.nombre || this.userProfile.nombre.trim() === '') {
      this.error = 'El nombre es obligatorio.';
      return;
    }

    this.guardando = true;
    this.error = null;
    this.mensajeExito = null;

    const nivelValido = this.userProfile.nivelExperiencia || 'intermedio';
    const nivelesPermitidos = ['novato', 'intermedio', 'avanzado'];
    const nivelFinal = nivelesPermitidos.includes(nivelValido) ? nivelValido : 'intermedio';

    const dataToSend = {
      nombre: this.userProfile.nombre || '',
      apellido: this.userProfile.apellido || '',
      email: this.userProfile.email || '',
      telefono: this.userProfile.telefono || '',
      documentoIdentidad: this.userProfile.documentoIdentidad || '',
      fechaNacimiento: this.userProfile.fechaNacimiento || '',
      sexo: this.userProfile.sexo || '',
      objetivoPrincipal: this.userProfile.objetivo || '',
      contactoEmergenciaNombre: this.userProfile.contactoEmergenciaNombre || '',
      contactoEmergenciaTelefono: this.userProfile.contactoEmergenciaTelefono || '',
      nivelExperiencia: nivelFinal,
      fotoUrl: this.userProfile.fotoUrl || ''
    };

    console.log('Enviando datos al backend:', JSON.stringify(dataToSend, null, 2));

    this.userService.updateUserProfile(dataToSend).subscribe({
      next: (response: any) => {
        console.log('Respuesta del backend:', response);

        if (response) {
          this.guardando = false;
          this.editando = false;
          this.profileBackup = { ...this.userProfile };
          this.userProfile.nombreCompleto = (this.userProfile.nombre || '') + ' ' + (this.userProfile.apellido || '');
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
        console.error('Error al actualizar perfil:', err);
        let mensajeError = 'Error al guardar los cambios. Intenta de nuevo.';
        if (err.error && err.error.message) {
          mensajeError = err.error.message;
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

  getImcEstado(imc: number): string {
    if (!imc || imc === 0) return 'Normal';
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
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

  onSearch(query: string): void {
    console.log('Busqueda:', query);
  }
}