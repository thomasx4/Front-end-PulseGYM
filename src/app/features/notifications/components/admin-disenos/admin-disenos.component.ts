import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { PlantillaDisenoEmail, EnumEventoAsociado, EnumCanalNotificacion } from '../../models/notification.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-disenos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-disenos.component.html',
  styleUrls: ['./admin-disenos.component.scss']
})
export class AdminDisenosComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private rolAdmin = 'ADMIN';

  disenos: PlantillaDisenoEmail[] = [];
  modalAbierto = false;
  esEdicion = false;

  filtroBusqueda: string = '';
  filtroEvento: string = 'TODOS';
  filtroCanal: string = 'TODOS';

  eventosDisponibles: EnumEventoAsociado[] = [
    'WELCOME', 'REGISTRO_USUARIO', 'LOGIN_USUARIO',
    'PAYMENT_REMINDER', 'ACHIEVEMENT', 'MAINTENANCE_ALERT', 'PROMOTION', 'CHANGE_PASSWORD'
  ];

  disenoForm: PlantillaDisenoEmail = {
    nombre: '',
    eventoAsociado: 'WELCOME',
    canal: 'EMAIL',
    colorPrincipal: '#2c4b77',
    colorSecundario: '#8bb5d6',
    tituloHeader: 'Pulse Gym',
    subtituloHeader: 'Tu bienestar, nuestra pasión',
    activo: true
  };

  ngOnInit(): void {
    this.cargarDisenos();
  }

  get disenosFiltrados(): PlantillaDisenoEmail[] {
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

  cargarDisenos(): void {
    this.notificationService.listarDisenos(this.rolAdmin).subscribe({
      next: (res) => this.disenos = res.data || [],
      error: (err) => console.error('Error al cargar diseños', err)
    });
  }

  abrirModalCrear(): void {
    this.esEdicion = false;
    this.disenoForm = {
      nombre: '',
      eventoAsociado: 'WELCOME',
      canal: 'EMAIL',
      colorPrincipal: '#2c4b77',
      colorSecundario: '#8bb5d6',
      tituloHeader: 'Pulse Gym',
      subtituloHeader: 'Tu bienestar, nuestra pasión',
      activo: true
    };
    this.modalAbierto = true;
  }

  abrirModalEditar(diseno: PlantillaDisenoEmail): void {
    this.esEdicion = true;
    this.disenoForm = { ...diseno };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarDiseno(): void {
    if (this.esEdicion && this.disenoForm.idDiseno) {
      this.notificationService.actualizarDiseno(this.rolAdmin, this.disenoForm.idDiseno, this.disenoForm).subscribe({
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
      this.notificationService.crearDiseno(this.rolAdmin, this.disenoForm).subscribe({
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

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEvento = 'TODOS';
    this.filtroCanal = 'TODOS';
  }
}