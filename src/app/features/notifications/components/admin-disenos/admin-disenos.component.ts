import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { PlantillaDisenoEmail, EnumEventoAsociado, EnumCanalNotificacion } from '../../models/notification.model';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-disenos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-disenos.component.html',
  styleUrls: ['./admin-disenos.component.scss']
})
export class AdminDisenosComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private rolAdmin = 'ADMIN';

  disenos: (PlantillaDisenoEmail & { selected?: boolean })[] = [];
  cargando = false;
  modalAbierto = false;
  esEdicion = false;

  filtroBusqueda: string = '';
  filtroEvento: string = 'TODOS';
  filtroCanal: string = 'TODOS';

  eventosDisponibles: EnumEventoAsociado[] = [
    'WELCOME', 'REGISTRO_USUARIO', 'LOGIN_USUARIO',
    'PAYMENT_REMINDER', 'ACHIEVEMENT', 'MAINTENANCE_ALERT', 'PROMOTION', 'CHANGE_PASSWORD'
  ];

  disenoFormGroup!: FormGroup;

  constructor() {
    this.initForm();
  }

  private initForm(): void {
    this.disenoFormGroup = this.fb.group({
      idDiseno: [null],
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      eventoAsociado: ['WELCOME', [Validators.required]],
      canal: ['EMAIL', [Validators.required]],
      colorPrincipal: ['#2c4b77', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      colorSecundario: ['#8bb5d6', [Validators.required, Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
      tituloHeader: ['Pulse Gym', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      subtituloHeader: ['Tu bienestar, nuestra pasión', [Validators.maxLength(150)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarDisenos();
  }

  get disenosFiltrados(): (PlantillaDisenoEmail & { selected?: boolean })[] {
    return this.disenos.filter(d => {
      if (d.eliminado) return false;

      const coincideTexto = !this.filtroBusqueda ||
        d.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        d.tituloHeader.toLowerCase().includes(this.filtroBusqueda.toLowerCase());

      const coincideEvento = this.filtroEvento === 'TODOS' || d.eventoAsociado === this.filtroEvento;
      const coincideCanal = this.filtroCanal === 'TODOS' || d.canal === this.filtroCanal;

      return coincideTexto && coincideEvento && coincideCanal;
    });
  }

  get disenosSeleccionadosCount(): number {
    return this.disenosFiltrados.filter(d => d.selected).length;
  }

  get todosSeleccionadosFiltrados(): boolean {
    const visibles = this.disenosFiltrados;
    if (visibles.length === 0) return false;
    return visibles.every(d => d.selected);
  }

  toggleSeleccionarTodos(event: any): void {
    const checked = event.target.checked;
    this.disenosFiltrados.forEach(d => d.selected = checked);
  }

  limpiarSeleccionDisenos(): void {
    this.disenos.forEach(d => d.selected = false);
  }

  cargarDisenos(): void {
    this.cargando = true;
    this.notificationService.listarDisenos(this.rolAdmin).subscribe({
      next: (res) => {
        const lista = res.data || [];
        this.disenos = lista.map((d: PlantillaDisenoEmail) => ({ ...d, selected: false }));
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar diseños', err);
        this.cargando = false;
      }
    });
  }

  abrirModalCrear(): void {
    this.esEdicion = false;
    this.disenoFormGroup.reset({
      eventoAsociado: 'WELCOME',
      canal: 'EMAIL',
      colorPrincipal: '#2c4b77',
      colorSecundario: '#8bb5d6',
      tituloHeader: 'Pulse Gym',
      subtituloHeader: 'Tu bienestar, nuestra pasión',
      activo: true
    });
    this.modalAbierto = true;
  }

  abrirModalEditar(diseno: PlantillaDisenoEmail): void {
    this.esEdicion = true;
    this.disenoFormGroup.patchValue(diseno);
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.disenoFormGroup.get(campo);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  guardarDiseno(): void {
    if (this.disenoFormGroup.invalid) {
      this.disenoFormGroup.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, revise los campos marcados en rojo y corrija los errores antes de continuar.',
        confirmButtonColor: '#0e3b72'
      });
      return;
    }

    const payload: PlantillaDisenoEmail = this.disenoFormGroup.value;

    if (this.esEdicion && payload.idDiseno) {
      this.notificationService.actualizarDiseno(this.rolAdmin, payload.idDiseno, payload).subscribe({
        next: () => { 
          this.cargarDisenos(); 
          this.cerrarModal(); 
          Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'El diseño se ha actualizado exitosamente.',
            confirmButtonColor: '#0e3b72',
            timer: 2000
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Error al actualizar diseño.',
            confirmButtonColor: '#0e3b72'
          });
        }
      });
    } else {
      this.notificationService.crearDiseno(this.rolAdmin, payload).subscribe({
        next: () => { 
          this.cargarDisenos(); 
          this.cerrarModal(); 
          Swal.fire({
            icon: 'success',
            title: '¡Creado!',
            text: 'El diseño se ha creado exitosamente.',
            confirmButtonColor: '#0e3b72',
            timer: 2000
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Error al crear diseño.',
            confirmButtonColor: '#0e3b72'
          });
        }
      });
    }
  }

  eliminarDiseno(diseno: PlantillaDisenoEmail): void {
    if (!diseno.idDiseno) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: `Deseas eliminar el diseño "${diseno.nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.notificationService.eliminarDiseno(this.rolAdmin, diseno.idDiseno!).subscribe({
          next: () => {
            this.cargarDisenos();
            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: 'El diseño ha sido eliminado correctamente.',
              confirmButtonColor: '#0e3b72',
              timer: 2000
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'Error al eliminar diseño.',
              confirmButtonColor: '#0e3b72'
            });
          }
        });
      }
    });
  }

  async eliminarDisenosEnLote(): Promise<void> {
    const seleccionados = this.disenosFiltrados.filter(d => d.selected && d.idDiseno);
    if (seleccionados.length === 0) return;

    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Deseas eliminar ${seleccionados.length} diseño(s) seleccionado(s)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#0e3b72',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      this.cargando = true;
      const peticiones = seleccionados.map(d => 
        this.notificationService.eliminarDiseno(this.rolAdmin, d.idDiseno!)
      );

      forkJoin(peticiones).subscribe({
        next: () => {
          this.cargando = false;
          Swal.fire({
            icon: 'success',
            title: '¡Eliminados!',
            text: 'Los diseños seleccionados han sido eliminados correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargarDisenos();
        },
        error: () => {
          this.cargando = false;
          Swal.fire('Error', 'Error al eliminar los diseños seleccionados.', 'error');
          this.cargarDisenos();
        }
      });
    }
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEvento = 'TODOS';
    this.filtroCanal = 'TODOS';
  }
}