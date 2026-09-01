import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { AsistenciaResponseDTO, PeakHour } from '../../models/attendance.model';
import { FiltrosAsistencia } from '../../models/attendance-filter.model';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

export interface AsistenciaTabla {
  idUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
  nombreSede: string;
  horaEntrada: string;
  fechaEntrada: string;
  tipoAcceso: string;
  estadoAcceso: string;
  statusClass: string;
}

@Component({
  selector: 'app-attendance-list',
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.scss'
})
export class AttendanceListComponent implements OnInit {
  asistencias: AsistenciaResponseDTO[] = [];
  asistenciasProcesadas: AsistenciaTabla[] = [];
  cargando = false;
  errorMensaje = '';

  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  capacidadDiaria = 0;
  peakHours: PeakHour[] = [];

  metaDiariaGym: number = 200;
  idSedeActual: number = 1;

  mostrarModalMeta: boolean = false;
  guardandoMeta: boolean = false;
  nuevaMetaTemp: number = 0;
  errorModal: string = '';

  filtrosActivos: FiltrosAsistencia = { ordenFecha: 'desc' };

  constructor(private attendnceService: AttendanceService) { }

  ngOnInit(): void {
    this.capacidadDiaria = this.attendnceService.capacidadDiaria;
    this.cargarAsistenciaHoy();
    this.cargarMetaDiaria();
  }

  cargarAsistenciaHoy(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.attendnceService.obtenerAsistenciasHoy().subscribe({
      next: (respuesta) => {
        this.asistencias = respuesta;
        this.procesarAsistencias();
        this.calcularPeakHours(respuesta);
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMensaje = 'No se pueden cargar las asistencias de hoy';
        this.cargando = false;
      }
    });
  }

  cargarMetaDiaria(): void {
    this.attendnceService.getMetaDiaria(this.idSedeActual).subscribe({
      next: (meta) => {
        if (meta) {
          this.metaDiariaGym = meta;
        }
      },
      error: (err) => console.warn('Nose pudo obtenerla meta guardada, usando valor por defecto', err)
    });
  }

  abrirModalMeta(): void {
    this.nuevaMetaTemp = this.metaDiariaGym;
    this.errorModal = '';
    this.mostrarModalMeta = true;

  }

  cerrarModalMeta(): void {
    if (!this.guardandoMeta) {
      this.mostrarModalMeta = false;
      this.errorModal = '';
    }
  }

  guardarMeta(): void {
    if (!this.nuevaMetaTemp || this.nuevaMetaTemp <= 0) {
      this.errorModal = 'Por favor ingresa un número válido mayor a 0.';
      return;
    }

    this.guardandoMeta = true;
    this.errorModal = '';

    this.attendnceService.actualizarMetaDiaria(this.idSedeActual, this.nuevaMetaTemp).subscribe({
      next: () => {
        this.metaDiariaGym = this.nuevaMetaTemp;
        this.guardandoMeta = false;
        this.mostrarModalMeta = false;
      },
      error: (err) => {
        console.error('Error al actualizar la meta:', err);
        this.metaDiariaGym = this.nuevaMetaTemp;
        this.guardandoMeta = false;
        this.mostrarModalMeta = false;
      }
    });
  }

  onAplicarFiltros(nuevosFiltros: FiltrosAsistencia): void {
    this.filtrosActivos = nuevosFiltros;
    this.paginaActual = 1;
  }

  get asistenciasFiltradas(): AsistenciaTabla[] {
    let resultado = [...this.asistenciasProcesadas];

    if (this.filtrosActivos.textoBusqueda) {
      const q = this.filtrosActivos.textoBusqueda.toLowerCase();
      resultado = resultado.filter(item =>
        item.idUsuario.toString().includes(q) ||
        item.nombre.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.nombreSede.toLowerCase().includes(q)
      );
    }

    if (this.filtrosActivos.tipoAcceso) {
      resultado = resultado.filter(item =>
        item.tipoAcceso.toUpperCase() === this.filtrosActivos.tipoAcceso?.toUpperCase()
      );
    }

    if (this.filtrosActivos.estadoAcceso) {
      resultado = resultado.filter(item =>
        item.estadoAcceso.toUpperCase() === this.filtrosActivos.estadoAcceso?.toUpperCase()
      );
    }

    if (this.filtrosActivos.ordenFecha === 'asc') {
      resultado.reverse();
    }

    return resultado;
  }

  get totalAsistenciaHoy(): number {
    return this.asistencias.length;
  };

  get totalPaginas(): number {
    return Math.ceil(this.asistenciasFiltradas.length / this.itemsPorPagina) || 1;
  }

  get inicio(): number {
    return this.asistencias.length === 0 ? 0 : (this.paginaActual - 1) * this.itemsPorPagina;
  }

  get fin(): number {
    return Math.min(this.paginaActual * this.itemsPorPagina, this.asistencias.length);
  }

  get paginas(): number[] {
    const paginasArr: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      paginasArr.push(i);
    }
    return paginasArr;
  }

  get asistenciasPaginadas(): AsistenciaTabla[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.asistenciasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  procesarAsistencias(): void {
    this.asistenciasProcesadas = this.asistencias.map(a => {
      const fecha = new Date(a.fechaHoraEntrada.endsWith('Z') ? a.fechaHoraEntrada : a.fechaHoraEntrada + 'Z');

      return {
        idUsuario: a.idUsuario,
        nombre: `Usuario #${a.idUsuario}`,
        apellido: '',
        email: `socio${a.idUsuario}@pulsegym.com`,
        nombreSede: a.nombreSede || 'Sede Principal',
        horaEntrada: fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }),
        fechaEntrada: fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }),
        tipoAcceso: a.tipoAcceso || 'BIOMÉTRICO',
        estadoAcceso: a.estadoAcceso === 'PERMITIDO' ? 'Permitido' : 'Denegado',
        statusClass: a.estadoAcceso === 'PERMITIDO' ? 'active' : 'cancelled'
      };
    });
  }

  private calcularPeakHours(asistencias: AsistenciaResponseDTO[]): void {
    const rangos: PeakHour[] = [
      { etiqueta: '5 AM - 9 AM', horaInicio: 5, horaFin: 9, cantidad: 0 },
      { etiqueta: '9 AM - 1 PM', horaInicio: 9, horaFin: 13, cantidad: 0 },
      { etiqueta: '1 PM - 5 PM', horaInicio: 13, horaFin: 17, cantidad: 0 },
      { etiqueta: '5 PM - 9 PM', horaInicio: 17, horaFin: 21, cantidad: 0 }
    ];

    for (const a of asistencias) {
      if (!a.fechaHoraEntrada) continue;

      const fecha = new Date(a.fechaHoraEntrada.endsWith('Z') ? a.fechaHoraEntrada : a.fechaHoraEntrada + 'Z');
      const hora = fecha.getHours();

      const bloque = rangos.find(r => hora >= r.horaInicio && hora < r.horaFin);
      if (bloque) {
        bloque.cantidad++;
      }
    }

    this.peakHours = rangos;
  }

  editarMeta(): void {
    const nuevaMeta = prompt('Ingresa la nueva meta diaria de asistencias:', this.metaDiariaGym.toString());

    if (nuevaMeta && !isNaN(+nuevaMeta) && +nuevaMeta > 0) {
      const valor = +nuevaMeta;
      this.attendnceService.actualizarMetaDiaria(this.idSedeActual, valor).subscribe({
        next: () => {
          this.metaDiariaGym = valor;
        },
        error: (err) => alert('Ocurrio un error al guardar la nueva meta')
      });
    }
  }

  get porcentajeMeta(): number {
    if (this.capacidadDiaria === 0) return 0;
    return Math.round((this.totalAsistenciaHoy / this.capacidadDiaria) * 100);
  }

  get maxPeakHour(): number {
    return Math.max(...this.peakHours.map(p => p.cantidad), 1);
  }

  get peakRushText(): string {
    if (!this.peakHours || this.peakHours.length === 0) return 'N/A';

    const peak = this.peakHours.reduce((max, item) => (item.cantidad > max.cantidad ? item : max));

    if (peak.cantidad === 0) return 'Sin registros';

    return peak.etiqueta;
  }

  formatearHora(fechaStr: string): string {
    if (!fechaStr) return '--:--';
    const fecha = new Date(fechaStr.endsWith('Z') ? fechaStr : fechaStr + 'Z');
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr.endsWith('Z') ? fechaStr : fechaStr + 'Z');
    return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  exportarReportePDF(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor('#0b192c');
    doc.setFont('helvetica');
    doc.text('Pulse GYM - Reporte de Asistencias', pageWidth / 2, 20, { align: 'center' });

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

    const filas = this.asistenciasFiltradas.map(a => [
      `#${a.idUsuario}`,
      a.email,
      a.horaEntrada,
      a.fechaEntrada,
      a.tipoAcceso,
      a.estadoAcceso
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['ID Socio', 'Email / Socio', 'Hora', 'Fecha', 'Tipo Acceso', 'Estado']],
      body: filas,
      theme: 'striped',
      headStyles: {
        fillColor: '#1e1b4b',
        textColor: '#ffffff',
        fontStyle: 'bold'
      }
    });

    doc.save(`PulseGym_Asistencias_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}



