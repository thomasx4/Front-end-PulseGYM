import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { ConfiguracionGlobal } from '../../models/notification.model';

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-configuracion.component.html'
})
export class AdminConfiguracionComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private rolAdmin = 'ADMIN';

  config: ConfiguracionGlobal = {
    maxNotificacionesPorDia: 100,
    maxNotificacionesPorMinuto: 10
  };
  mensajeExito = '';

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
        this.mensajeExito = res.message || 'Configuración actualizada correctamente';
        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => alert('Error al actualizar límites: ' + err.error?.message)
    });
  }
}