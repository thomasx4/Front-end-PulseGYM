import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { PlantillaDisenoEmail, EnumEventoAsociado, EnumCanalNotificacion } from '../../models/notification.model';

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
        next: () => { this.cargarDisenos(); this.cerrarModal(); },
        error: (err) => alert('Error al actualizar diseño: ' + err.error?.message)
      });
    } else {
      this.notificationService.crearDiseno(this.rolAdmin, this.disenoForm).subscribe({
        next: () => { this.cargarDisenos(); this.cerrarModal(); },
        error: (err) => alert('Error al crear diseño: ' + err.error?.message)
      });
    }
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEvento = 'TODOS';
    this.filtroCanal = 'TODOS';
  }
}