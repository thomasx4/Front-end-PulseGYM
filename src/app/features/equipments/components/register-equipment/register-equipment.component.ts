import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EquipmentService } from '../../../../core/services/equipment.service';
import { SedeService } from '../../../../core/services/sede.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Equipo, EstadoEquipo } from '../../models/equipment.model';
import { Supplier } from '../../../suppliers/models/suppliers.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-equipment',
  templateUrl: './register-equipment.component.html',
  styleUrls: ['./register-equipment.component.scss']
})
export class RegisterEquipmentComponent implements OnInit {

  @Input() equipoAEditar: Equipo | null = null;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() equipoGuardado = new EventEmitter<void>();

  equipoForm!: FormGroup;
  sedes: any[] = [];
  proveedores: Supplier[] = [];

  cargando: boolean = false;
  cargandoListas: boolean = false;
  errorMensaje: string = '';

  constructor(
    private fb: FormBuilder,
    private equipmentService: EquipmentService,
    private sedeService: SedeService,
    private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarSelects();
  }

  private initForm(): void {
    this.equipoForm = this.fb.group({
      nombre: [this.equipoAEditar?.nombre || '', [Validators.required, Validators.minLength(3)]],
      marca: [this.equipoAEditar?.marca || '', [Validators.required]],
      modelo: [this.equipoAEditar?.modelo || '', [Validators.required]],
      numeroSerie: [this.equipoAEditar?.numeroSerie || '', [Validators.required]],
      idSede: [this.equipoAEditar?.idSede || '', [Validators.required]],
      idProveedor: [this.equipoAEditar?.idProveedor || '', [Validators.required]],
      fechaAdquisicion: [this.equipoAEditar?.fechaAdquisicion || '', [Validators.required]],
      fechaGarantia: [this.equipoAEditar?.fechaGarantia || '', [Validators.required]],
      ubicacion: [this.equipoAEditar?.ubicacion || '', [Validators.required]],
      estado: [this.equipoAEditar?.estado || 'OPERATIVO', [Validators.required]]
    });
  }

  private cargarSelects(): void {

    this.sedeService.obtenerSedes().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) this.sedes = res;
        else if (res && Array.isArray(res.data)) this.sedes = res.data;
        else this.sedes = [];
      },
      error: (err) => console.error('Error al cargar sedes:', err)
    });

    this.supplierService.obtenerTodos().subscribe({
      next: (data: Supplier[]) => {
        this.proveedores = data || [];
        this.cargandoListas = false;
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        this.cargandoListas = false;
      }
    });
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.equipoForm.get(campo);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  guardarEquipo(): void {
    if (this.equipoForm.invalid) {
      this.equipoForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    const payload: Equipo = {
      idSede: Number(this.equipoForm.value.idSede),
      idProveedor: Number(this.equipoForm.value.idProveedor),
      nombre: this.equipoForm.value.nombre.trim(),
      marca: this.equipoForm.value.marca.trim(),
      modelo: this.equipoForm.value.modelo.trim(),
      numeroSerie: this.equipoForm.value.numeroSerie.trim(),
      fechaAdquisicion: this.equipoForm.value.fechaAdquisicion,
      fechaGarantia: this.equipoForm.value.fechaGarantia,
      ubicacion: this.equipoForm.value.ubicacion.trim(),
      estado: this.equipoForm.value.estado as EstadoEquipo
    };

    const esEdicion = !!(this.equipoAEditar && this.equipoAEditar.id);

    const peticion = esEdicion
      ? this.equipmentService.actualizarEquipo(this.equipoAEditar!.id!, payload)
      : this.equipmentService.registrarEquipo(payload);

    peticion.subscribe({
      next: () => {
        this.cargando = false;
        Swal.fire({
          icon: 'success',
          title: esEdicion ? '¡Equipo Actualizado!' : '¡Equipo Registrado!',
          text: esEdicion ? 'Los datos se guardaron correctamente.' : 'El equipo se ha registrado en la flota.',
          timer: 2000,
          showConfirmButton: false
        });
        this.equipoGuardado.emit();
      },
      error: (err) => {
        console.error('Error al guardar equipo:', err);
        this.errorMensaje = err?.error?.message || 'Ocurrió un error al procesar la solicitud.';
        this.cargando = false;
      }
    });
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}