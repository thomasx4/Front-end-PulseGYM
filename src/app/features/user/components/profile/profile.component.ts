import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { UserService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment.prod';

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

  isSidebarOpen: boolean = false;

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
    tipoMembresia: '',
    objetivo: '',
    fotoUrl: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
    idSede: 0,
    nombreSede: '',
    nivelExperiencia: '',
    username: ''
  };

  perfilMedico: any = { pesoKg: 0, estaturaCm: 0, alergias: '', condicionesCronicas: '', fechaActualizacion: '' };
  historialFisico: any = { pesoKg: 0, porcentajeGrasa: 0, porcentajeMusculo: 0 };
  medidas: any = { peso: 0, masaMuscular: 0, grasaCorporal: 0, imc: 0, imcEstado: 'Normal', fechaActualizacion: '' };

  contactos: any[] = [];
  profileBackup: any = {};

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
      nivelExperiencia: ['intermedio'],
      objetivo: [''],
      contactoEmergenciaNombre: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      contactoEmergenciaTelefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  irAjustes(): void {
    this.router.navigate(['/user/ajustes']);
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
            condicionesCronicas: data.condicionesCronicas || '',
            fechaActualizacion: data.fechaActualizacion || new Date().toISOString()
          };
          this.actualizarMedidas();
        }
      }
    });

    this.userService.getMiMembresia().subscribe({
      next: (data: any) => {
        if (data) {
          this.tipoMembresia = data.nombreMembresia || data.tipo || data.nombre || '';
          this.userProfile.tipoMembresia = this.tipoMembresia;
        }
      }
    });
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
      sexo: 'MASCULINO',
      tipoMembresia: this.tipoMembresia || 'Miembro',
      objetivo: 'Mejorar condición física',
      fotoUrl: '',
      contactoEmergenciaNombre: '',
      contactoEmergenciaTelefono: '',
      idSede: 0,
      nombreSede: '',
      nivelExperiencia: 'intermedio',
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
    let nombreCompleto = nombre && apellido ? `${nombre} ${apellido}` : (nombre || apellido || this.userUsername || 'Usuario');

    let nivelExperiencia = data.nivelExperiencia || 'intermedio';
    if (!['novato', 'intermedio', 'avanzado'].includes(nivelExperiencia)) {
      nivelExperiencia = 'intermedio';
    }

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
      sexo: data.sexo || '',
      objetivo: data.objetivoPrincipal || 'Mejorar condición física',
      fotoUrl: data.fotoUrl || data.urlFoto || '',
      contactoEmergenciaNombre: data.contactoEmergenciaNombre || '',
      contactoEmergenciaTelefono: data.contactoEmergenciaTelefono || '',
      idSede: data.idSede || 0,
      nombreSede: data.nombreSede || '',
      nivelExperiencia: nivelExperiencia,
      tipoMembresia: this.tipoMembresia || this.userProfile.tipoMembresia,
      username: data.username || this.userUsername || this.userName
    };

    this.profileForm.patchValue(this.userProfile);
    this.sedeNombre = data.nombreSede || 'Sede Principal';

    if (nombreCompleto.trim()) {
      this.userName = nombreCompleto.trim();
    }

    this.avatarUrl = this.userProfile.fotoUrl || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(this.userName) + '&background=0F1C3F&color=fff&bold=true');

    if (data.contactoEmergenciaNombre) {
      this.contactos = [{
        nombre: data.contactoEmergenciaNombre,
        telefono: data.contactoEmergenciaTelefono,
        parentesco: 'Emergencia'
      }];
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
      peso,
      masaMuscular: musculo,
      grasaCorporal: grasa,
      imc: Math.round(imc * 10) / 10,
      imcEstado: this.getImcEstado(imc),
      fechaActualizacion: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    };
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
    if (fileInput) fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.mostrarErrorModal('Por favor selecciona una imagen válida (JPG, PNG)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarErrorModal('La imagen no puede superar los 5MB');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreview = e.target?.result as string;
      reader.readAsDataURL(file);
      this.error = null;
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) return;
    this.uploadingImage = true;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('upload_preset', environment.cloudinary.uploadPreset);
    formData.append('cloud_name', environment.cloudinary.cloudName);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;

    this.uploadToCloudinary(cloudinaryUrl, formData).subscribe({
      next: (response: any) => {
        const imageUrl = response.secure_url || response.url;
        if (imageUrl) {
          this.userProfile.fotoUrl = imageUrl;
          this.guardarCambiosEnServidor(imageUrl);
        } else {
          this.uploadingImage = false;
          this.mostrarErrorModal('No se pudo obtener la URL de la imagen');
        }
      },
      error: () => {
        this.uploadingImage = false;
        this.mostrarErrorModal('Error al subir la imagen a Cloudinary.');
      }
    });
  }

  uploadToCloudinary(url: string, formData: FormData): Observable<any> {
    return new Observable((observer: any) => {
      fetch(url, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => { observer.next(data); observer.complete(); })
        .catch(err => observer.error(err));
    });
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

    this.guardarCambiosEnServidor(this.userProfile.fotoUrl);
  }

  guardarCambiosEnServidor(fotoUrl: string): void {
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
      objetivoPrincipal: formValues.objetivo || '',
      contactoEmergenciaNombre: formValues.contactoEmergenciaNombre || '',
      contactoEmergenciaTelefono: formValues.contactoEmergenciaTelefono || '',
      nivelExperiencia: formValues.nivelExperiencia || 'intermedio',
      fotoUrl: fotoUrl || ''
    };

    this.userService.updateUserProfile(dataToSend).subscribe({
      next: (response: any) => {
        this.guardando = false;
        this.uploadingImage = false;
        this.editando = false;
        this.selectedFile = null;
        this.imagePreview = null;

        if (response && response.fotoUrl) {
          this.userProfile.fotoUrl = response.fotoUrl;
          this.avatarUrl = response.fotoUrl;
        }

        this.userProfile = { ...this.userProfile, ...formValues };
        this.profileBackup = { ...this.userProfile };
        this.mensajeExito = 'Datos actualizados correctamente';

        setTimeout(() => {
          this.mensajeExito = null;
          this.loadProfileData();
        }, 1500);
      },
      error: (err: any) => {
        this.guardando = false;
        this.uploadingImage = false;
        let mensaje = 'Error al guardar los cambios. Intenta de nuevo.';
        if (err.error?.message) mensaje = err.error.message;
        this.error = mensaje;
      }
    });
  }

  mostrarErrorModal(mensaje: string, accion?: () => void): void {
    this.modalErrorMessage = mensaje;
    this.errorAccion = accion || null;
    this.mostrarModalError = true;
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
  }

  calcularEdad(fecha: string): number {
    if (!fecha) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  getImcEstado(imc: number): string {
    if (!imc) return 'Normal';
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.trim().split(' ');
    return partes.length === 1 ? partes[0].charAt(0).toUpperCase() : (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  refreshData(): void { this.loadProfileData(); }
  toggleSidebar(): void { this.isSidebarOpen = !this.isSidebarOpen; }
  closeSidebar(): void { this.isSidebarOpen = false; }
}