import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-whatsapp.component.html',
  styleUrls: ['./admin-whatsapp.component.scss']
})
export class AdminWhatsappComponent implements OnInit {
  private notificationService = inject(NotificationService);

  telefono: string = '';
  codigoGenerado: string | null = null;
  statusWhatsApp: { logged_in: boolean; iniciado: boolean } | null = null;
  cargando: boolean = false;
  mensajeRespuesta: string | null = null;

  ngOnInit(): void {
    this.consultarEstado();
  }

  solicitarCodigo(): void {
    if (!this.telefono) return;
    this.cargando = true;
    this.codigoGenerado = null;

    this.notificationService.solicitarCodigoWhatsApp(this.telefono).subscribe({
      next: (res) => {
        this.codigoGenerado = res.codigo;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al solicitar código', err);
        this.cargando = false;
      }
    });
  }

  consultarEstado(): void {
    this.notificationService.verificarStatusWhatsApp().subscribe({
      next: (res) => {
        this.statusWhatsApp = res;
      },
      error: (err) => {
        console.error('Error al consultar estado', err);
      }
    });
  }

  reiniciarSesion(): void {
    this.cargando = true;
    this.notificationService.reiniciarSesionWhatsApp().subscribe({
      next: (res) => {
        this.mensajeRespuesta = res.mensaje;
        this.cargando = false;
        setTimeout(() => this.consultarEstado(), 4000);
      },
      error: (err) => {
        console.error('Error al reiniciar sesión', err);
        this.cargando = false;
      }
    });
  }
}