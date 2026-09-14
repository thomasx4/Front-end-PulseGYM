import { Component, OnInit } from '@angular/core';
import { UserService, Equipo } from '../../../../core/services/users.service';

@Component({
  selector: 'app-equipos',
  templateUrl: './equipos.component.html',
  styleUrls: ['./equipos.component.scss']
})
export class EquiposComponent implements OnInit {

  public isLoading: boolean = true;
  public error: string | null = null;

  public equipos: Equipo[] = [];
  public equiposFiltrados: Equipo[] = [];

  // Búsqueda y filtros
  public busqueda: string = '';
  public filtroEstado: string = 'todos';

  // Contadores
  public totalEquipos: number = 0;
  public totalOperativos: number = 0;
  public totalMantenimiento: number = 0;
  public totalFueraServicio: number = 0;

  // Modal
  public showErrorModal: boolean = false;
  public modalErrorMessage: string = '';

  public estadosDisponibles = [
    { value: 'todos', label: 'Todos' },
    { value: 'OPERATIVO', label: 'Operativos' },
    { value: 'MANTENIMIENTO', label: 'En mantenimiento' },
    { value: 'FUERA DE SERVICIO', label: 'Fuera de servicio' }
  ];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.cargarEquipos();
  }

  // ==========================================
  // Cargar equipos
  // ==========================================
  cargarEquipos(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.getEquipos().subscribe({
      next: (response: any) => {
        console.log('Equipos recibidos:', response);

        // El backend devuelve { data: [...], success, count, message }
        let listaEquipos: Equipo[] = [];

        if (response && Array.isArray(response.data)) {
          listaEquipos = response.data;
        } else if (Array.isArray(response)) {
          listaEquipos = response;
        }

        this.equipos = listaEquipos;
        this.calcularContadores();
        this.aplicarFiltros();

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar equipos:', err);
        this.isLoading = false;

        if (err.status === 401) {
          this.modalErrorMessage = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
        } else if (err.status === 530 || err.status === 503) {
          this.modalErrorMessage = 'El servidor no está disponible en este momento. Intenta más tarde.';
        } else {
          this.modalErrorMessage = 'Ocurrió un error al cargar los equipos.';
        }

        this.showErrorModal = true;
      }
    });
  }

  // ==========================================
  // Contadores
  // ==========================================
  private calcularContadores(): void {
    this.totalEquipos = this.equipos.length;
    this.totalOperativos = this.equipos.filter(e => e.estado === 'OPERATIVO').length;
    this.totalMantenimiento = this.equipos.filter(e => e.estado === 'MANTENIMIENTO').length;
    this.totalFueraServicio = this.equipos.filter(e => e.estado === 'FUERA DE SERVICIO').length;
  }

  // ==========================================
  // Filtros
  // ==========================================
  aplicarFiltros(): void {
    let filtrados = [...this.equipos];

    if (this.filtroEstado !== 'todos') {
      filtrados = filtrados.filter(e => e.estado === this.filtroEstado);
    }

    if (this.busqueda && this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(e =>
        e.nombre.toLowerCase().includes(q) ||
        e.id.toString().includes(q)
      );
    }

    this.equiposFiltrados = filtrados;
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onFiltroEstadoChange(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = 'todos';
    this.aplicarFiltros();
  }

  // ==========================================
  // Helpers
  // ==========================================
  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'OPERATIVO': 'Operativo',
      'MANTENIMIENTO': 'Mantenimiento',
      'FUERA DE SERVICIO': 'Fuera de servicio'
    };
    return labels[estado] || estado;
  }

  getEstadoClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'OPERATIVO': 'estado--operativo',
      'MANTENIMIENTO': 'estado--mantenimiento',
      'FUERA DE SERVICIO': 'estado--fuera'
    };
    return classes[estado] || '';
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  // ==========================================
  // Modal
  // ==========================================
  cerrarErrorModal(): void {
    this.showErrorModal = false;
  }

  recargarDatos(): void {
    this.showErrorModal = false;
    this.cargarEquipos();
  }
}