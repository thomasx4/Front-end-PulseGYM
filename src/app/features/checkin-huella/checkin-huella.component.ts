import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BiometricService } from '../../core/services/biometric.service';
import { SharedModule } from '../../shared/shared.module';
import { EstadoEscaneoHuella } from '../../shared/components/fingerprint-scanner/fingerprint-scanner.component';

@Component({
  selector: 'app-checkin-huella',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './checkin-huella.component.html',
  styleUrls: ['./checkin-huella.component.scss']
})
export class CheckinHuellaComponent implements OnInit, OnDestroy {
  huellaDisponible = false;
  nombreLocal: string | null = null;

  estado: EstadoEscaneoHuella = 'idle';
  mensaje = '';
  horaRegistro: string | null = null;

  private reinicioSub?: Subscription;

  constructor(private biometricService: BiometricService) { }

  ngOnInit(): void {
    const local = this.biometricService.obtenerHuellaLocal();
    this.huellaDisponible = !!local;
    this.nombreLocal = local?.nombre || null;
    this.mensaje = this.mensajeInicial();
  }

  ngOnDestroy(): void {
    this.reinicioSub?.unsubscribe();
  }

  private mensajeInicial(): string {
    return this.huellaDisponible
      ? 'Coloca tu huella para marcar tu asistencia'
      : 'Este dispositivo no tiene una huella activada. Actívala desde Ajustes en tu perfil.';
  }

  onEscanear(): void {
    if (!this.huellaDisponible) {
      this.estado = 'error';
      this.mensaje = 'No hay una huella activada en este dispositivo.';
      return;
    }

    this.estado = 'escaneando';
    this.mensaje = 'Leyendo huella digital...';
    this.horaRegistro = null;

    this.reinicioSub?.unsubscribe();
    this.reinicioSub = timer(1600).pipe(
      switchMap(() => this.biometricService.registrarAsistencia())
    ).subscribe({
      next: () => {
        this.estado = 'exito';
        const ahora = new Date();
        this.horaRegistro = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        this.mensaje = this.nombreLocal
          ? `¡Bienvenido, ${this.nombreLocal}!`
          : 'Asistencia registrada correctamente';

        this.reinicioSub = timer(4000).subscribe(() => this.reiniciar());
      },
      error: (err) => {
        this.estado = 'error';
        this.mensaje = err?.message || 'No se pudo registrar tu asistencia. Intenta de nuevo.';

        this.reinicioSub = timer(3000).subscribe(() => this.reiniciar());
      }
    });
  }

  reiniciar(): void {
    this.estado = 'idle';
    this.mensaje = this.mensajeInicial();
    this.horaRegistro = null;
  }
}
