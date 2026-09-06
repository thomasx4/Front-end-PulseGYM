import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier } from '../../models/suppliers.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-supplier',
  templateUrl: './register-supplier.component.html',
  styleUrls: ['./register-supplier.component.scss']
})
export class RegisterSupplierComponent {

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() proveedorGuardado = new EventEmitter<void>();

  nombreEmpresa: string = '';
  contactoNombre: string = '';
  telefono: string = '';
  email: string = '';

  proveedorForm!: FormGroup;
  cargando: boolean = false;
  errorMensaje: string = '';

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.proveedorForm = this.fb.group({
      nombreEmpresa: ['', [Validators.required, Validators.minLength(3)]],
      contactoNombre: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [
        Validators.required,
        Validators.pattern(/^\+?[0-9\s\-]{7,15}$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]]
    });
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.proveedorForm.get(campo);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  guardarProveedor(): void {
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    const payload: Supplier = {
      nombreEmpresa: this.proveedorForm.value.nombreEmpresa.trim(),
      contactoNombre: this.proveedorForm.value.contactoNombre.trim(),
      telefono: this.proveedorForm.value.telefono.trim(),
      email: this.proveedorForm.value.email.trim()
    };

    this.supplierService.registrarProveedor(payload).subscribe({
      next: () => {
        this.cargando = false;
        Swal.fire({
          icon: 'success',
          title: '¡Proveedor Registrado!',
          text: 'El proveedor se ha guardado exitosamente.',
          timer: 2000,
          showConfirmButton: false
        });
        this.proveedorGuardado.emit();
      },
      error: (err) => {
        console.error('Error al registrar proveedor:', err);
        this.errorMensaje = err?.error?.message || 'No se pudo registrar el proveedor. Intente de nuevo.';
        this.cargando = false;
      }
    });
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}