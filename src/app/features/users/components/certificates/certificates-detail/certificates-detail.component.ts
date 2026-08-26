import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CertificateService } from '../../../../../core/services/certificate.service';
import { Certificate } from '../../../../../core/models/certificate';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-certificates-detail',
  templateUrl: './certificates-detail.component.html',
  styleUrls: ['./certificates-detail.component.scss']
})
export class CertificatesDetailComponent implements OnInit {
  certificate: Certificate | null = null;
  loading: boolean = false;
  downloading: boolean = false;
  errorMensaje: string = '';
  pdfUrlSafe: SafeResourceUrl | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private certificateService: CertificateService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.cargarCertificación(parseInt(id, 10));
      }
    });
  }

  cargarCertificación(idCertificacion: number): void {
    this.loading = true;
    this.errorMensaje = '';

    this.certificateService.obtenerTodasLasCertificaciones().subscribe({
      next: (certificaciones) => {
        const encontrada = certificaciones.find(c => c.idCertificacion === idCertificacion);

        if (encontrada) {
          this.certificate = encontrada;

          if (this.certificate.urlPdf) {
            let rawUrl = this.certificate.urlPdf;

            if (rawUrl.includes('cloudinary.com') && !rawUrl.toLowerCase().endsWith('.pdf')) {
              rawUrl = `${rawUrl}.pdf`;
            }

            const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
            this.pdfUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(googleViewerUrl);
          } else {
            this.pdfUrlSafe = null;
          }
        } else {
          this.errorMensaje = 'No se encontró la certificación especificada.';
        }

        this.loading = false;
      },
      error: (error) => {
        this.errorMensaje = error.message || error.error?.message || 'No se pudo cargar la información de la certificación.';
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMensaje,
          confirmButtonColor: '#0f1c3f'
        });
      }
    });
  }

  async descargarCertificado(): Promise<void> {
    if (!this.certificate?.urlPdf) return;

    this.downloading = true;
    let url = this.certificate.urlPdf;

    try {
      if (url.includes('cloudinary.com')) {
        const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.setAttribute('download', `Certificacion_${this.certificate.nombreCertificacion.replace(/\s+/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const fileName = `Certificacion_${this.certificate.nombreCertificacion.replace(/\s+/g, '_')}.pdf`;
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch {
      window.open(url, '_blank');
    } finally {
      this.downloading = false;
    }
  }

  volver(): void {
    this.router.navigate(['/dashboard-admin/users/certificates']);
  }

  editar(): void {
    if (this.certificate) {
      this.router.navigate(['/dashboard-admin/users/certificates/edit', this.certificate.idCertificacion]);
    }
  }

  eliminar(): void {
    if (!this.certificate) return;

    Swal.fire({
      title: '¿Eliminar certificación?',
      text: `¿Estás seguro de eliminar la certificación "${this.certificate.nombreCertificacion}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af'
    }).then((result) => {
      if (result.isConfirmed) {
        this.certificateService.eliminarCertificacion(this.certificate!.idCertificacion).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Certificación eliminada',
              text: 'La certificación ha sido eliminada correctamente.',
              confirmButtonColor: '#0f1c3f'
            });
            this.volver();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo eliminar la certificación.',
              confirmButtonColor: '#0f1c3f'
            });
          }
        });
      }
    });
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return 'N/D';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'N/D';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}