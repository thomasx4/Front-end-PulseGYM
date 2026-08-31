import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService, DashboardResumenDTO } from '../../../../core/services/dashboard.service';
import jsPDF from 'jspdf';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  @ViewChild('dashboardContainer') dashboardContainer!: ElementRef;

  userName: string = 'Administrador';
  loading: boolean = false;
  errorMessage: string = '';

  anioSeleccionado: number = new Date().getFullYear();
  anosDisponibles: number[] = [];
  avatarErrors: Set<string> = new Set<string>();

  statsUsuarios = [
    { titulo: 'Total Usuarios', valor: 0, tendencia: 0, icono: 'users', color: 'blue' },
    { titulo: 'Activos', valor: 0, tendencia: 0, icono: 'active', color: 'purple' },
    { titulo: 'Inactivos', valor: 0, tendencia: 0, icono: 'inactive', color: 'grey' },
    { titulo: 'Nuevos del Mes', valor: 0, icono: 'new', color: 'blue' },
  ];

  ingresosMensuales: any[] = [];
  distribucionIngresos: any[] = [];

  asistenciaAyer: number = 0;
  asistenciaHoy: number = 0;
  statsAsistencia = { hoy: 0, ayer: 0 };
  porcentajeAsistencia: number = 0;
  porVencer: any[] = [];
  equipos: any[] = [];

  statsPorVencer = { hoy: 0, manana: 0 };

  private readonly NOMBRES_MESES = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];

  get totalRevenue(): number {
    return this.ingresosMensuales.reduce((sum, item) => sum + item.ingresos, 0);
  }

  get maxIngreso(): number {
    if (this.ingresosMensuales.length === 0) return 0;
    return Math.max(...this.ingresosMensuales.map((item) => item.ingresos));
  }

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {
    this.generarAnosDisponibles();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.cargarDatosDashboard();
  }

  irAAsignarMembresia(): void {
    this.router.navigate(['/dashboard-admin/memberships/assign']);
  }

  getFotoSocio(socio: any): string | null {
    if (!socio) return null;
    const directFoto = socio.fotoUrl || socio.avatarUrl || socio.fotoPerfil || socio.foto || socio.avatar;
    if (directFoto && !directFoto.includes('pravatar.cc') && !directFoto.includes('ui-avatars.com')) {
      const rawUrl = String(directFoto).trim();
      if (rawUrl !== '' && rawUrl !== 'null' && rawUrl !== 'undefined') {
        return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
      }
    }
    return null;
  }

  onAvatarError(id: string | number): void {
    if (id) this.avatarErrors.add(String(id));
  }

  hasAvatarError(id: string | number): boolean {
    return this.avatarErrors.has(String(id));
  }

  getInitials(nombre?: string): string {
    if (!nombre) return 'U';
    const partes = nombre.trim().split(' ').filter((p) => p.length > 0);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  loadUserData(): void {
    const user = this.authService.getUser();
    if (user) this.userName = user.name || 'Administrador';
  }

  generarAnosDisponibles(): void {
    const añoActual = new Date().getFullYear();
    this.anosDisponibles = [];
    for (let año = 2020; año <= añoActual + 1; año++) {
      this.anosDisponibles.push(año);
    }
    this.anosDisponibles.sort((a, b) => b - a);
  }

  cargarDatosDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.dashboardService.getDashboardResumen().pipe(
      catchError((err) => {
        console.error('Error al cargar datos del dashboard:', err);
        this.errorMessage = 'Error al cargar los datos del dashboard';
        return of(null);
      })
    ).subscribe((resumen) => {
      if (resumen) {
        this.procesarResumenDashboard(resumen);
      }
      this.loading = false;
    });
  }

  private procesarResumenDashboard(resumen: DashboardResumenDTO): void {
    this.statsUsuarios[0].valor = resumen.totalUsuarios || 0;
    this.statsUsuarios[1].valor = resumen.usuariosActivos || 0;
    this.statsUsuarios[2].valor = resumen.usuariosInactivos || 0;
    this.statsUsuarios[3].valor = resumen.nuevosDelMes || 0;

    this.procesarPorVencer(resumen.membresiasPorVencer || []);

    const totalHoy = resumen.afluenciaHoy?.totalSocios || 0;
    const totalAyer = resumen.afluenciaAyer?.totalSocios || 0;

    this.asistenciaHoy = totalHoy;
    this.asistenciaAyer = totalAyer;
    this.statsAsistencia.hoy = totalHoy;
    this.statsAsistencia.ayer = totalAyer;
    this.porcentajeAsistencia = Math.min(Math.round((totalHoy / 100) * 100), 100);

    if (resumen.equiposCriticos && resumen.equiposCriticos.length > 0) {
      this.equipos = resumen.equiposCriticos.map((e: any) => ({
        id: e.id,
        nombre: e.nombre,
        estado: this.normalizarEstado(e.estado),
      }));
    } else {
      this.equipos = [
        { id: 1, nombre: 'Mantenimientos en Curso', estado: resumen.equiposEnMantenimiento ? 'Mantenimiento' : 'Operativo' }
      ];
    }

    if (resumen.ingresosSeisMeses?.meses) {
      const mesesBackend = resumen.ingresosSeisMeses.meses;

      this.ingresosMensuales = mesesBackend.map((m: any) => {
        const numMes = Number(m.mes);
        const nombreMes = numMes >= 1 && numMes <= 12 ? this.NOMBRES_MESES[numMes - 1] : `MES ${m.mes}`;
        return {
          mes: nombreMes,
          ingresos: m.totalGeneral || 0,
          anio: m.anio,
          detalle: m.detalle || []
        };
      });

      const mesActualData = mesesBackend[mesesBackend.length - 1];
      this.procesarDistribucion(mesActualData);
    }
  }

  private procesarDistribucion(mesActualData: any): void {
    if (mesActualData && Array.isArray(mesActualData.detalle) && mesActualData.detalle.length > 0) {
      const totalMes = mesActualData.totalGeneral || 0;
      this.distribucionIngresos = mesActualData.detalle.map((item: any) => {
        const porcentajeCalculado = totalMes > 0 ? Math.round((item.total / totalMes) * 100) : 0;
        return {
          fuente: item.tipoMembresia || 'Otros',
          porcentaje: porcentajeCalculado,
          color: this.getColorPorTipo(item.tipoMembresia)
        };
      });
    } else {
      this.distribucionIngresos = [
        { fuente: 'Sin pagos este mes', porcentaje: 100, color: '#94a3b8' }
      ];
    }
  }

  private procesarPorVencer(data: any[]): void {
    if (!Array.isArray(data) || data.length === 0) {
      this.porVencer = [];
      return;
    }
    this.porVencer = data.map((item: any) => ({
      id: Number(item.idSocio || item.id),
      nombre: item.nombreSocio || item.nombre || 'Usuario',
      dias: item.diasRestantes || 0,
      fotoUrl: item.avatarUrl || item.fotoUrl || item.fotoPerfil || item.foto || null,
      fechaVencimiento: item.fechaVencimiento,
      estado: item.estado || 'ACTIVA',
      urgencia: item.urgencia || 'PRONTO',
    }));
  }

  private normalizarEstado(estado: string): string {
    if (!estado) return 'Mantenimiento';
    const u = estado.toUpperCase();
    if (u === 'OPERATIVO') return 'Operativo';
    if (u === 'MANTENIMIENTO') return 'Mantenimiento';
    if (u === 'FUERA_DE_SERVICIO') return 'Fuera de Servicio';
    return 'Mantenimiento';
  }

  cambiarAnio(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.anioSeleccionado = parseInt(select.value, 10);
  }

  getDonutGradient(): string {
    if (!this.distribucionIngresos || this.distribucionIngresos.length === 0) {
      return 'conic-gradient(#e2e8f0 0% 100%)';
    }
    let accumulated = 0;
    const stops = this.distribucionIngresos.map((item) => {
      const start = accumulated;
      accumulated += item.porcentaje;
      return `${item.color} ${start}% ${accumulated}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  getBarHeight(ingreso: number): number {
    const max = this.maxIngreso;
    return max === 0 ? 0 : (ingreso / max) * 100;
  }

  private getColorPorTipo(tipo: string): string {
    const colores: { [key: string]: string } = {
      '1 mes': '#0a2a4a',
      '3 meses': '#1e4a75',
      '6 meses': '#4f5e93',
      '1 año': '#22c55e',
      'Membresía': '#0a2a4a',
      'Entrenamiento': '#2563eb',
      'Producto': '#f59e0b',
    };
    return colores[tipo] || '#0a2a4a';
  }

  async exportarReporte(): Promise<void> {
    try {
      this.loading = true;
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;

      pdf.setFontSize(18);
      pdf.setTextColor('#0b192c');
      pdf.text('Reporte de Ingresos - Últimos 6 Meses', pageWidth / 2, 25, { align: 'center' });

      pdf.setFontSize(11);
      pdf.setTextColor('#8a94a6');
      const fechaActual = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      pdf.text(`Generado: ${fechaActual}`, pageWidth / 2, 35, { align: 'center' });

      pdf.setDrawColor('#e2e8f0');
      pdf.line(margin, 40, pageWidth - margin, 40);

      const startY = 50;
      const rowHeight = 12;
      const colWidths = [pageWidth * 0.15, pageWidth * 0.25, pageWidth * 0.25, pageWidth * 0.2];
      let x = margin;
      let y = startY;

      pdf.setFillColor('#f1f2f4');
      pdf.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
      pdf.setFontSize(11);
      pdf.setTextColor('#1a1a2e');
      pdf.setFont('helvetica', 'bold');

      const headers = ['Mes', 'Año', 'Ingresos', 'Porcentaje'];
      headers.forEach((header, index) => {
        pdf.text(header, x + 3, y + 8);
        x += colWidths[index];
      });

      y += rowHeight;
      const total = this.totalRevenue;

      this.ingresosMensuales.forEach((item, index) => {
        const porcentaje = total > 0 ? (item.ingresos / total) * 100 : 0;
        if (index % 2 === 0) {
          pdf.setFillColor('#fafbfc');
          pdf.rect(margin, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
        }
        pdf.setFontSize(10);
        pdf.setTextColor('#1a1a2e');
        pdf.setFont('helvetica', 'normal');
        const rowData = [
          String(item.mes || '-'),
          String(item.anio || '-'),
          `$ ${Number(item.ingresos || 0).toLocaleString('es-CO')}`,
          `${porcentaje.toFixed(1)}%`,
        ];
        x = margin;
        rowData.forEach((data, colIndex) => {
          pdf.text(data, x + 3, y + 8);
          x += colWidths[colIndex];
        });
        y += rowHeight;
      });

      y += 8;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total General: $ ${Number(total).toLocaleString('es-CO')}`, pageWidth - margin - 80, y);

      pdf.save(`Ingresos-6-meses-${new Date().toISOString().split('T')[0]}.pdf`);
      this.loading = false;
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.loading = false;
      this.errorMessage = 'Error al exportar el reporte.';
    }
  }
}