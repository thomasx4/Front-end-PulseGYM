import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EntrenadorService } from '../../../../core/services/entrenador.service';

export interface SocioUI {
  idUsuario: number;
  username: string;
  nombreCompleto: string;
  email: string;
  fotoUrl: string;
  estado: string;
}

@Component({
  selector: 'app-progreso',
  templateUrl: './progreso.component.html',
  styleUrls: ['./progreso.component.scss']
})
export class ProgresoComponent implements OnInit {

  socios: SocioUI[] = [];
  sociosFiltrados: SocioUI[] = [];
  busqueda: string = '';
  cargando: boolean = true;
  error: string | null = null;

  // Control de menú lateral (Hamburguesa)
  isSidebarOpen: boolean = false;

  // ==========================================
  // PAGINACIÓN
  // ==========================================
  readonly TAMANIO_PAGINA: number = 9;
  paginaActual: number = 1;

  get totalPaginas(): number {
    return Math.ceil(this.sociosFiltrados.length / this.TAMANIO_PAGINA) || 1;
  }

  get sociosPaginados(): SocioUI[] {
    const inicio = (this.paginaActual - 1) * this.TAMANIO_PAGINA;
    const fin = inicio + this.TAMANIO_PAGINA;
    return this.sociosFiltrados.slice(inicio, fin);
  }

  get paginas(): number[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const maxVisibles = 5;
    const paginas: number[] = [];

    if (total <= maxVisibles) {
      for (let i = 1; i <= total; i++) paginas.push(i);
      return paginas;
    }

    let inicio = Math.max(1, actual - Math.floor(maxVisibles / 2));
    let fin = inicio + maxVisibles - 1;
    if (fin > total) {
      fin = total;
      inicio = fin - maxVisibles + 1;
    }
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  }

  get rangoMostrado(): string {
    if (this.sociosFiltrados.length === 0) return '0';
    const inicio = (this.paginaActual - 1) * this.TAMANIO_PAGINA + 1;
    const fin = Math.min(this.paginaActual * this.TAMANIO_PAGINA, this.sociosFiltrados.length);
    return `${inicio}-${fin} de ${this.sociosFiltrados.length}`;
  }

  constructor(
    private router: Router,
    private entrenadorService: EntrenadorService
  ) {}

  ngOnInit(): void {
    this.cargarSocios();
  }

  // ==========================================
  // MÉTODOS DE MENÚ LATERAL (HAMBURGUESA)
  // ==========================================
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  cargarSocios(): void {
    this.cargando = true;
    this.error = null;

    this.entrenadorService.getUsuarios().subscribe({
      next: (data: any) => {
        const lista = Array.isArray(data) ? data : [];

        const soloSocios = lista.filter((u: any) =>
          (u.rol || '').toLowerCase() === 'socio'
        );

        this.socios = soloSocios.map((u: any) => {
          const nombre = (u.nombre || '').trim();
          const apellido = (u.apellido || '').trim();
          const nombreCompleto = `${nombre} ${apellido}`.trim() || u.username || 'Socio';

          let foto = u.fotoUrl || '';
          if (foto.includes('socio_default_avatar')) {
            foto = '';
          }

          return {
            idUsuario: u.idUsuario || 0,
            username: u.username || '',
            nombreCompleto,
            email: u.email || '',
            fotoUrl: foto,
            estado: (u.estado || 'ACTIVO').toUpperCase()
          };
        });

        this.sociosFiltrados = [...this.socios];
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar socios:', err);
        this.error = 'No se pudo cargar la lista de socios.';
        this.cargando = false;
      }
    });
  }

  filtrarSocios(): void {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) {
      this.sociosFiltrados = [...this.socios];
    } else {
      this.sociosFiltrados = this.socios.filter(s =>
        s.nombreCompleto.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }
    this.paginaActual = 1;
  }

  // ==========================================
  // PAGINACIÓN — Controles
  // ==========================================
  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  paginaSiguiente(): void {
    this.irAPagina(this.paginaActual + 1);
  }

  paginaAnterior(): void {
    this.irAPagina(this.paginaActual - 1);
  }

  // ==========================================
  // Navegación
  // ==========================================
  verProgreso(idSocio: number): void {
    this.router.navigate(['/trainer/progreso', idSocio]);
  }

  // ==========================================
  // Helpers
  // ==========================================
  getIniciales(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    this.sociosFiltrados.forEach(s => {
      if (s.fotoUrl === img.src) s.fotoUrl = '';
    });
  }
}