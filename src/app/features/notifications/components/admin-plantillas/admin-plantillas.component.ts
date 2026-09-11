import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { PlantillaNotificacion, EnumCanalNotificacion, EnumEventoAsociado } from '../../models/notification.model';

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

  // Propiedades de filtrado
  filtroBusqueda: string = '';
  filtroTipo: string = '';
  filtroEstado: boolean | null = null;
  
  // Variables auxiliares para mostrar texto plano con llaves en el HTML
  ejemploNombre = '{{nombre}}';
  ejemploEmail = '{{email}}';
  
  plantillaForm: PlantillaNotificacion = {
    nombre: '',
    titulo: '',
    descripcion: '',
    contenido: '',
    tipoPlantilla: 'EMAIL',
    eventoAsociado: 'WELCOME',
    eventosAsociados: ['WELCOME']
  };

  canalesDisponibles: EnumCanalNotificacion[] = ['EMAIL', 'WHATSAPP'];
  eventosDisponibles: EnumEventoAsociado[] = [
    'WELCOME', 'REGISTRO_USUARIO', 'LOGIN_USUARIO',  
    'PAYMENT_REMINDER', 'ACHIEVEMENT', 'MAINTENANCE_ALERT', 'PROMOTION', 'CHANGE_PASSWORD'
  ];

  vistaPreviaTexto = '';

  // Getter de plantillas filtradas para la tabla y contadores
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
      eventoAsociado: 'WELCOME',
      eventosAsociados: ['WELCOME']
    };
    this.modalAbierto = true;
  }

  abrirModalEditar(plantilla: PlantillaNotificacion): void {
    this.esEdicion = true;
    this.plantillaForm = { ...plantilla };
    this.modalAbierto = true;
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
        },
        error: (err) => alert('Error al actualizar: ' + err.error?.message)
      });
    } else {
      this.notificationService.crearPlantilla(this.rolAdmin, this.plantillaForm).subscribe({
        next: () => {
          this.cargarPlantillas();
          this.cerrarModal();
        },
        error: (err) => alert('Error al crear: ' + err.error?.message)
      });
    }
  }

  cambiarEstado(plantilla: PlantillaNotificacion): void {
    if (!plantilla.idPlantilla) return;
    const nuevoEstado = !plantilla.estado;
    this.notificationService.cambiarEstadoPlantilla(this.rolAdmin, plantilla.idPlantilla, nuevoEstado).subscribe({
      next: () => {
        plantilla.estado = nuevoEstado;
      },
      error: (err) => alert('Error al cambiar estado: ' + err.error?.message)
    });
  }

  generarVistaPrevia(): void {
    this.notificationService.vistaPreviaPlantilla(this.rolAdmin, this.plantillaForm.contenido).subscribe({
      next: (res) => {
        this.vistaPreviaTexto = res.contenido;
      },
      error: (err) => alert('Error al generar vista previa')
    });
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroTipo = '';
    this.filtroEstado = null;
  }
}