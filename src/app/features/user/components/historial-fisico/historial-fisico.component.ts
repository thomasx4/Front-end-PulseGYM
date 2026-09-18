import { Component, OnInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';

import '@google/model-viewer';

@Component({
  selector: 'app-historial-fisico',
  templateUrl: './historial-fisico.component.html',
  styleUrls: ['./historial-fisico.component.scss'],
})
export class HistorialFisicoComponent implements OnInit {
  @ViewChild('chartScrollContainer') chartScrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('modelViewer') modelViewer!: ElementRef;

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
    fechas: [],
    peso: [],
    grasa: [],
    musculo: []
  };

  comparacion: any = {
    peso: '0.00 kg',
    grasa: '0.00 %',
    musculo: '0.00 %',
    cintura: '0.00 cm'
  };

  medidasSilueta = {
    cuello: null as number | null,
    cinturaEscapular: null as number | null,
    torax: null as number | null,
    pecho: null as number | null,
    cintura: null as number | null,
    cadera: null as number | null,
    brazoIzq: null as number | null,
    brazoDer: null as number | null,
    piernaIzq: null as number | null,
    piernaDer: null as number | null,
    pantorrillaIzq: null as number | null,
    pantorrillaDer: null as number | null
  };

  private chartInstance: any = null;
  modelLoaded: boolean = false;
  hoveredMeasure: string | null = null;
  private hoverTimeout: any = null;
  private isHovering: boolean = false;

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

  loadUserInfo(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        if (user) {
          this.userName = user.name || 'Usuario';
          this.userEmail = user.email || '';
          this.userPhone = (user as any).telefono || '';
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
        if (data && data.fotoUrl) {
          this.userAvatar = data.fotoUrl;
        } else {
          this.userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=0F1C3F&color=fff&bold=true`;
        }

        if (data && data.fechaRegistro) {
          this.fechaIngreso = this.formatDate(data.fechaRegistro);
        } else {
          this.fechaIngreso = 'No registrada';
        }

        this.cargarHistorial();
      },
      error: () => {
        this.userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=0F1C3F&color=fff&bold=true`;
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
        console.log('Data recibida en cargarHistorial:', data);

        let historialArray: any[] = [];
        if (Array.isArray(data)) {
          historialArray = data;
        } else if (data && typeof data === 'object') {
          historialArray = [data];
        }

        if (historialArray.length === 0) {
          this.historialCompleto = [];
          this.error = null;
          return;
        }

        let historialMapeado = historialArray.map((item: any) => ({
          ...item,
          pesoKg: item.pesoKg ?? item.peso ?? 0,
          alturaCm: item.alturaCm ?? item.altura ?? 0,
          porcentajeGrasa: item.porcentajeGrasa ?? item.grasa ?? 0,
          porcentajeMusculo: item.porcentajeMusculo ?? item.musculo ?? 0,
          cinturaCm: item.cinturaCm ?? item.cintura ?? 0,
          cuelloCm: item.cuelloCm ?? item.cuello ?? null,
          cinturaEscapularCm: item.cinturaEscapularCm ?? item.cinturaEscapular ?? null,
          toraxCm: item.toraxCm ?? item.torax ?? null,
          pechoCm: item.pechoCm ?? item.pecho ?? 0,
          caderaCm: item.caderaCm ?? item.cadera ?? null,
          brazoIzqCm: item.brazoIzqCm ?? item.brazoIzq ?? 0,
          brazoDerCm: item.brazoDerCm ?? item.brazoDer ?? 0,
          piernaIzqCm: item.piernaIzqCm ?? item.piernaIzq ?? 0,
          piernaDerCm: item.piernaDerCm ?? item.piernaDer ?? 0,
          pantorrillaIzqCm: item.pantorrillaIzqCm ?? item.pantorrillaIzq ?? null,
          pantorrillaDerCm: item.pantorrillaDerCm ?? item.pantorrillaDer ?? null,
        }));

        historialMapeado.sort((a, b) => {
          const fechaA = new Date(a.fechaMedicion).getTime();
          const fechaB = new Date(b.fechaMedicion).getTime();
          return fechaA - fechaB;
        });

        this.historialCompleto = historialMapeado;

        this.ultimaMedicion = this.historialCompleto[this.historialCompleto.length - 1];

        console.log('📊 Ultima medición (más reciente):', this.ultimaMedicion);
        console.log('📊 Primera medición (más antigua):', this.historialCompleto[0]);

        if (!this.ultimaMedicion) {
          this.error = 'No se encontraron mediciones registradas.';
          return;
        }

        if (this.ultimaMedicion.nombreSocio) {
          this.userName = this.ultimaMedicion.nombreSocio;
        }

        if (this.ultimaMedicion.nombreRecepcionista) {
          this.entrenadorAsignado = this.ultimaMedicion.nombreRecepcionista;
        }

        if (this.fechaIngreso === 'No registrada') {
          if (this.historialCompleto.length > 0 && this.historialCompleto[0].fechaMedicion) {
            this.fechaIngreso = this.formatDate(this.historialCompleto[0].fechaMedicion);
          }
        }

        if (this.historialCompleto.length > 1) {
          this.calcularComparacion(this.historialCompleto[0], this.ultimaMedicion);
        } else {
          this.comparacion = {
            peso: '0.00 kg',
            grasa: '0.00 %',
            musculo: '0.00 %',
            cintura: '0.00 cm'
          };
        }

        this.cargarMedidasSilueta(this.ultimaMedicion);
        this.cargarEvolucion();
      },
      error: (err: any) => {
        console.error('❌ Error al cargar historial:', err);
        this.isLoading = false;
        this.historialCompleto = [];
        this.error = 'Error al cargar el historial físico. Por favor, intenta de nuevo.';
      }
    });
  }

  cargarMedidasSilueta(medicion: any): void {
    if (!medicion) return;
    this.medidasSilueta = {
      cuello: medicion.cuelloCm ?? null,
      cinturaEscapular: medicion.cinturaEscapularCm ?? null,
      torax: medicion.toraxCm ?? null,
      pecho: medicion.pechoCm ?? null,
      cintura: medicion.cinturaCm ?? null,
      cadera: medicion.caderaCm ?? null,
      brazoIzq: medicion.brazoIzqCm ?? null,
      brazoDer: medicion.brazoDerCm ?? null,
      piernaIzq: medicion.piernaIzqCm ?? null,
      piernaDer: medicion.piernaDerCm ?? null,
      pantorrillaIzq: medicion.pantorrillaIzqCm ?? null,
      pantorrillaDer: medicion.pantorrillaDerCm ?? null
    };
  }

  cargarEvolucion(): void {
    if (!this.historialCompleto.length) {
      this.isLoading = false;
      return;
    }

    this.userService.getEvolucion().subscribe({
      next: (data: any) => {
        if (data) {
          this.procesarEvolucion(data);

          const totalPoints = data.evolucionPeso?.length || 0;
          if (totalPoints > 4) {
            const ratio = totalPoints / 4;
            this.chartWidthStyle = `${ratio * 100}%`;
          } else {
            this.chartWidthStyle = '100%';
          }

          this.ngZone.runOutsideAngular(() => {
            requestAnimationFrame(() => {
              this.initChart();
              setTimeout(() => {
                if (this.chartScrollContainer) {
                  const el = this.chartScrollContainer.nativeElement;
                  el.scrollLeft = el.scrollWidth;
                }
              }, 100);
            });
          });
        } else {
          this.isLoading = false;
        }
      },
      error: (err: any) => {
        console.error('Error al cargar evolucion:', err);
        this.isLoading = false;
      }
    });
  }

  procesarEvolucion(data: any): void {
    if (!data) {
      data = { evolucionPeso: [], evolucionGrasa: [], evolucionMusculo: [] };
    }

    this.evolucionData = { fechas: [], peso: [], grasa: [], musculo: [] };

    const allDates = new Set<string>();

    if (data.evolucionPeso && Array.isArray(data.evolucionPeso)) {
      data.evolucionPeso.forEach((item: any) => allDates.add(item.fecha));
    }
    if (data.evolucionGrasa && Array.isArray(data.evolucionGrasa)) {
      data.evolucionGrasa.forEach((item: any) => allDates.add(item.fecha));
    }
    if (data.evolucionMusculo && Array.isArray(data.evolucionMusculo)) {
      data.evolucionMusculo.forEach((item: any) => allDates.add(item.fecha));
    }

    const sortedDates = Array.from(allDates).sort();

    const pesoMap = new Map();
    const grasaMap = new Map();
    const musculoMap = new Map();

    if (data.evolucionPeso) {
      data.evolucionPeso.forEach((item: any) => pesoMap.set(item.fecha, item.valor));
    }
    if (data.evolucionGrasa) {
      data.evolucionGrasa.forEach((item: any) => grasaMap.set(item.fecha, item.valor));
    }
    if (data.evolucionMusculo) {
      data.evolucionMusculo.forEach((item: any) => musculoMap.set(item.fecha, item.valor));
    }

    const fechasFormateadas: string[] = [];
    const pesoData: (number | null)[] = [];
    const grasaData: (number | null)[] = [];
    const musculoData: (number | null)[] = [];

    sortedDates.forEach((fecha: string) => {
      const dateObj = new Date(fecha);
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString('es', { month: 'short' });
      fechasFormateadas.push(`${day} ${month}`);

      pesoData.push(pesoMap.has(fecha) ? pesoMap.get(fecha) : null);
      grasaData.push(grasaMap.has(fecha) ? grasaMap.get(fecha) : null);
      musculoData.push(musculoMap.has(fecha) ? musculoMap.get(fecha) : null);
    });

    this.evolucionData.fechas = fechasFormateadas;
    this.evolucionData.peso = pesoData;
    this.evolucionData.grasa = grasaData;
    this.evolucionData.musculo = musculoData;
  }

  initChart(): void {
    const canvas = document.getElementById('evolucionChart') as HTMLCanvasElement;
    if (!canvas) {
      setTimeout(() => {
        const canvasRetry = document.getElementById('evolucionChart') as HTMLCanvasElement;
        if (canvasRetry) {
          this.crearGrafico(canvasRetry);
        } else {
          this.isLoading = false;
        }
      }, 300);
      return;
    }
    this.crearGrafico(canvas);
  }

  crearGrafico(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.isLoading = false;
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const labels = this.evolucionData.fechas;
    const pesoData = this.evolucionData.peso;
    const grasaData = this.evolucionData.grasa;
    const musculoData = this.evolucionData.musculo;

    import('chart.js/auto').then((ChartJS) => {
      const Chart = ChartJS.default;

      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Peso (kg)',
              data: pesoData,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              yAxisID: 'yPeso',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#2563eb',
              spanGaps: false
            },
            {
              label: 'Masa Muscular (%)',
              data: musculoData,
              borderColor: '#059669',
              backgroundColor: 'transparent',
              yAxisID: 'yPorcentaje',
              tension: 0.3,
              fill: false,
              pointRadius: 4,
              pointBackgroundColor: '#059669',
              spanGaps: false
            },
            {
              label: 'Grasa Corporal (%)',
              data: grasaData,
              borderColor: '#dc2626',
              backgroundColor: 'transparent',
              yAxisID: 'yPorcentaje',
              tension: 0.3,
              fill: false,
              pointRadius: 4,
              pointBackgroundColor: '#dc2626',
              spanGaps: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20,
                font: { size: 12, weight: 500 }
              }
            }
          },
          scales: {
            x: { grid: { display: true, color: 'rgba(0,0,0,0.05)' } },
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

      this.isLoading = false;
    }).catch((error: any) => {
      console.error('Error cargando Chart.js:', error);
      this.isLoading = false;
    });
  }

  calcularComparacion(primera: any, ultima: any): void {
    if (!primera || !ultima) return;

    const diffPeso = (ultima.pesoKg || 0) - (primera.pesoKg || 0);
    const diffGrasa = (ultima.porcentajeGrasa || 0) - (primera.porcentajeGrasa || 0);
    const diffMusculo = (ultima.porcentajeMusculo || 0) - (primera.porcentajeMusculo || 0);
    const diffCintura = (ultima.cinturaCm || 0) - (primera.cinturaCm || 0);

    this.comparacion = {
      peso: (diffPeso > 0 ? '+' : '') + diffPeso.toFixed(2) + ' kg',
      grasa: (diffGrasa > 0 ? '+' : '') + diffGrasa.toFixed(2) + ' %',
      musculo: (diffMusculo > 0 ? '+' : '') + diffMusculo.toFixed(2) + ' %',
      cintura: (diffCintura > 0 ? '+' : '') + diffCintura.toFixed(2) + ' cm'
    };
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatDateFromApi(dateStr: string): string {
    return this.formatDate(dateStr);
  }

  volver(): void {
    this.router.navigate(['/user/profile']);
  }

  recargarDatos(): void {
    this.error = null;
    this.cargarHistorial();
  }
}