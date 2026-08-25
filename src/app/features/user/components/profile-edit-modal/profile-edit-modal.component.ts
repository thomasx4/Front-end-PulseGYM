import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserProfile, PerfilMedico, HistorialFisico } from '../../models/user-profile.module';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss']
})
export class EditProfileModalComponent implements OnInit {
  activeTab: 'basicos' | 'emergencia' | 'medico' | 'fisico' = 'basicos';
  
  profileForm!: FormGroup;
  emergencyForm!: FormGroup;
  
  // Datos solo lectura
  perfilMedico: PerfilMedico | null = null;
  historialFisico: HistorialFisico | null = null;

  previewImage: string | null = null;
  readonly defaultAvatar = 'https://pulsegym.com/storage/profiles/socio_default_avatar.jpg';

  tabs = [
    { id: 'basicos' as const, label: 'Datos básicos', icon: 'user' },
    { id: 'emergencia' as const, label: 'Contacto emergencia', icon: 'phone' },
    { id: 'medico' as const, label: 'Perfil médico', icon: 'heart' },
    { id: 'fisico' as const, label: 'Historial físico', icon: 'chart' }
  ];

  nivelesExperiencia = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditProfileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      profile: UserProfile;
      perfilMedico: PerfilMedico;
      historialFisico: HistorialFisico;
    }
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadReadOnlyData();
  }

  private initForms(): void {
    const p = this.data?.profile;
    
    // Formulario Datos Básicos
    this.profileForm = this.fb.group({
      nombre: [p?.nombre || '', [Validators.required, Validators.minLength(2)]],
      apellido: [p?.apellido || '', [Validators.required, Validators.minLength(2)]],
      telefono: [p?.telefono || '', [Validators.required, Validators.pattern(/^\+?[0-9\s\-]{10,15}$/)]],
      documentoIdentidad: [p?.documentoIdentidad || '', [Validators.required]],
      fechaNacimiento: [p?.fechaNacimiento || '', [Validators.required]],
      fotoUrl: [p?.fotoUrl || this.defaultAvatar],
      objetivoPrincipal: [p?.objetivoPrincipal || ''],
      nivelExperiencia: [p?.nivelExperiencia || 'principiante'],
      idSede: [p?.idSede || 1]
    });

    this.previewImage = this.profileForm.get('fotoUrl')?.value;

    // Formulario Contacto Emergencia
    this.emergencyForm = this.fb.group({
      contactoEmergenciaNombre: [p?.contactoEmergenciaNombre || '', [Validators.required]],
      contactoEmergenciaTelefono: [p?.contactoEmergenciaTelefono || '', [Validators.required, Validators.pattern(/^\+?[0-9\s\-]{10,15}$/)]]
    });
  }

  private loadReadOnlyData(): void {
    this.perfilMedico = this.data?.perfilMedico || null;
    this.historialFisico = this.data?.historialFisico || null;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
        this.profileForm.patchValue({ fotoUrl: this.previewImage });
      };
      reader.readAsDataURL(file);
    }
  }

  setActiveTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
  }

  guardarCambios(): void {
    if (this.profileForm.invalid || this.emergencyForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.profileForm.value,
      ...this.emergencyForm.value
    };

    // Aquí conectas tu servicio
    // this.userService.completarPerfil(payload).subscribe(...)
    
    console.log('Payload para completar-perfil:', payload);
    this.dialogRef.close(payload);
  }

  private markAllAsTouched(): void {
    [this.profileForm, this.emergencyForm].forEach(form => {
      Object.values(form.controls).forEach(control => {
        control.markAsTouched();
      });
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  // Helpers para validación visual
  isInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control && control.invalid && control.touched);
  }
}