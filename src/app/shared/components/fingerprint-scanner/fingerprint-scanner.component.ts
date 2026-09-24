import { Component, EventEmitter, Input, Output } from '@angular/core';

export type EstadoEscaneoHuella = 'idle' | 'escaneando' | 'exito' | 'error';

@Component({
  selector: 'app-fingerprint-scanner',
  templateUrl: './fingerprint-scanner.component.html',
  styleUrls: ['./fingerprint-scanner.component.scss']
})
export class FingerprintScannerComponent {
  @Input() estado: EstadoEscaneoHuella = 'idle';
  @Input() mensaje = '';
  @Output() escanear = new EventEmitter<void>();

  onClick(): void {
    if (this.estado === 'escaneando') {
      return;
    }
    this.escanear.emit();
  }
}
