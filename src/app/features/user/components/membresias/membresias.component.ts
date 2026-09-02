import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../core/services/users.service';

export interface Membresia {
  id: number;
  nombre: string;
  precio: number;
  descripcion: string;
  beneficios: string[];
  esFlexible: boolean;
  incluyeIA: boolean;
  duracionDescripcion: string;
  tipoDuracion: string;
  precioPorDia: number;
  restricciones: string;
  esActual: boolean;
}

@Component({
  selector: 'app-membresias',
  templateUrl: './membresias.component.html',
  styleUrls: ['./membresias.component.scss']
})
export class MembresiasComponent implements OnInit {
  isLoading: boolean = true;
  error: string | null = null;

  membresiaActual: Membresia | null = null;
  membresias: Membresia[] = [];
  membresiasFiltradas: Membresia[] = [];
  membresiasPaginadas: Membresia[] = [];
  vistaActual: 'listado' | 'detalle' = 'listado';
  membresiaSeleccionada: Membresia | null = null;
  mostrarModalCambio: boolean = false;

  // Paginación LOCAL
  paginaActual: number = 1;
  itemsPorPagina: number = 6;
  totalPaginas: number = 0;
  totalElementos: number = 0;

  mostrarModalError: boolean = false;
  modalErrorMessage: string = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.cargarMembresias();
  }

  cargarMembresias(): void {
    this.isLoading = true;
    this.error = null;

    // Cargar membresía activa del usuario
    this.userService.getMiMembresiaActiva().subscribe({
      next: (data: any) => {
        if (data) {
          this.membresiaActual = this.mapearMembresia(data, true);
          console.log('Membresía activa cargada:', this.membresiaActual);
        }
      },
      error: (err: any) => {
        console.error('Error al cargar membresía activa:', err);
      }
    });

    // Cargar TODAS las membresías (array directo)
    this.userService.getMembresias().subscribe({
      next: (data: any[]) => {
        console.log('Membresías recibidas (array):', data);

        if (data && data.length > 0) {
          // Mapear todas las membresías
          this.membresias = data.map((item: any) => this.mapearMembresia(item, false));
          
          // Marcar la membresía actual
          if (this.membresiaActual) {
            this.membresias = this.membresias.map((m: Membresia) => ({
              ...m,
              esActual: m.id === this.membresiaActual?.id
            }));
          }

          // Filtrar para no mostrar la membresía actual en el grid
          this.membresiasFiltradas = this.membresias.filter((m: Membresia) => !m.esActual);
          
          // Configurar paginación LOCAL
          this.totalElementos = this.membresiasFiltradas.length;
          this.totalPaginas = Math.ceil(this.totalElementos / this.itemsPorPagina);
          this.paginaActual = 1;
          this.actualizarPaginacion();
          
          console.log('Membresías totales:', this.membresias);
          console.log('Membresías filtradas:', this.membresiasFiltradas);
          console.log('Páginas:', this.totalPaginas);
        } else {
          this.membresiasFiltradas = [];
          this.membresiasPaginadas = [];
          this.totalElementos = 0;
          this.totalPaginas = 0;
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar membresías:', err);
        this.isLoading = false;
        this.mostrarModalError = true;
        
        if (err.status === 401) {
          this.modalErrorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (err.status === 530 || err.status === 503) {
          this.modalErrorMessage = 'El servidor no está disponible en este momento. Por favor, intenta más tarde.';
        } else {
          this.modalErrorMessage = 'Ocurrió un error al cargar las membresías. Por favor, recarga la página o intenta más tarde.';
        }
      }
    });
  }

  mapearMembresia(data: any, esActual: boolean): Membresia {
    const beneficiosList: string[] = [];
    if (data.beneficios) {
      beneficiosList.push(data.beneficios);
    }
    if (data.esFlexible) {
      beneficiosList.push('Flexible - Sin permanencia');
    }
    if (data.incluyeIA) {
      beneficiosList.push('Incluye asesoría con IA');
    }
    if (data.restricciones && data.restricciones !== 'No acumulable') {
      beneficiosList.push(`Restricciones: ${data.restricciones}`);
    }
    if (beneficiosList.length === 0) {
      beneficiosList.push(`Acceso por ${data.duracionDescripcion || 'un período'}`);
    }

    return {
      id: data.idMembresia || data.id || 0,
      nombre: data.nombre || 'Membresía',
      precio: data.precioTotal || data.precio || 0,
      descripcion: data.beneficios || `Acceso por ${data.duracionDescripcion || 'un período'}`,
      beneficios: beneficiosList,
      esFlexible: data.esFlexible || false,
      incluyeIA: data.incluyeIA || false,
      duracionDescripcion: data.duracionDescripcion || `${data.cantidad || 1} ${data.tipoDuracion || 'mes'}`,
      tipoDuracion: data.tipoDuracion || 'MES',
      precioPorDia: data.precioPorDia || 0,
      restricciones: data.restricciones || 'Sin restricciones',
      esActual: esActual
    };
  }

  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.membresiasPaginadas = this.membresiasFiltradas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarPaginacion();
    document.querySelector('.planes-grid')?.scrollIntoView({ behavior: 'smooth' });
  }

  verDetalle(membresia: Membresia): void {
    this.membresiaSeleccionada = membresia;
    this.vistaActual = 'detalle';
  }

  volverAlListado(): void {
    this.vistaActual = 'listado';
    this.membresiaSeleccionada = null;
  }

  cambiarMembresia(): void {
    this.mostrarModalCambio = true;
  }

  cerrarModal(): void {
    this.mostrarModalCambio = false;
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
  }

  recargarDatos(): void {
    this.mostrarModalError = false;
    this.cargarMembresias();
  }

  irARecepcion(): void {
    this.cerrarModal();
    alert('Por favor, acércate a recepción para realizar el cambio de membresía. Nuestro equipo estará encantado de ayudarte.');
  }

  refrescarDatos(): void {
    this.cargarMembresias();
  }

  onSearch(query: string): void {
    console.log('Búsqueda:', query);
  }

  get paginasDisponibles(): number[] {
    const paginas: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  get hayPaginas(): boolean {
    return this.totalPaginas > 1;
  }
}