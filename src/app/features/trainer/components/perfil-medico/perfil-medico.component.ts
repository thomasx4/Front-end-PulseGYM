import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EntrenadorService } from '../../../../core/services/entrenador.service';

export interface SocioUI {
  idUsuario: number;
  username: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  fotoUrl: string;
  rol: string;
  estado: string;
  nombreSede: string;
  nivelExperiencia: string;
  fechaNacimiento: string;
}

@Component({
  selector: 'app-perfil-medico',
  templateUrl: './perfil-medico.component.html',
  styleUrls: ['./perfil-medico.component.scss']
})
export class PerfilMedicoComponent implements OnInit {

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
  readonly TAMANIO_PAGINA: number = 12;
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

        this.socios = soloSocios.map((u: any) => this.mapearSocio(u));
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

  private mapearSocio(u: any): SocioUI {
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
      nombre,
      apellido,
      nombreCompleto,
      email: u.email || '',
      telefono: u.telefono || '',
      fotoUrl: foto,
      rol: u.rol || '',
      estado: (u.estado || '').toUpperCase(),
      nombreSede: u.nombreSede || '',
      nivelExperiencia: u.nivelExperiencia || '',
      fechaNacimiento: u.fechaNacimiento || ''
    };
  }

  filtrarSocios(): void {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) {
      this.sociosFiltrados = [...this.socios];
    } else {
      this.sociosFiltrados = this.socios.filter(s =>
        s.username.toLowerCase().includes(q)
      );
    }
    this.paginaActual = 1;
  }

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

  verDetalle(idSocio: number): void {
    this.router.navigate(['/trainer/perfil-medico', idSocio]);
  }

  getIniciales(nombreCompleto: string): string {
    if (!nombreCompleto) return '?';
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.classList.add('avatar-fallback');
    }
  }

  getEdad(fechaNacimiento: string): number | null {
    if (!fechaNacimiento) return null;
    try {
      const hoy = new Date();
      const nac = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
      return edad > 0 ? edad : null;
    } catch {
      return null;
    }
  }

  getNivelClass(nivel: string): string {
    const n = (nivel || '').toLowerCase();
    if (n === 'avanzado') return 'nivel-avanzado';
    if (n === 'novato') return 'nivel-novato';
    return 'nivel-intermedio';
  }

  get rangoMostrado(): string {
    if (this.sociosFiltrados.length === 0) return '0';
    const inicio = (this.paginaActual - 1) * this.TAMANIO_PAGINA + 1;
    const fin = Math.min(this.paginaActual * this.TAMANIO_PAGINA, this.sociosFiltrados.length);
    return `${inicio}-${fin} de ${this.sociosFiltrados.length}`;
  }
}