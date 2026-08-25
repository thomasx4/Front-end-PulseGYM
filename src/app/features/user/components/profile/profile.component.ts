import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  membership: any = null;
  emergencyContact: any = null;
  physicalHistory: any[] = [];
  documents: any[] = [];
  medicalProfile: any = null;

  isEditing = false;
  isAddingPhysical = false;
  editForm: FormGroup;
  physicalForm: FormGroup;

  constructor(
    private profileService: UserProfileService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    // 🟢 Formulario para Datos Básicos + Emergencia
    this.editForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      documentoIdentidad: ['', Validators.required],
      telefono: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      objetivoPrincipal: ['', Validators.required],
      nivelExperiencia: ['', Validators.required],
      contactoEmergenciaNombre: ['', Validators.required],
      contactoEmergenciaTelefono: ['', Validators.required]
    });

    // 🔵 Formulario para Nuevo Registro Físico (cada 15 días)
    this.physicalForm = this.fb.group({
      pesoKg: ['', Validators.required],
      porcentajeGrasa: ['', Validators.required],
      porcentajeMusculo: ['', Validators.required],
      cinturaCm: ['', Validators.required],
      pechoCm: ['', Validators.required],
      brazoIzqCm: ['', Validators.required],
      brazoDerCm: ['', Validators.required],
      piernaIzqCm: ['', Validators.required],
      piernaDerCm: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  private loadAllData(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.emergencyContact = {
          name: data.contactoEmergenciaNombre,
          phone: data.contactoEmergenciaTelefono,
          relationship: 'Contacto de emergencia'
        };
        this.editForm.patchValue(data);
      }
    });

    this.profileService.getDocuments().subscribe({
      next: (data) => this.documents = data
    });

    this.profileService.getMedicalProfile().subscribe({
      next: (data) => this.medicalProfile = data
    });

    this.profileService.getPhysicalHistory().subscribe({
      next: (data) => this.physicalHistory = data
    });

    this.profileService.getMembership().subscribe({
      next: (data) => this.membership = data
    });
  }

  // --- EDITAR DATOS BÁSICOS ---
  editProfile(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    if (this.user) {
      this.editForm.patchValue(this.user);
    }
  }

  saveProfile(): void {
    if (this.editForm.invalid) return;

    this.profileService.updateProfile(this.editForm.value).subscribe({
      next: () => {
        this.loadAllData();
        this.isEditing = false;
      },
      error: (error) => console.error(error)
    });
  }

  // --- AGREGAR NUEVO HISTORIAL FÍSICO ---
  addPhysicalRecord(): void {
    this.isAddingPhysical = true;
  }

  cancelPhysical(): void {
    this.isAddingPhysical = false;
    this.physicalForm.reset();
  }

  savePhysicalRecord(): void {
    if (this.physicalForm.invalid) return;

    // Aquí deberías llamar al endpoint de crear historial físico
    console.log('Nuevo registro físico:', this.physicalForm.value);
    // this.profileService.addPhysicalRecord(this.physicalForm.value).subscribe(...)
    
    this.isAddingPhysical = false;
    this.physicalForm.reset();
    this.loadAllData();
  }

  getImcClass(imc: number): string {
    if (imc < 18.5) return 'warning';
    if (imc < 25) return 'normal';
    if (imc < 30) return 'warning';
    return 'danger';
  }

  changePassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  downloadDocument(url: string): void {
    this.profileService.downloadDocument(url);
  }
  
}