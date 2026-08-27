import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { UserService } from '../../../../core/services/user.service';
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
  // REFERENCIA AL CONTENEDOR
  @ViewChild('dashboardContainer') dashboardContainer!: ElementRef;

  // DATOS GENERALES
  userName: string = 'Administrador';
  loading: boolean = false;
  errorMessage: string = '';

  anioSeleccionado: number = new Date().getFullYear();
  anosDisponibles: number[] = [];

  // MAPA DE FOTOS Y CONTROL DE ERRORES DE AVATAR
  fotosUsuariosMap: Map<number, string> = new Map<number, string>();
  avatarErrors: Set<string> = new Set<string>();

  // ESTADÍSTICAS DE USUARIOS
  statsUsuarios = [
    {
      titulo: 'Total Usuarios',
      valor: 0,
      tendencia: 0,
      icono: 'users',
      color: 'blue',
    },
    {
      titulo: 'Activos',
      valor: 0,
      tendencia: 0,
      icono: 'active',
      color: 'purple',
    },
    {
      titulo: 'Inactivos',
      valor: 0,
      tendencia: 0,
      icono: 'inactive',
      color: 'grey',
    },
    {
      titulo: 'Nuevos del Mes',
      valor: 0,
      icono: 'new',
      color: 'blue',
    },
  ];

  // INGRESOS MENSUALES (GRÁFICO DE BARRAS)
  ingresosMensuales: any[] = [];

  // DISTRIBUCIÓN DE INGRESOS (DONUT CHART)
  distribucionIngresos = [
    { fuente: 'Membresías', porcentaje: 0, color: '#0a2a4a' },
    { fuente: 'Entrenamientos', porcentaje: 0, color: '#4f5e93' },
    { fuente: 'Productos', porcentaje: 0, color: '#dbeafe' },
  ];

  // ASISTENCIA Y POR VENCER
  asistenciaAyer: number = 0;
  statsAsistencia = {
    hoy: 0,
    ayer: 0,
  };
  porcentajeAsistencia: number = 0;
  asistenciaHoy: number = 0;
  porVencer: any[] = [];
  equipos: any[] = [];

  statsPorVencer = {
    hoy: 0,
    manana: 0,
  };

  // COMPUTED PROPERTIES (Getters)
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
    private userService: UserService,
    private router: Router
  ) {
    this.generarAnosDisponibles();
  }

  irAAsignarMembresia(): void {
    this.router.navigate(['/dashboard-admin/memberships/assign']);
  }

  // LIFECYCLE HOOKS
  ngOnInit(): void {
    this.cargarMapaFotos();
    this.loadUserData();
    this.cargarDatosDashboard();
  }

  cargarMapaFotos(): void {
    this.userService.obtenerTodosLosPerfilesActivos().pipe(
      catchError(() => of([]))
    ).subscribe((usuarios: any[]) => {
      if (Array.isArray(usuarios)) {
        usuarios.forEach((u: any) => {
          const id = u.idUsuario || u.id;
          const foto = u.fotoUrl || u.fotoPerfil || u.foto || u.avatar;
          if (id && foto) {
            this.fotosUsuariosMap.set(Number(id), foto);
          }
        });
      }
    });
  }

  // HELPER MÉTODOS DE AVATAR Y FOTOS

  getFotoSocio(socio: any): string | null {
    if (!socio) return null;
    const directFoto = socio.fotoUrl || socio.avatarUrl || socio.fotoPerfil || socio.foto || socio.avatar;
    if (directFoto && !directFoto.includes('pravatar.cc') && !directFoto.includes('ui-avatars.com')) {
      let rawUrl = String(directFoto).trim();
      if (rawUrl !== '' && rawUrl !== 'null' && rawUrl !== 'undefined') {
        return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
      }
    }

    const id = socio.id || socio.idSocio || socio.idUsuario;
    if (id && this.fotosUsuariosMap.has(Number(id))) {
      const fotoMap = this.fotosUsuariosMap.get(Number(id));
      if (fotoMap) return fotoMap;
    }

    return null;
  }

  onAvatarError(id: string | number): void {
    if (id) {
      this.avatarErrors.add(String(id));
    }
  }

  hasAvatarError(id: string | number): boolean {
    return this.avatarErrors.has(String(id));
  }

  getInitials(nombre?: string): string {
    if (!nombre) return 'U';
    const partes = nombre.trim().split(' ').filter(p => p.length > 0);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  // CARGA DE DATOS DEL USUARIO
  loadUserData(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.name || 'Administrador';
    }
  }

  // GENERAR AÑOS DISPONIBLES PARA EL SELECTOR
  generarAnosDisponibles(): void {
    const añoActual = new Date().getFullYear();
    const añoInicio = 2020;
    this.anosDisponibles = [];
    for (let año = añoInicio; año <= añoActual + 1; año++) {
      this.anosDisponibles.push(año);
    }
    this.anosDisponibles.sort((a, b) => b - a);
  }

  // CARGAR TODOS LOS DATOS DEL DASHBOARD
  cargarDatosDashboard(): void {
    this.loading = true;
    this.errorMessage = '';
    Promise.all([
      this.cargarEstadisticasUsuarios(),
      this.cargarIngresos(),
      this.cargarDistribucion(),
      this.cargarAsistencia(),
      this.cargarPorVencer(),
      this.cargarEquipos(),
    ])
      .then(() => {
        this.loading = false;
      })
      .catch((error) => {
        console.error('Error al cargar datos del dashboard:', error);
        this.errorMessage = 'Error al cargar los datos del dashboard';
        this.loading = false;
      });
  }

  private async cargarEstadisticasUsuarios(): Promise<void> {
    try {
      const usuarios = await this.dashboardService.getTotalUsuarios().toPromise();

      const totalUsuarios = usuarios?.length || 0;
      const usuariosActivos = usuarios?.filter((u: any) => u.estado === 'ACTIVO') || [];
      const usuariosInactivos = usuarios?.filter((u: any) => u.estado === 'INACTIVO') || [];

      const ahora = new Date();
      const mesActual = ahora.getMonth();
      const anioActual = ahora.getFullYear();

      const nuevosDelMes = usuarios?.filter((u: any) => {
        if (!u.fechaRegistro) return false;

        const fechaRegistro = new Date(u.fechaRegistro);

        return fechaRegistro.getMonth() === mesActual &&
          fechaRegistro.getFullYear() === anioActual;
      }) || [];

      this.statsUsuarios[0].valor = totalUsuarios;
      this.statsUsuarios[1].valor = usuariosActivos.length;
      this.statsUsuarios[2].valor = usuariosInactivos.length;
      this.statsUsuarios[3].valor = nuevosDelMes.length;

    } catch (error) {
      console.error('Error al cargar estadísticas de usuarios:', error);
      this.statsUsuarios[0].valor = 0;
      this.statsUsuarios[1].valor = 0;
      this.statsUsuarios[2].valor = 0;
      this.statsUsuarios[3].valor = 0;
    }
  }

  // CARGAR INGRESOS ÚLTIMOS 6 MESES
  private async cargarIngresos(): Promise<void> {
    try {
      const nombresMeses = [
        'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
        'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
      ];
      const ahora = new Date();
      const mesActual = ahora.getMonth();
      const anio = this.anioSeleccionado;
      this.ingresosMensuales = [];
      const esAñoActual = anio === new Date().getFullYear();
      const mesLimite = esAñoActual ? mesActual : 11;
      const totalMeses = esAñoActual ? 6 : 12;
      for (let i = totalMeses - 1; i >= 0; i--) {
        let mesIndex = mesLimite - i;
        let añoMes = anio;
        if (mesIndex < 0) {
          mesIndex += 12;
          añoMes = anio - 1;
        }
        const mesNum = mesIndex + 1;
        const nombreMes = nombresMeses[mesIndex];
        try {
          const data = await this.dashboardService
            .getIngresosMensuales(mesNum, añoMes)
            .toPromise();
          const totalIngresos = data?.totalGeneral || 0;
          this.ingresosMensuales.push({
            mes: nombreMes,
            ingresos: totalIngresos,
            anio: añoMes,
            mesNum: mesNum,
            detalle: data?.detalle || [],
          });
        } catch (error) {
          this.ingresosMensuales.push({
            mes: nombreMes,
            ingresos: 0,
            anio: añoMes,
            mesNum: mesNum,
            detalle: [],
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
    }
  }

  // CARGAR DISTRIBUCIÓN DE INGRESOS
  private async cargarDistribucion(): Promise<void> {
    try {
      const ahora = new Date();
      const fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];
      const data = await this.dashboardService
        .getIngresosPorMembresia(fechaInicio, fechaFin)
        .toPromise();
      if (
        data &&
        data.detalle &&
        Array.isArray(data.detalle) &&
        data.detalle.length > 0
      ) {
        const total = data.totalGeneral || 0;
        if (total > 0) {
          this.distribucionIngresos = data.detalle.map((item: any) => ({
            fuente: item.tipoMembresia || 'Otros',
            porcentaje: Math.round((item.total / total) * 100),
            color: this.getColorPorTipo(item.tipoMembresia),
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar distribución:', error);
    }
  }

  // CARGAR ASISTENCIA
  private async cargarAsistencia(): Promise<void> {
    try {
      const dataHoy = await this.dashboardService.getAfluenciaHoy().toPromise();
      const totalSociosHoy = dataHoy?.totalSocios || 0;
      this.asistenciaHoy = totalSociosHoy;
      this.statsAsistencia.hoy = totalSociosHoy;
      const CAPACIDAD_MAXIMA = 100;
      const porcentaje = Math.round((totalSociosHoy / CAPACIDAD_MAXIMA) * 100);
      this.porcentajeAsistencia = Math.min(porcentaje, 100);
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fechaAyer = ayer.toISOString().split('T')[0];
      const dataAyer = await this.dashboardService
        .getAfluenciaPorFecha(fechaAyer)
        .toPromise();
      const totalSociosAyer = dataAyer?.totalSocios || 0;
      this.asistenciaAyer = totalSociosAyer;
      this.statsAsistencia.ayer = totalSociosAyer;
    } catch (error) {
      console.error('Error al cargar asistencia:', error);
      this.asistenciaHoy = 0;
      this.statsAsistencia.hoy = 0;
      this.statsAsistencia.ayer = 0;
      this.porcentajeAsistencia = 0;
    }
  }

  // CARGAR POR VENCER (SOCIOS EN MORA)
  private async cargarPorVencer(): Promise<void> {
    try {
      const response = await this.dashboardService
        .getMembresiasPorVencer()
        .toPromise();

      const data = Array.isArray(response) ? response : [];

      if (data.length === 0) {
        this.porVencer = [];
        this.statsPorVencer.hoy = 0;
        this.statsPorVencer.manana = 0;
        return;
      }

      this.porVencer = data.map((item: any) => {
        const idSocioNum = Number(item.idSocio || item.id);
        const foto = item.avatarUrl || item.fotoUrl || item.fotoPerfil || item.foto || item.avatar || this.fotosUsuariosMap.get(idSocioNum) || null;

        return {
          id: idSocioNum,
          nombre: item.nombreSocio || item.nombre || 'Usuario',
          dias: item.diasRestantes || 0,
          estaVencido: false,
          fotoUrl: foto,
          fechaVencimiento: item.fechaVencimiento,
          estado: item.estado || 'ACTIVA',
          urgencia: item.urgencia || 'PRONTO',
          idSocioMembresia: item.idSocioMembresia,
          nombreMembresia: item.nombreMembresia,
        };
      });

      const hoy = new Date().toISOString().split('T')[0];
      const manana = new Date(Date.now() + 86400000)
        .toISOString()
        .split('T')[0];

      this.statsPorVencer.hoy = this.porVencer.filter(
        (m: any) => m.fechaVencimiento === hoy,
      ).length;

      this.statsPorVencer.manana = this.porVencer.filter(
        (m: any) => m.fechaVencimiento === manana,
      ).length;

    } catch (error) {
      console.error('Error al cargar por vencer:', error);
      this.porVencer = [];
      this.statsPorVencer.hoy = 0;
      this.statsPorVencer.manana = 0;
    }
  }

  // CARGAR ESTADO DE EQUIPOS
  private async cargarEquipos(): Promise<void> {
    try {
      const response = await this.dashboardService
        .getEstadoEquipos()
        .toPromise();
      const equiposData = response?.data || [];
      this.equipos = equiposData.map((equipo: any) => ({
        id: equipo.id,
        nombre: equipo.nombre,
        estado: this.normalizarEstado(equipo.estado),
        icon: this.getIconoEstado(equipo.estado),
      }));
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      this.equipos = [];
    }
  }

  // NORMALIZAR ESTADO DEL EQUIPO
  private normalizarEstado(estado: string): string {
    if (!estado) return 'Mantenimiento';
    const estadoUpper = estado.toUpperCase();
    if (estadoUpper === 'OPERATIVO') return 'Operativo';
    if (estadoUpper === 'MANTENIMIENTO') return 'Mantenimiento';
    if (estadoUpper === 'FUERA_DE_SERVICIO') return 'Fuera de Servicio';
    return 'Mantenimiento';
  }

  // OBTENER ICONO SEGÚN ESTADO
  private getIconoEstado(estado: string): string {
    if (!estado) return '⚠️';
    const estadoUpper = estado.toUpperCase();
    if (estadoUpper === 'OPERATIVO') return '✅';
    if (estadoUpper === 'MANTENIMIENTO') return '⚠️';
    if (estadoUpper === 'FUERA_DE_SERVICIO') return '❌';
    return '⚠️';
  }

  // CAMBIAR AÑO Y RECARGAR INGRESOS
  cambiarAnio(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.anioSeleccionado = parseInt(select.value, 10);
    this.cargarIngresos();
  }

  // MÉTODOS PARA TENDENCIAS
  hasTrend(tendencia: number | undefined): boolean {
    return tendencia !== undefined && tendencia !== null;
  }

  isPositiveTrend(tendencia: number | undefined): boolean {
    if (tendencia === undefined || tendencia === null) return false;
    return tendencia >= 0;
  }

  formatTrend(tendencia: number | undefined): string {
    if (tendencia === undefined || tendencia === null) return '';
    if (tendencia > 0) return `+${tendencia}%`;
    if (tendencia < 0) return `${tendencia}%`;
    return '0%';
  }

  // MÉTODOS PARA GRÁFICOS
  getDonutGradient(): string {
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
    if (max === 0) return 0;
    return (ingreso / max) * 100;
  }

  getColor(porcentaje: number): string {
    if (porcentaje >= 70) return '#22c55e';
    if (porcentaje >= 40) return '#f59e0b';
    return '#ef4444';
  }

  private getColorPorTipo(tipo: string): string {
    const colores: { [key: string]: string } = {
      Membresía: '#0a2a4a',
      Premium: '#1e4a75',
      Básica: '#4f5e93',
      VIP: '#dbeafe',
      Entrenamiento: '#22c55e',
      Producto: '#f59e0b',
    };
    return colores[tipo] || '#6b7280';
  }

  // EXPORTAR REPORTE A PDF
  async exportarReporte(): Promise<void> {
    try {
      this.loading = true;
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // TÍTULO
      pdf.setFontSize(18);
      pdf.setTextColor('#0b192c');
      pdf.text('Reporte de Ingresos - Últimos 6 Meses', pageWidth / 2, 25, {
        align: 'center',
      });

      // SUBTÍTULO
      pdf.setFontSize(11);
      pdf.setTextColor('#8a94a6');
      const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      pdf.text(`Generado: ${fechaActual}`, pageWidth / 2, 35, {
        align: 'center',
      });

      // LÍNEA SEPARADORA
      pdf.setDrawColor('#e2e8f0');
      pdf.line(margin, 40, pageWidth - margin, 40);

      // TABLA DE INGRESOS
      const startY = 50;
      const rowHeight = 12;
      const colWidths = [
        pageWidth * 0.15,
        pageWidth * 0.25,
        pageWidth * 0.25,
        pageWidth * 0.2,
      ];
      let x = margin;
      let y = startY;

      // CABECERA DE LA TABLA
      pdf.setFillColor('#f1f2f4');
      pdf.rect(
        x,
        y,
        colWidths.reduce((a, b) => a + b, 0),
        rowHeight,
        'F',
      );
      pdf.setFontSize(11);
      pdf.setTextColor('#1a1a2e');
      pdf.setFont('helvetica', 'bold');
      const headers = ['Mes', 'Año', 'Ingresos', 'Porcentaje'];
      headers.forEach((header, index) => {
        pdf.text(header, x + 3, y + 8);
        x += colWidths[index];
      });

      // LÍNEAS VERTICALES DE LA CABECERA
      x = margin;
      pdf.setDrawColor('#e2e8f0');
      for (let i = 0; i <= headers.length; i++) {
        pdf.line(x, y, x, y + rowHeight);
        x += colWidths[i] || 0;
      }
      pdf.line(
        margin,
        y + rowHeight,
        margin + colWidths.reduce((a, b) => a + b, 0),
        y + rowHeight,
      );

      // DATOS DE LA TABLA
      y += rowHeight;
      const total = this.totalRevenue;

      if (this.ingresosMensuales.length === 0) {
        pdf.setFontSize(12);
        pdf.setTextColor('#ef4444');
        pdf.text(
          'No hay datos de ingresos disponibles',
          pageWidth / 2,
          y + 20,
          {
            align: 'center',
          },
        );
      } else {
        this.ingresosMensuales.forEach((item, index) => {
          const porcentaje = total > 0 ? (item.ingresos / total) * 100 : 0;
          if (index % 2 === 0) {
            pdf.setFillColor('#fafbfc');
            pdf.rect(
              margin,
              y,
              colWidths.reduce((a, b) => a + b, 0),
              rowHeight,
              'F',
            );
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
          pdf.setDrawColor('#e2e8f0');
          pdf.line(
            margin,
            y + rowHeight,
            margin + colWidths.reduce((a, b) => a + b, 0),
            y + rowHeight,
          );
          y += rowHeight;
        });
      }

      // LÍNEAS VERTICALES DE LA TABLA
      x = margin;
      for (let i = 0; i <= headers.length; i++) {
        pdf.line(x, startY, x, y);
        x += colWidths[i] || 0;
      }

      // TOTAL
      y += 8;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor('#0b192c');
      const totalText = `Total General: $ ${Number(total).toLocaleString('es-CO')}`;
      pdf.text(totalText, pageWidth - margin - 80, y);

      // PIE DE PÁGINA
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor('#8a94a6');
      pdf.text(
        'Pulse Gym - Reporte generado automáticamente',
        pageWidth / 2,
        pageHeight - 15,
        {
          align: 'center',
        },
      );

      // GUARDAR PDF
      pdf.save(
        `Ingresos-6-meses-${new Date().toISOString().split('T')[0]}.pdf`,
      );
      this.loading = false;
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.loading = false;
      this.errorMessage = 'Error al exportar el reporte. Intenta nuevamente.';
    }
  }

  // DELAY PARA ESPERAR RENDERIZADO
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}