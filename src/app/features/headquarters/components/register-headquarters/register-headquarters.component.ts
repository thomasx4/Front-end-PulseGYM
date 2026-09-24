import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Sede } from '../../models/sede.model';
import { HeadquarterService } from '../../../../core/services/headquarter.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-headquarters',
  templateUrl: './register-headquarters.component.html',
  styleUrls: ['./register-headquarters.component.scss']
})
export class RegisterHeadquartersComponent implements OnInit {

  @Input() sedeAEditar: Sede | null = null;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() sedeGuardada = new EventEmitter<void>();

  sedeForm!: FormGroup;
  cargando: boolean = false;
  errorMensaje: string = '';
  esEdicion: boolean = false;

  constructor(
    private fb: FormBuilder,
    private headquarterService: HeadquarterService
  ) {}

  ngOnInit(): void {
    this.esEdicion = !!this.sedeAEditar;
    this.initForm();
  }

  private initForm(): void {
    this.sedeForm = this.fb.group({
      nombreSede: [this.sedeAEditar?.nombreSede || '', [Validators.required, Validators.minLength(3)]],
      ciudad: [this.sedeAEditar?.ciudad || '', [Validators.required, Validators.minLength(3)]],
      direccion: [this.sedeAEditar?.direccion || '', [Validators.required, Validators.minLength(5)]],
      telefono: [this.sedeAEditar?.telefono || '', [
        Validators.required,
        Validators.pattern(/^[0-9]{6,10}$/)
      ]]
    });
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.sedeForm.get(campo);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  soloNumerosTelefono(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = digits;
    this.sedeForm.get('telefono')?.setValue(digits, { emitEvent: false });
  }

  guardarSede(): void {
    if (this.sedeForm.invalid) {
      this.sedeForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    const payload: Sede = {
      nombreSede: this.sedeForm.value.nombreSede.trim(),
      ciudad: this.sedeForm.value.ciudad.trim(),
      direccion: this.sedeForm.value.direccion.trim(),
      telefono: this.sedeForm.value.telefono.trim(),
      cantidadEquipos: this.sedeAEditar?.cantidadEquipos ?? 0
    };

    if (this.esEdicion && this.sedeAEditar?.idSede) {
      this.headquarterService.actualizarSede(this.sedeAEditar.idSede, payload).subscribe({
        next: () => {
          this.cargando = false;
          Swal.fire({
            icon: 'success',
            title: '¡Sede Actualizada!',
            text: 'Los cambios de la sede han sido guardados exitosamente.',
            timer: 2000,
            showConfirmButton: false
          });
          this.sedeGuardada.emit();
        },
        error: (err) => {
          console.error('Error al actualizar sede:', err);
          this.errorMensaje = err?.error?.message || 'No se pudo actualizar la sede.';
          this.cargando = false;
        }
      });
    } else {
      this.headquarterService.registrarSede(payload).subscribe({
        next: () => {
          this.cargando = false;
          Swal.fire({
            icon: 'success',
            title: '¡Sede Creada!',
            text: 'La nueva sede ha sido registrada correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
          this.sedeGuardada.emit();
        },
        error: (err) => {
          console.error('Error al registrar sede:', err);
          this.errorMensaje = err?.error?.message || 'No se pudo registrar la nueva sede.';
          this.cargando = false;
        }
      });
    }
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}