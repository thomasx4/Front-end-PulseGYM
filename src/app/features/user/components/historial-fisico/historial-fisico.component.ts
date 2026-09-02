import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-historial-fisico',
  templateUrl: './historial-fisico.component.html',
  styleUrls: ['./historial-fisico.component.scss']
})
export class HistorialFisicoComponent implements OnInit {
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

  // Modal de error
  mostrarModalError: boolean = false;
  modalErrorMessage: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
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
    this.modalErrorMessage = '';

    this.userService.getHistorialFisico().subscribe({
      next: (data: any[]) => {
        this.isLoading = false;
        
        if (data && data.length > 0) {
          this.historialCompleto = data;
          this.ultimaMedicion = data[data.length - 1];

          if (this.ultimaMedicion.nombreSocio) {
            this.userName = this.ultimaMedicion.nombreSocio;
          }

          if (this.ultimaMedicion.nombreRecepcionista) {
            this.entrenadorAsignado = this.ultimaMedicion.nombreRecepcionista;
          }

          if (this.fechaIngreso === 'No registrada') {
            if (data.length > 0 && data[0].fechaMedicion) {
              this.fechaIngreso = this.formatDate(data[0].fechaMedicion);
            }
          }

          if (data.length > 1) {
            this.calcularComparacion(data[0], this.ultimaMedicion);
          } else {
            this.comparacion = {
              peso: '0.00 kg',
              grasa: '0.00 %',
              musculo: '0.00 %',
              cintura: '0.00 cm'
            };
          }

          this.actualizarSilueta(this.ultimaMedicion);
          this.cargarEvolucion();
        } else {
          // No hay datos, pero no es un error
          this.historialCompleto = [];
          this.error = null;
          this.isLoading = false;
        }
      },
      error: (err: any) => {
        console.error('Error al cargar historial:', err);
        this.isLoading = false;
        this.historialCompleto = [];
        this.error = 'Error al cargar el historial físico. Por favor, intenta de nuevo.';
      }
    });
  }

  cargarEvolucion(): void {
    // Solo cargar evolución si hay datos
    if (!this.historialCompleto.length) {
      this.isLoading = false;
      return;
    }

    this.userService.getEvolucion().subscribe({
      next: (data: any) => {
        if (data) {
          this.procesarEvolucion(data);
          setTimeout(() => {
            this.initChart();
          }, 600);
        } else {
          this.isLoading = false;
        }
      },
      error: (err: any) => {
        console.error('Error al cargar evolucion:', err);
        this.isLoading = false;
        // No mostramos error aquí para no bloquear la vista
      }
    });
  }

  procesarEvolucion(data: any): void {
    this.evolucionData = {
      fechas: [],
      peso: [],
      grasa: [],
      musculo: []
    };

    const allDates = new Set<string>();
    
    if (data.evolucionPeso) {
      data.evolucionPeso.forEach((item: any) => {
        allDates.add(item.fecha);
      });
    }
    if (data.evolucionGrasa) {
      data.evolucionGrasa.forEach((item: any) => {
        allDates.add(item.fecha);
      });
    }
    if (data.evolucionMusculo) {
      data.evolucionMusculo.forEach((item: any) => {
        allDates.add(item.fecha);
      });
    }

    const sortedDates = Array.from(allDates).sort();

    const pesoMap = new Map();
    const grasaMap = new Map();
    const musculoMap = new Map();

    if (data.evolucionPeso) {
      data.evolucionPeso.forEach((item: any) => {
        pesoMap.set(item.fecha, item.valor);
      });
    }
    if (data.evolucionGrasa) {
      data.evolucionGrasa.forEach((item: any) => {
        grasaMap.set(item.fecha, item.valor);
      });
    }
    if (data.evolucionMusculo) {
      data.evolucionMusculo.forEach((item: any) => {
        musculoMap.set(item.fecha, item.valor);
      });
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
    const parent = canvas.parentElement;
    if (parent) {
      const width = parent.clientWidth || 800;
      canvas.width = width;
      canvas.height = 260;
      canvas.style.width = '100%';
      canvas.style.height = '260px';
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.isLoading = false;
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const fechas = this.evolucionData.fechas;
    const pesoData = this.evolucionData.peso;
    const grasaData = this.evolucionData.grasa;
    const musculoData = this.evolucionData.musculo;

    const hasData = pesoData.some((v: number | null) => v !== null) ||
      grasaData.some((v: number | null) => v !== null) ||
      musculoData.some((v: number | null) => v !== null);

    if (!hasData || fechas.length < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      const msg = fechas.length < 2 ? 'Se necesita al menos 2 mediciones para mostrar evolución' : 'No hay datos suficientes para mostrar la evolución';
      ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
      this.isLoading = false;
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
              pointBackgroundColor: '#2563eb',
              spanGaps: false
            },
            {
              label: 'Grasa Corporal (%)',
              data: grasaData,
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#dc2626',
              spanGaps: false
            },
            {
              label: 'Masa Muscular (%)',
              data: musculoData,
              borderColor: '#059669',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#059669',
              spanGaps: false
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
                label: function (context: any) {
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

      this.isLoading = false;
    }).catch((error: any) => {
      console.error('Error cargando Chart.js:', error);
      this.isLoading = false;
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

  volver(): void {
    this.router.navigate(['/user/profile']);
  }

  refreshData(): void {
    this.cargarHistorial();
  }

  onSearch(query: string): void {
    console.log('Busqueda:', query);
  }

  mostrarErrorModal(mensaje: string): void {
    this.modalErrorMessage = mensaje;
    this.mostrarModalError = true;
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
  }

  recargarDatos(): void {
    this.mostrarModalError = false;
    this.error = null;
    this.cargarHistorial();
  }
}