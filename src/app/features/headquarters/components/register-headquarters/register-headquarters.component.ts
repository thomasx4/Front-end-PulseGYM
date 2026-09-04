import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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

  nombreSede: string = '';
  ciudad: string = '';
  direccion: string = '';
  telefono: string = '';
  cantidadEquipos: number = 0;

  cargando: boolean = false;
  errorMensaje: string = '';
  esEdicion: boolean = false;

  constructor(private headquarterService: HeadquarterService) {}

  ngOnInit(): void {
    if (this.sedeAEditar) {
      this.esEdicion = true;
      this.nombreSede = this.sedeAEditar.nombreSede || '';
      this.ciudad = this.sedeAEditar.ciudad || '';
      this.direccion = this.sedeAEditar.direccion || '';
      this.telefono = this.sedeAEditar.telefono || '';
      this.cantidadEquipos = this.sedeAEditar.cantidadEquipos ?? 0;
    }
  }

  guardarSede(): void {
    if (!this.nombreSede.trim() || !this.ciudad.trim() || !this.direccion.trim() || !this.telefono.trim()) {
      this.errorMensaje = 'Por favor completa todos los campos obligatorios (*).';
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    const payload: Sede = {
      nombreSede: this.nombreSede.trim(),
      ciudad: this.ciudad.trim(),
      direccion: this.direccion.trim(),
      telefono: this.telefono.trim(),
      cantidadEquipos: Number(this.cantidadEquipos) || 0
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