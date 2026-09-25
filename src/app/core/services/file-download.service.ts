import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import Swal from 'sweetalert2';

export interface SaveAndShareOptions {
  title?: string;
  dialogTitle?: string;
  successMessage?: string;
}

/**
 * Unifica la descarga de reportes/comprobantes (PDF, Excel, ZIP) en toda la app.
 * En web hace la descarga clásica con <a download>. En la app nativa (APK) guarda
 * el archivo con Capacitor Filesystem y abre el share sheet nativo (Capacitor Share),
 * igual que el comprobante de pago, para que el usuario pueda verlo o compartirlo.
 */
@Injectable({ providedIn: 'root' })
export class FileDownloadService {

  async saveAndShare(blob: Blob, fileName: string, options: SaveAndShareOptions = {}): Promise<void> {
    const title = options.title || 'Pulse Gym';
    const dialogTitle = options.dialogTitle || 'Abrir o compartir archivo';

    try {
      if (Capacitor.isNativePlatform()) {
        await this.guardarYCompartirNativo(blob, fileName, title, dialogTitle);

        if (options.successMessage) {
          Swal.fire({
            icon: 'success',
            title: options.successMessage,
            timer: 2500,
            showConfirmButton: false
          });
        }
      } else {
        this.descargarEnNavegador(blob, fileName);
      }
    } catch (err) {
      console.error('Error al procesar el archivo:', err);
      Swal.fire('Error', 'Ocurrió un error al procesar el archivo.', 'error');
    }
  }

  /**
   * Para archivos alojados en una URL externa (ej. Cloudinary) en vez de venir
   * como Blob directo del backend.
   */
  async fetchAndSaveAndShare(url: string, fileName: string, options: SaveAndShareOptions = {}): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No se pudo descargar el archivo (status ${response.status})`);
    }
    const blob = await response.blob();
    await this.saveAndShare(blob, fileName, options);
  }

  private async guardarYCompartirNativo(blob: Blob, fileName: string, title: string, dialogTitle: string): Promise<void> {
    try {
      await Filesystem.requestPermissions();
    } catch (permErr) {
      console.warn('Permisos de almacenamiento no disponibles o denegados:', permErr);
    }

    const base64Content = await this.blobToBase64(blob);

    try {
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Content,
        directory: Directory.Cache
      });

      await Share.share({
        title,
        url: savedFile.uri,
        dialogTitle
      });
    } catch (fsError: any) {
      console.error('Error al guardar archivo en el dispositivo:', fsError);
      Swal.fire('Error', 'No se pudo guardar el archivo en el dispositivo: ' + (fsError.message || fsError), 'error');
    }
  }

  private descargarEnNavegador(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64Content = base64data.includes(',') ? base64data.split(',')[1] : base64data;
        resolve(base64Content);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}
