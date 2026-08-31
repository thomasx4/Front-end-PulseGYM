import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-historial-fisico',
  templateUrl: './historial-fisico.component.html',
  styleUrls: ['./historial-fisico.component.scss']
})
export class HistorialFisicoComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  isLoading: boolean = true;
  error: string | null = null;

  userName: string = 'Usuario';
  userEmail: string = '';
  userPhone: string = '';
  userAvatar: string = '';
  estadoSocio: string = 'SOCIO ACTIVO';
  fechaIngreso: string = '';
  entrenadorAsignado: string = '';

  ultimaMedicion: any = {};
  historialCompleto: any[] = [];

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

  silueta: any = {
    troncoSuperior: {
      cuello: 0,
      escapular: 0,
      torax: 0,
      pecho: 0
    },
    zonaMedia: {
      cintura: 0,
      cadera: 0
    },
    brazos: {
      izquierdo: 0,
      derecho: 0
    },
    piernas: {
      izquierda: 0,
      derecha: 0,
      pantorrillaIzq: 0,
      pantorrillaDer: 0
    }
  };

  private chartInstance: any = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  ngAfterViewInit(): void {
    // El gráfico se inicializa después de cargar los datos
  }

  loadUserInfo(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        if (user) {
          this.userName = user.name || 'Usuario';
          this.userEmail = user.email || '';
          this.userPhone = (user as any).telefono || '';
        }
        // Cargar foto de perfil
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
          // Generar avatar con iniciales si no hay foto
          this.userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=0F1C3F&color=fff&bold=true`;
        }
        this.cargarHistorial();
      },
      error: () => {
        // Fallback a avatar con iniciales
        this.userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=0F1C3F&color=fff&bold=true`;
        this.cargarHistorial();
      }
    });
  }

  cargarHistorial(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.getHistorialFisico().subscribe({
      next: (data: any[]) => {
        console.log('Historial fisico:', data);

        if (data && data.length > 0) {
          this.historialCompleto = data;
          this.ultimaMedicion = data[data.length - 1];

          if (this.ultimaMedicion.nombreSocio) {
            this.userName = this.ultimaMedicion.nombreSocio;
            // Actualizar avatar si el nombre cambió
            if (!this.userAvatar || this.userAvatar.includes('ui-avatars.com')) {
              this.userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=0F1C3F&color=fff&bold=true`;
            }
          }

          if (this.ultimaMedicion.nombreRecepcionista) {
            this.entrenadorAsignado = this.ultimaMedicion.nombreRecepcionista;
          }

          if (data.length > 0 && data[0].fechaMedicion) {
            this.fechaIngreso = this.formatDate(data[0].fechaMedicion);
          }

          if (data.length > 1) {
            this.calcularComparacion(data[0], this.ultimaMedicion);
          }

          this.actualizarSilueta(this.ultimaMedicion);
        } else {
          this.error = 'No hay registros de historial físico disponibles.';
        }

        this.cargarEvolucion();
      },
      error: (err: any) => {
        console.error('Error al cargar historial:', err);
        this.cargarEvolucion();
      }
    });
  }

  cargarEvolucion(): void {
    this.userService.getEvolucion().subscribe({
      next: (data: any) => {
        console.log('Evolucion data:', data);

        if (data) {
          this.procesarEvolucion(data);
          
          setTimeout(() => {
            this.initChart();
          }, 300);
        }
        
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar evolucion:', err);
        this.isLoading = false;
      }
    });
  }

  procesarEvolucion(data: any): void {
    if (data.evolucionPeso && data.evolucionPeso.length > 0) {
      data.evolucionPeso.forEach((item: any) => {
        const fecha = this.formatDate(item.fecha);
        if (!this.evolucionData.fechas.includes(fecha)) {
          this.evolucionData.fechas.push(fecha);
        }
      });
    }

    const fechasMap = new Map();
    
    if (data.evolucionPeso) {
      data.evolucionPeso.forEach((item: any) => {
        const fecha = this.formatDate(item.fecha);
        if (!fechasMap.has(fecha)) {
          fechasMap.set(fecha, { peso: null, grasa: null, musculo: null });
        }
        fechasMap.get(fecha).peso = item.valor;
      });
    }

    if (data.evolucionGrasa) {
      data.evolucionGrasa.forEach((item: any) => {
        const fecha = this.formatDate(item.fecha);
        if (!fechasMap.has(fecha)) {
          fechasMap.set(fecha, { peso: null, grasa: null, musculo: null });
        }
        fechasMap.get(fecha).grasa = item.valor;
      });
    }

    if (data.evolucionMusculo) {
      data.evolucionMusculo.forEach((item: any) => {
        const fecha = this.formatDate(item.fecha);
        if (!fechasMap.has(fecha)) {
          fechasMap.set(fecha, { peso: null, grasa: null, musculo: null });
        }
        fechasMap.get(fecha).musculo = item.valor;
      });
    }

    const sortedFechas = Array.from(fechasMap.keys()).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    this.evolucionData.fechas = sortedFechas;
    this.evolucionData.peso = sortedFechas.map((f: string) => fechasMap.get(f)?.peso ?? null);
    this.evolucionData.grasa = sortedFechas.map((f: string) => fechasMap.get(f)?.grasa ?? null);
    this.evolucionData.musculo = sortedFechas.map((f: string) => fechasMap.get(f)?.musculo ?? null);
  }

  initChart(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const fechas = this.evolucionData.fechas;
    const pesoData = this.evolucionData.peso;
    const grasaData = this.evolucionData.grasa;
    const musculoData = this.evolucionData.musculo;

    const hasData = pesoData.some((v: number | null) => v !== null) || 
                    grasaData.some((v: number | null) => v !== null) || 
                    musculoData.some((v: number | null) => v !== null);

    if (!hasData || fechas.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos suficientes para mostrar la evolución', canvas.width / 2, canvas.height / 2);
      return;
    }

    import('chart.js/auto').then((ChartJS) => {
      const Chart = ChartJS.default;

      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: fechas,
          datasets: [
            {
              label: 'Peso (kg)',
              data: pesoData,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#2563eb'
            },
            {
              label: 'Grasa Corporal (%)',
              data: grasaData,
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#dc2626'
            },
            {
              label: 'Masa Muscular (%)',
              data: musculoData,
              borderColor: '#059669',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#059669'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  weight: 500
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  let label = context.dataset.label || '';
                  let value = context.parsed.y;
                  if (value !== null && value !== undefined) {
                    label += ': ' + value.toFixed(2);
                    if (context.dataset.label?.includes('Peso')) {
                      label += ' kg';
                    } else {
                      label += ' %';
                    }
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0,0,0,0.05)'
              }
            }
          }
        }
      });
    }).catch((error: any) => {
      console.error('Error loading Chart.js:', error);
    });
  }

  actualizarSilueta(medicion: any): void {
    this.silueta.troncoSuperior = {
      cuello: medicion.cuelloCm || 0,
      escapular: medicion.cinturaEscapularCm || 0,
      torax: medicion.toraxCm || 0,
      pecho: medicion.pechoCm || 0
    };

    this.silueta.zonaMedia = {
      cintura: medicion.cinturaCm || 0,
      cadera: medicion.caderaCm || 0
    };

    this.silueta.brazos = {
      izquierdo: medicion.brazoIzqCm || 0,
      derecho: medicion.brazoDerCm || 0
    };

    this.silueta.piernas = {
      izquierda: medicion.piernaIzqCm || 0,
      derecha: medicion.piernaDerCm || 0,
      pantorrillaIzq: medicion.pantorrillaIzqCm || 0,
      pantorrillaDer: medicion.pantorrillaDerCm || 0
    };
  }

  calcularComparacion(primera: any, ultima: any): void {
    if (!primera || !ultima) return;

    const diffPeso = (ultima.pesoKg - primera.pesoKg);
    const diffGrasa = (ultima.porcentajeGrasa - primera.porcentajeGrasa);
    const diffMusculo = (ultima.porcentajeMusculo - primera.porcentajeMusculo);
    const diffCintura = (ultima.cinturaCm - primera.cinturaCm);

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
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  formatDateFromApi(dateStr: string): string {
    return this.formatDate(dateStr);
  }

  actualizarMedicion(): void {
    console.log('Abrir modal/vista de actualización');
  }

  volver(): void {
    this.router.navigate(['/user/profile']);
  }

  refreshData(): void {
    this.cargarHistorial();
  }

  onSearch(query: string): void {
    console.log('Busqueda:', query);
  }
}