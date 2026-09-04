import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { HistorialAccesoItem, HistorialAccesoResponse, FiltrosHistorial } from '../../models/attendance.model';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

@Component({
  selector: 'app-attendance-history',
  templateUrl: './attendance-history.component.html',
  styleUrl: './attendance-history.component.scss'
})
export class AttendanceHistoryComponent implements OnInit {

  logs: HistorialAccesoItem[] = [];
  isLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;

  totalElements: number = 0;
  totalExitosos: number = 0;
  totalFallidos: number = 0;
  tasaExito: number = 0;

  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;

  filtrosActivos: FiltrosHistorial = {
    page: 0,
    size: 10
  };

  constructor(private attendanceService: AttendanceService) { }

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(filtros: FiltrosHistorial = {}): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.filtrosActivos = {
      ...this.filtrosActivos,
      ...filtros,
      page: this.currentPage,
      size: this.pageSize
    };

    this.attendanceService.obtenerHistorialAccesos(this.filtrosActivos).subscribe({
      next: (response: HistorialAccesoResponse) => {
        let datos: HistorialAccesoItem[] = response.content || [];

        console.log('Búsqueda ingresada:', this.filtrosActivos.nombreUsuario);
        console.log('Primer registro recibido del backend:', datos[0]);

        if (this.filtrosActivos.nombreUsuario && this.filtrosActivos.nombreUsuario.trim() !== '') {
          const busqueda = this.filtrosActivos.nombreUsuario.trim().toLowerCase();

          datos = datos.filter((item: HistorialAccesoItem) => {
            // Evalúa la propiedad oficial y respaldos por si la API envía otra clave
            const itemAny = item as any;
            const nombreDirecto = item.nombreUsuario || itemAny.nombre || itemAny.usuario || itemAny.usuarioNombre || '';
            const nombreAnidado = itemAny.usuario?.nombre || itemAny.usuario?.nombreCompleto || '';
            const textoCompleto = `${nombreDirecto} ${nombreAnidado}`.toLowerCase();

            return textoCompleto.includes(busqueda);
          })
        }

        if (this.filtrosActivos.fechaDesde) {
          const desde = new Date(`${this.filtrosActivos.fechaDesde}T00:00:00`);
          datos = datos.filter(item => new Date(item.fechaHora) >= desde);
        }

        if (this.filtrosActivos.fechaHasta) {
          const hasta = new Date(`${this.filtrosActivos.fechaHasta}T23:59:59`);
          datos = datos.filter(item => new Date(item.fechaHora) <= hasta);
        }

        if (this.filtrosActivos.tipoAcceso) {
          datos = datos.filter(item =>
            item.tipoAcceso?.toUpperCase() === this.filtrosActivos.tipoAcceso?.toUpperCase()
          );
        }

        if (this.filtrosActivos.resultado) {
          datos = datos.filter(item =>
            item.resultado?.toUpperCase() === this.filtrosActivos.resultado?.toUpperCase()
          );
        }

        this.logs = datos;

        const seAplicoFiltroLocal = !!(
          this.filtrosActivos.nombreUsuario ||
          this.filtrosActivos.fechaDesde ||
          this.filtrosActivos.fechaHasta ||
          this.filtrosActivos.tipoAcceso ||
          this.filtrosActivos.resultado
        );

        this.totalElements = seAplicoFiltroLocal ? datos.length : (response.totalElements || datos.length);
        this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;

        if (this.currentPage >= this.totalPages) {
          this.currentPage = 0;
        }

        this.calcularKpis();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar historial de accesos:', err);
        this.errorMessage = 'No se pudo obtener el historial de accesos. Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  get paginasVisibles(): number[] {

    const maxVisibles = 4;
    let inicio = Math.max(0, this.currentPage - 1);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPages) {
      fin = this.totalPages;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  get mostrarUltimaPagina(): boolean {
    const paginas = this.paginasVisibles;
    if (paginas.length === 0) return false;
    return paginas[paginas.length - 1] < this.totalPages - 1;
  }

  get esUltimaPagina(): boolean {
    return this.currentPage >= this.totalPages - 1;
  }

  obtenerRangoInicio(): number {
    return this.totalElements === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  obtenerRangoFin(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  irAPagina(p: number): void {
    if (p !== this.currentPage && p >= 0 && p < this.totalPages) {
      this.currentPage = p;
      this.cargarHistorial();
    }
  }

  paginaSiguiente(): void {
    if (!this.esUltimaPagina) {
      this.irAPagina(this.currentPage + 1);
    }
  }

  paginaAnterior(): void {
    if (this.currentPage > 0) {
      this.irAPagina(this.currentPage - 1);
    }
  }

  private calcularKpis(): void {
    this.totalExitosos = this.logs.filter(log => log.resultado === 'EXITOSO').length;
    this.totalFallidos = this.logs.filter(log => log.resultado !== 'EXITOSO').length;

    if (this.logs.length > 0) {
      this.tasaExito = Math.round((this.totalExitosos / this.logs.length) * 100);
    } else {
      this.tasaExito = 0;
    }
  }

  onFiltrar(filtrosEmitidos: FiltrosHistorial): void {
    this.filtrosActivos = {
      ...filtrosEmitidos
    };

    this.currentPage = 0;

    this.cargarHistorial(this.filtrosActivos);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPages) {
      this.currentPage = nuevaPagina;
      this.cargarHistorial();
    }
  }

  exportarReporte(): void {
    if (!this.logs || this.logs.length === 0) {
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(18);
    doc.setTextColor('#0b192c');
    doc.setFont('helvetica');
    doc.text('Pulse GYM - Historial de Accesos', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor('#64748b');
    doc.setFont('helvetica', 'normal');
    const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.text(`Generado: ${fechaGeneracion}`, pageWidth / 2, 27, { align: 'center' });

    const registrosAExportar = this.logs;

    const rows = registrosAExportar.map(item => [
      new Date(item.fechaHora).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'medium'
      }),
      `${item.nombreUsuario} (#${item.usuarioId})`,
      item.nombreSede,
      item.tipoAcceso,
      item.resultado,
      item.motivo || '—'
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Fecha y Hora', 'Usuario', 'Sede', 'Tipo', 'Resultado', 'Motivo']],
      body: rows,
      headStyles: {
        fillColor: [37, 56, 116], // Azul Pulse GYM (#253874)
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    const fechaHoy = new Date().toISOString().slice(0, 10);
    doc.save(`Historial_Accesos_Pagina_${this.currentPage + 1}_${fechaHoy}.pdf`);
  }
}