import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { EnvioNotificacion } from '../../models/notification.model';

@Component({
  selector: 'app-admin-envio-manual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-envio-manual.component.html'
})
export class AdminEnvioManualComponent implements InstanceType<any> {
  private notificationService = inject(NotificationService);
  private rolAdmin = 'ADMIN';

  envio: EnvioNotificacion = {
    usuarioId: 1,
    destinatario: '',
    asunto: '',
    contenido: '',
    canal: 'EMAIL'
  };

  mensajeResultado = '';
  esError = false;

  enviar(): void {
    this.notificationService.enviarNotificacionManual(this.rolAdmin, this.envio).subscribe({
      next: (res) => {
        this.esError = false;
        this.mensajeResultado = res.message || 'Notificación enviada con éxito';
      },
      error: (err) => {
        this.esError = true;
        this.mensajeResultado = err.error?.message || 'Error al enviar la notificación';
      }
    });
  }
}