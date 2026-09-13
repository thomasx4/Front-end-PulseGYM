import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { PlantillaNotificacion, EnumCanalNotificacion, EnumEventoAsociado } from '../../models/notification.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-plantillas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-plantillas.component.html',
  styleUrls: ['./admin-plantillas.component.scss']
})
export class AdminPlantillasComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private rolAdmin = 'ADMIN';

  plantillas: PlantillaNotificacion[] = [];
  cargando = false;
  modalAbierto = false;
  esEdicion = false;

  filtroBusqueda: string = '';
  filtroTipo: string = '';
  filtroEstado: boolean | null = null;
  
  ejemploNombre = '{{nombre}}';
  ejemploEmail = '{{email}}';

  canalesDisponibles: EnumCanalNotificacion[] = ['EMAIL', 'WHATSAPP'];
  eventosDisponibles: EnumEventoAsociado[] = [
    'WELCOME', 'REGISTRO_USUARIO', 'LOGIN_USUARIO',  
    'PAYMENT_REMINDER', 'ACHIEVEMENT', 'MAINTENANCE_ALERT', 'PROMOTION', 'CHANGE_PASSWORD'
  ];
  
  plantillaForm: PlantillaNotificacion = {
    nombre: '',
    titulo: '',
    descripcion: '',
    contenido: '',
    tipoPlantilla: 'EMAIL',
    eventoAsociado: 'PROMOTION',
    eventosAsociados: ['PROMOTION']
  };

  vistaPreviaTexto = '';

  get plantillasFiltradas(): PlantillaNotificacion[] {
    return this.plantillas.filter(p => {
      const coincideTexto = !this.filtroBusqueda || 
        p.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(this.filtroBusqueda.toLowerCase()));
      
      const coincideTipo = !this.filtroTipo || p.tipoPlantilla === this.filtroTipo;
      
      const coincideEstado = this.filtroEstado === null || p.estado === this.filtroEstado;

      return coincideTexto && coincideTipo && coincideEstado;
    });
  }

  ngOnInit(): void {
    this.cargarPlantillas();
  }

  cargarPlantillas(): void {
    this.cargando = true;
    this.notificationService.listarPlantillas(this.rolAdmin).subscribe({
      next: (res) => {
        this.plantillas = res.data || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar plantillas', err);
        this.cargando = false;
      }
    });
  }

  abrirModalCrear(): void {
    this.esEdicion = false;
    this.plantillaForm = {
      nombre: '',
      titulo: '',
      descripcion: '',
      contenido: '',
      tipoPlantilla: 'EMAIL',
      eventoAsociado: 'PROMOTION',
      eventosAsociados: ['PROMOTION']
    };
    this.modalAbierto = true;
  }

  abrirModalEditar(plantilla: PlantillaNotificacion): void {
    this.esEdicion = true;
    this.plantillaForm = { 
      ...plantilla,
      eventoAsociado: plantilla.eventoAsociado || plantilla.eventosAsociados?.[0] || 'PROMOTION',
      eventosAsociados: plantilla.eventosAsociados?.length ? plantilla.eventosAsociados : [plantilla.eventoAsociado || 'PROMOTION']
    };
    this.modalAbierto = true;
  }

  onEventoChange(nuevoEvento: EnumEventoAsociado): void {
    this.plantillaForm.eventoAsociado = nuevoEvento;
    this.plantillaForm.eventosAsociados = [nuevoEvento];
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarPlantilla(): void {
    if (this.esEdicion && this.plantillaForm.idPlantilla) {
      this.notificationService.actualizarPlantilla(this.rolAdmin, this.plantillaForm.idPlantilla, this.plantillaForm).subscribe({
        next: () => {
          this.cargarPlantillas();
          this.cerrarModal();
          Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'La plantilla se ha actualizado exitosamente.',
            confirmButtonColor: '#0e3b72',
            timer: 2000
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Error al actualizar la plantilla.',
            confirmButtonColor: '#0e3b72'
          });
        }
      });
    } else {
      this.notificationService.crearPlantilla(this.rolAdmin, this.plantillaForm).subscribe({
        next: () => {
          this.cargarPlantillas();
          this.cerrarModal();
          Swal.fire({
            icon: 'success',
            title: '¡Creado!',
            text: 'La plantilla se ha creado exitosamente.',
            confirmButtonColor: '#0e3b72',
            timer: 2000
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Error al crear la plantilla.',
            confirmButtonColor: '#0e3b72'
          });
        }
      });
    }
  }

  cambiarEstado(plantilla: PlantillaNotificacion): void {
    if (!plantilla.idPlantilla) return;
    const nuevoEstado = !plantilla.estado;
    this.notificationService.cambiarEstadoPlantilla(this.rolAdmin, plantilla.idPlantilla, nuevoEstado).subscribe({
      next: () => {
        plantilla.estado = nuevoEstado;
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: `La plantilla ahora está ${nuevoEstado ? 'activa' : 'inactiva'}.`,
          confirmButtonColor: '#0e3b72',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'No se pudo cambiar el estado.',
          confirmButtonColor: '#0e3b72'
        });
      }
    });
  }

  generarVistaPrevia(): void {
    this.notificationService.vistaPreviaPlantilla(this.rolAdmin, this.plantillaForm.contenido).subscribe({
      next: (res) => {
        this.vistaPreviaTexto = res.contenido;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar la vista previa.',
          confirmButtonColor: '#0e3b72'
        });
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroTipo = '';
    this.filtroEstado = null;
  }

  eliminarPlantilla(plantilla: PlantillaNotificacion): void {
    if (!plantilla.idPlantilla) return;
  
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Deseas eliminar la plantilla "${plantilla.nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#0e3b72',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.notificationService.eliminarPlantilla(this.rolAdmin, plantilla.idPlantilla!).subscribe({
          next: () => {
            this.cargarPlantillas();
            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: 'La plantilla ha sido eliminada correctamente.',
              confirmButtonColor: '#0e3b72',
              timer: 2000
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'Error al eliminar plantilla.',
              confirmButtonColor: '#0e3b72'
            });
          }
        });
      }
    });
  }
}