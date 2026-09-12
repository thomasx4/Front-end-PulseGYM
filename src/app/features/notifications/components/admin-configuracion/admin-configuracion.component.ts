import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { ConfiguracionGlobal } from '../../models/notification.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-configuracion.component.html',
  styleUrls: ['./admin-configuracion.component.scss']
})
export class AdminConfiguracionComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private rolAdmin = 'ADMIN';

  config: ConfiguracionGlobal = {
    maxNotificacionesPorDia: 100,
    maxNotificacionesPorMinuto: 10
  };

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.notificationService.obtenerConfiguracionGlobal(this.rolAdmin).subscribe({
      next: (res) => {
        if (res.data) {
          this.config = res.data;
        }
      },
      error: (err) => console.error('Error al cargar límites', err)
    });
  }

  guardarConfiguracion(): void {
    this.notificationService.actualizarConfiguracionGlobal(this.rolAdmin, this.config).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: res.message || 'Configuración global actualizada correctamente.',
          confirmButtonColor: '#0e3b72',
          timer: 2000
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Error al actualizar límites.',
          confirmButtonColor: '#0e3b72'
        });
      }
    });
  }
}