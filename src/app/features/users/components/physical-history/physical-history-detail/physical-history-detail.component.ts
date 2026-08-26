import { Component, OnInit, ElementRef, ViewChild, OnDestroy, NgZone, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PhysicalHistoryService } from '../../../../../core/services/physical-history.service';
import { PhysicalHistory } from '../../../../../core/models/physical-history';
import { Chart, registerables } from 'chart.js';

// Importar model-viewer
import '@google/model-viewer';

Chart.register(...registerables);

@Component({
  selector: 'app-physical-history-detail',
  templateUrl: './physical-history-detail.component.html',
  styleUrls: ['./physical-history-detail.component.scss']
})
export class PhysicalHistoryDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('modelViewer') modelViewer!: ElementRef;
  chartInstance: Chart | null = null;

  record: PhysicalHistory | null = null;
  socioHistory: PhysicalHistory[] = [];
  idHistorial: number | null = null;
  loading: boolean = false;
  errorMensaje: string = '';

  selectedTimeframe: string = '6M';

  medidasSilueta = {
    pecho: 0,
    cintura: 0,
    brazoIzq: 0,
    brazoDer: 0,
    piernaIzq: 0,
    piernaDer: 0
  };

  hoveredMeasure: string | null = null;
  private hoverTimeout: any = null;
  private isHovering: boolean = false;

  // Para el modelo 3D
  modelLoaded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private physicalHistoryService: PhysicalHistoryService,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.idHistorial = +params['id'];
        this.loadDetail(this.idHistorial);
      }
    });
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
        console.log('✅ Modelo 3D cargado correctamente');
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

  loadDetail(id: number): void {
    this.loading = true;
    this.physicalHistoryService.getAll().subscribe({
      next: (records) => {
        const found = records.find(r => r.idHistorialFisico === id);
        if (found) {
          this.record = found;
          this.socioHistory = records
            .filter(r => r.idSocio === found.idSocio)
            .sort((a, b) => new Date(a.fechaMedicion).getTime() - new Date(b.fechaMedicion).getTime());

          this.cargarMedidasSilueta(found);
          
          this.ngZone.runOutsideAngular(() => {
            requestAnimationFrame(() => this.renderChart());
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  cargarMedidasSilueta(record: PhysicalHistory): void {
    this.medidasSilueta = {
      pecho: record.pechoCm || 0,
      cintura: record.cinturaCm || 0,
      brazoIzq: record.brazoIzqCm || 0,
      brazoDer: record.brazoDerCm || 0,
      piernaIzq: record.piernaIzqCm || 0,
      piernaDer: record.piernaDerCm || 0
    };
  }

  setTimeframe(tf: string): void {
    this.selectedTimeframe = tf;
    this.ngZone.runOutsideAngular(() => {
      this.renderChart();
    });
  }

  renderChart(): void {
    if (!this.chartCanvas || !this.socioHistory.length) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    let filtered = [...this.socioHistory];
    const labels = filtered.map(item =>
      new Date(item.fechaMedicion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    );

    const dataPeso = filtered.map(item => item.pesoKg);
    const dataGrasa = filtered.map(item => item.porcentajeGrasa);
    const dataMusculo = filtered.map(item => item.porcentajeMusculo);

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

  // ============================================
  // INTERACCIÓN SILUETA 3D
  // ============================================
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

  getMeasureLabel(key: string): string {
    const labels: { [key: string]: string } = {
      pecho: 'Pecho',
      brazoIzq: 'Brazo Izquierdo',
      brazoDer: 'Brazo Derecho',
      cintura: 'Cintura',
      piernaIzq: 'Pierna Izquierda',
      piernaDer: 'Pierna Derecha'
    };
    return labels[key] || key;
  }

  getInitials(name?: string): string {
    if (!name) return 'PG';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  }

  onBack(): void {
    this.router.navigate(['/dashboard-admin/users/physical-history']);
  }

  onNewMedicion(): void {
    this.router.navigate(['/dashboard-admin/users/physical-history/new']);
  }

  onEdit(): void {
    if (this.idHistorial) {
      this.router.navigate(['/dashboard-admin/users/physical-history/edit', this.idHistorial]);
    }
  }

  onModelLoad(): void {
    this.modelLoaded = true;
    console.log('✅ Modelo 3D cargado correctamente');
    setTimeout(() => this.adjustHotspots(), 300);
  }
}