import { Component, OnInit, ElementRef, ViewChild, OnDestroy, NgZone, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';

import '@google/model-viewer';

Chart.register(...registerables);

@Component({
  selector: 'app-historial-fisico',
  templateUrl: './historial-fisico.component.html',
  styleUrls: ['./historial-fisico.component.scss']
})
export class HistorialFisicoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartScrollContainer') chartScrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('modelViewer') modelViewer!: ElementRef;
  chartInstance: Chart | null = null;

  isLoading: boolean = true;
  error: string | null = null;

  userName: string = 'Usuario';
  userEmail: string = '';
  userPhone: string = '';
  userAvatar: string = '';
  estadoSocio: string = 'SOCIO ACTIVO';
  fechaIngreso: string = 'No registrada';
  entrenadorAsignado: string = '';

  ultimaMedicion: any = {};
  historialCompleto: any[] = [];
  chartWidthStyle: string = '100%';

  evolucionData: any = {
    evolucionPeso: [],
    evolucionGrasa: [],
    evolucionMusculo: []
  };

  comparacion = {
    peso: 0,
    grasa: 0,
    musculo: 0,
    cintura: 0
  };

  // Ruta del modelo 3D humano (Mixamo Idle.glb)
  modeloUrl: string = 'assets/models/Idle.glb';
  calibrationMode: boolean = false;

  medidasSilueta = {
    cuello: 0,
    pecho: 0,
    cintura: 0,
    cadera: 0,
    brazoIzq: 0,
    brazoDer: 0,
    piernaIzq: 0,
    piernaDer: 0
  };

  hoveredMeasure: string | null = null;
  private hoverTimeout: any = null;
  private isHovering: boolean = false;

  modelLoaded: boolean = false;
  public isSidebarOpen: boolean = false;
  private avatarError: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setupModelViewer();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  setupModelViewer(): void {
    if (this.modelViewer) {
      const model = this.modelViewer.nativeElement;

      model.addEventListener('load', () => {
        this.modelLoaded = true;
        setTimeout(() => this.adjustHotspots(), 300);
      });

      if (model.loaded) {
        this.modelLoaded = true;
        setTimeout(() => this.adjustHotspots(), 300);
      }
    }
  }

  adjustHotspots(): void {
    if (this.modelViewer) {
      const model = this.modelViewer.nativeElement;
      const hotspots = model.querySelectorAll('.hotspot');
      hotspots.forEach((hotspot: any) => {
        hotspot.style.zIndex = '10';
        hotspot.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
      });
    }
  }

  onModelLoad(): void {
    this.modelLoaded = true;
    setTimeout(() => this.adjustHotspots(), 300);
  }

  loadUserInfo(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        if (user) {
          this.userName = user.name || user.nombre || 'Usuario';
          this.userEmail = user.email || user.correo || '';
          this.userPhone = user.telefono || user.celular || '';
        }
        this.cargarFotoPerfil();
      },
      error: () => {
        this.cargarFotoPerfil();
      }
    });
  }

  cargarFotoPerfil(): void {
    this.userService.getUserProfile().subscribe({
      next: (data: any) => {
        if (data) {
          this.userAvatar = data.fotoUrl || data.fotoPerfil || data.foto || data.avatar || '';
          if (data.fechaRegistro || data.fechaCreacion || data.createdAt) {
            this.fechaIngreso = this.formatDate(data.fechaRegistro || data.fechaCreacion || data.createdAt);
          }
        }
        this.cargarHistorial();
      },
      error: () => {
        this.cargarHistorial();
      }
    });
  }

  cargarHistorial(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.getHistorialFisico().subscribe({
      next: (data: any) => {
        this.isLoading = false;

        let historialArray: any[] = [];
        if (Array.isArray(data)) {
          historialArray = data;
        } else if (data && typeof data === 'object') {
          historialArray = [data];
        }

        if (historialArray.length === 0) {
          this.historialCompleto = [];
          this.error = 'No se encontraron mediciones registradas.';
          return;
        }

        historialArray.sort((a, b) => {
          const fechaA = new Date(a.fechaMedicion).getTime();
          const fechaB = new Date(b.fechaMedicion).getTime();
          return fechaA - fechaB;
        });

        this.historialCompleto = historialArray;
        this.ultimaMedicion = this.historialCompleto[this.historialCompleto.length - 1];

        if (this.ultimaMedicion.nombreSocio) {
          this.userName = this.ultimaMedicion.nombreSocio;
        }

        if (this.ultimaMedicion.nombreRecepcionista) {
          this.entrenadorAsignado = this.ultimaMedicion.nombreRecepcionista;
        }

        if (this.fechaIngreso === 'No registrada' && this.historialCompleto[0]?.fechaMedicion) {
          this.fechaIngreso = this.formatDate(this.historialCompleto[0].fechaMedicion);
        }

        this.calcularComparacionGeneral();
        this.cargarMedidasSilueta(this.ultimaMedicion);
        this.cargarEvolucion();
      },
      error: (err: any) => {
        console.error('❌ Error al cargar historial:', err);
        this.isLoading = false;
        this.error = 'Error al cargar el historial físico. Por favor, intenta de nuevo.';
      }
    });
  }

  calcularComparacionGeneral(): void {
    if (this.historialCompleto.length === 0 || !this.ultimaMedicion) return;

    const primerRegistro = this.historialCompleto[0];
    this.comparacion = {
      peso: (this.ultimaMedicion.pesoKg || 0) - (primerRegistro.pesoKg || 0),
      grasa: (this.ultimaMedicion.porcentajeGrasa || 0) - (primerRegistro.porcentajeGrasa || 0),
      musculo: (this.ultimaMedicion.porcentajeMusculo || 0) - (primerRegistro.porcentajeMusculo || 0),
      cintura: (this.ultimaMedicion.cinturaCm || 0) - (primerRegistro.cinturaCm || 0)
    };
  }

  cargarMedidasSilueta(medicion: any): void {
    if (!medicion) return;
    this.medidasSilueta = {
      cuello: medicion.cuelloCm || 0,
      pecho: medicion.pechoCm || 0,
      cintura: medicion.cinturaCm || 0,
      cadera: medicion.caderaCm || 0,
      brazoIzq: medicion.brazoIzqCm || 0,
      brazoDer: medicion.brazoDerCm || 0,
      piernaIzq: medicion.piernaIzqCm || 0,
      piernaDer: medicion.piernaDerCm || 0
    };
  }

  cargarEvolucion(): void {
    this.userService.getEvolucion().subscribe({
      next: (data: any) => {
        if (data) {
          this.evolucionData = data;

          const totalPoints = data.evolucionPeso?.length || 0;
          if (totalPoints > 4) {
            const ratio = totalPoints / 4;
            this.chartWidthStyle = `${ratio * 100}%`;
          } else {
            this.chartWidthStyle = '100%';
          }

          this.ngZone.runOutsideAngular(() => {
            requestAnimationFrame(() => {
              this.renderChart();
              setTimeout(() => {
                if (this.chartScrollContainer) {
                  const el = this.chartScrollContainer.nativeElement;
                  el.scrollLeft = el.scrollWidth;
                }
              }, 100);
            });
          });
        }
      },
      error: (err: any) => {
        console.error('Error al cargar evolución:', err);
      }
    });
  }

  renderChart(): void {
    if (!this.chartCanvas || !this.evolucionData || !this.evolucionData.evolucionPeso) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const labels = this.evolucionData.evolucionPeso.map((item: any) =>
      new Date(item.fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    );

    const dataPeso = this.evolucionData.evolucionPeso.map((item: any) => item.valor);
    const dataGrasa = this.evolucionData.evolucionGrasa ? this.evolucionData.evolucionGrasa.map((item: any) => item.valor) : [];
    const dataMusculo = this.evolucionData.evolucionMusculo ? this.evolucionData.evolucionMusculo.map((item: any) => item.valor) : [];

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Peso (kg)',
            data: dataPeso,
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            yAxisID: 'yPeso',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#2563EB'
          },
          {
            label: 'Masa Muscular (%)',
            data: dataMusculo,
            borderColor: '#16A34A',
            backgroundColor: 'transparent',
            yAxisID: 'yPorcentaje',
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#16A34A'
          },
          {
            label: 'Grasa Corporal (%)',
            data: dataGrasa,
            borderColor: '#EF4444',
            backgroundColor: 'transparent',
            yAxisID: 'yPorcentaje',
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#EF4444'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20
            }
          }
        },
        scales: {
          yPeso: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Peso (Kg)' },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          yPorcentaje: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Porcentaje (%)' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  onHoverMeasure(key: string | null): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    if (this.isHovering && key === this.hoveredMeasure) {
      return;
    }

    this.isHovering = true;
    this.hoveredMeasure = key;

    if (this.modelViewer && this.modelLoaded) {
      const model = this.modelViewer.nativeElement;
      if (key) {
        this.updateHotspotColors(key);
        model.style.cursor = 'pointer';
      } else {
        this.resetHotspotColors();
        model.style.cursor = 'default';
      }
    }
  }

  onLeaveMeasure(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    this.hoverTimeout = setTimeout(() => {
      this.isHovering = false;
      this.hoveredMeasure = null;
      this.resetHotspotColors();
      this.hoverTimeout = null;
    }, 150);
  }

  updateHotspotColors(key: string): void {
    if (!this.modelViewer) return;
    const model = this.modelViewer.nativeElement;
    const hotspots = model.querySelectorAll('.hotspot');

    hotspots.forEach((hotspot: any) => {
      hotspot.style.transform = 'scale(1)';
      hotspot.style.boxShadow = '0 0 15px rgba(0,0,0,0.3)';

      if (hotspot.slot === 'hotspot-' + key) {
        hotspot.style.transform = 'scale(1.5)';
        hotspot.style.boxShadow = '0 0 30px rgba(255,255,255,0.8)';
      }
    });
  }

  resetHotspotColors(): void {
    if (!this.modelViewer) return;
    const model = this.modelViewer.nativeElement;
    const hotspots = model.querySelectorAll('.hotspot');

    hotspots.forEach((hotspot: any) => {
      hotspot.style.transform = 'scale(1)';
      hotspot.style.boxShadow = '0 0 15px rgba(0,0,0,0.3)';
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateFromApi(dateStr: string): string {
    return this.formatDate(dateStr);
  }

  getInitials(name?: string): string {
    if (!name) return 'PG';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  }

  onAvatarError(): void {
    this.avatarError = true;
  }

  hasAvatarError(): boolean {
    return this.avatarError;
  }

  volver(): void {
    this.router.navigate(['/user/profile']);
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}