import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EntrenadorService, RutinaDetalle, Usuario } from '../../../../core/services/entrenador.service';

export interface RutinaEntrenador {
  idRutina: number;
  nombre: string;
  fechaGeneracion: string;
  fechaGeneracionRaw: string;
  horaGeneracion: string;
  modificadoPor: string;
  avatarUrl: string;
  version: number;
  generadaPorIA: boolean;
  idSocio: number;
  usernameSocio: string;
}

export interface RutinaStats {
  totalRutinas: number;
  totalSocios: number;
  totalModificadas: number;
  ultimaFecha: string;
}

interface UsuarioOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.component.html',
  styleUrls: ['./rutinas.component.scss']
})
export class RutinasComponent implements OnInit {

  public isLoading: boolean = false;

  public stats: RutinaStats = {
    totalRutinas: 0,
    totalSocios: 0,
    totalModificadas: 0,
    ultimaFecha: '—'
  };

  public rutinas: RutinaEntrenador[] = [];
  public rutinasFiltradas: RutinaEntrenador[] = [];

  public usuarios: Usuario[] = [];
  public usuariosDisponibles: UsuarioOption[] = [
    { value: 'todos', label: 'Todos los usuarios' }
  ];

  public filtroUsuario: string = 'todos';
  public filtroBusqueda: string = '';

  public paginaActual: number = 1;
  public totalPaginas: number = 1;
  public tamanioPagina: number = 6;
  public totalRegistros: number = 0;

  public showErrorModal: boolean = false;
  public errorModalMessage: string = '';

  constructor(
    private router: Router,
    private entrenadorService: EntrenadorService
  ) { }

  ngOnInit(): void {
    this.inicializar();
  }

  inicializar(): void {
    this.isLoading = true;

    this.entrenadorService.getUsuarios().subscribe({
      next: (usuarios: Usuario[]) => {
        this.usuarios = usuarios || [];

        this.usuariosDisponibles = [
          { value: 'todos', label: 'Todos los usuarios' },
          ...this.usuarios.map(u => ({
            value: String(u.idUsuario),
            label: `${u.username} (${u.rol})`
          }))
        ];

        this.cargarRutinasSegunFiltro();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.isLoading = false;
        this.errorModalMessage = 'No se pudieron cargar los usuarios.';
        this.showErrorModal = true;
      }
    });
  }

  cargarRutinasSegunFiltro(): void {
    this.isLoading = true;

    if (this.filtroUsuario === 'todos') {
      this.cargarUltimaRutinaDeCadaUsuario();
    } else {
      this.cargarRutinasDeUsuario(Number(this.filtroUsuario));
    }
  }

  private cargarUltimaRutinaDeCadaUsuario(): void {
    if (this.usuarios.length === 0) {
      this.rutinas = [];
      this.rutinasFiltradas = [];
      (this as any).totalRutinasSistema = 0;
      this.calcularStats();
      this.aplicarFiltroY_Paginacion();
      this.isLoading = false;
      return;
    }

    const peticiones = this.usuarios.map(u =>
      this.entrenadorService.getRutinasSocio(u.idUsuario).pipe(
        catchError(() => of([] as RutinaDetalle[]))
      )
    );

    forkJoin(peticiones).subscribe({
      next: (resultados: RutinaDetalle[][]) => {
        const rutinasFinales: RutinaEntrenador[] = [];
        let totalRutinasSistema = 0;

        resultados.forEach((rutinasUsuario, index) => {
          const usuario = this.usuarios[index];
          totalRutinasSistema += rutinasUsuario?.length || 0;

          if (rutinasUsuario && rutinasUsuario.length > 0) {
            const ordenadas = [...rutinasUsuario].sort((a, b) =>
              new Date(b.fechaGeneracion).getTime() - new Date(a.fechaGeneracion).getTime()
            );
            // ✅ Pasamos idUsuario explicito
            rutinasFinales.push(this.mapearRutina(ordenadas[0], usuario, usuario.idUsuario));
          }
        });

        (this as any).totalRutinasSistema = totalRutinasSistema;

        this.rutinas = rutinasFinales;
        this.rutinasFiltradas = [...this.rutinas];

        this.calcularStats();
        this.aplicarFiltroY_Paginacion();

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar rutinas:', err);
        this.isLoading = false;
        this.errorModalMessage = 'Error al cargar las rutinas.';
        this.showErrorModal = true;
      }
    });
  }

  private cargarRutinasDeUsuario(idUsuario: number): void {
    const usuario = this.usuarios.find(u => Number(u.idUsuario) === Number(idUsuario));

    this.entrenadorService.getRutinasSocio(idUsuario).subscribe({
      next: (response: RutinaDetalle[]) => {
        const ordenadas = (response || []).sort((a, b) =>
          new Date(b.fechaGeneracion).getTime() - new Date(a.fechaGeneracion).getTime()
        );

        (this as any).totalRutinasSistema = ordenadas.length;

        // ✅ Pasamos idUsuario explicito
        this.rutinas = ordenadas.map(r => this.mapearRutina(r, usuario, idUsuario));
        this.rutinasFiltradas = [...this.rutinas];

        this.calcularStats();
        this.aplicarFiltroY_Paginacion();

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar rutinas:', error);
        this.isLoading = false;

        if (error.status === 404) {
          this.rutinas = [];
          this.rutinasFiltradas = [];
          (this as any).totalRutinasSistema = 0;
          this.calcularStats();
          this.aplicarFiltroY_Paginacion();
          return;
        }

        let mensaje = 'Error al cargar las rutinas del usuario.';
        if (error.status === 401) {
          mensaje = 'Tu sesion ha expirado. Inicia sesion nuevamente.';
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }

        this.errorModalMessage = mensaje;
        this.showErrorModal = true;
      }
    });
  }

  // ✅ Ahora acepta un idSocio forzado
  private mapearRutina(r: RutinaDetalle, usuario?: Usuario, idSocioForzado?: number): RutinaEntrenador {
    const fecha = new Date(r.fechaGeneracion);

    const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = mesesCortos[fecha.getMonth()];
    const anio = fecha.getFullYear();

    let hora = fecha.getHours();
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const ampm = hora >= 12 ? 'PM' : 'AM';
    hora = hora % 12 || 12;
    const horaStr = `${String(hora).padStart(2, '0')}:${minutos} ${ampm}`;

    let modificadoPor = '';
    if (r.detalles && r.detalles.length > 0) {
      const conMod = r.detalles.find(d => d.modificadoPor);
      if (conMod && conMod.modificadoPor) {
        modificadoPor = this.limpiarNombreModificador(conMod.modificadoPor);
      }
    }

    if (!modificadoPor) {
      if (r.generadaPorIA) {
        modificadoPor = 'IA';
      } else {
        modificadoPor = 'Sistema';
      }
    }

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(modificadoPor)}&background=0F1C3F&color=fff&bold=true`;

    return {
      idRutina: r.idRutina,
      nombre: r.nombre || `Rutina #${r.idRutina}`,
      fechaGeneracion: `${dia} ${mes} ${anio}`,
      fechaGeneracionRaw: r.fechaGeneracion,
      horaGeneracion: horaStr,
      modificadoPor,
      avatarUrl,
      version: r.version,
      generadaPorIA: r.generadaPorIA,
      idSocio: idSocioForzado ?? usuario?.idUsuario ?? 0,
      usernameSocio: usuario?.username ?? '—'
    };
  }

  private limpiarNombreModificador(valor: string): string {
    if (!valor) return '';

    if (valor.includes('@')) {
      const porUsername = this.usuarios.find(u =>
        u.username && valor.toLowerCase().includes(u.username.toLowerCase())
      );
      if (porUsername) return porUsername.username;
      return valor.split('@')[0];
    }

    return valor
      .split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  private calcularStats(): void {
    const totalRutinasSistema = (this as any).totalRutinasSistema || this.rutinas.length;

    const totalSocios = this.filtroUsuario === 'todos'
      ? new Set(this.rutinas.map(r => r.idSocio)).size
      : (this.rutinas.length > 0 ? 1 : 0);

    const totalModificadas = this.rutinas.filter(r =>
      r.modificadoPor !== 'IA' && r.modificadoPor !== 'Sistema' && r.modificadoPor !== '—'
    ).length;

    let ultimaFecha = '—';
    if (this.rutinas.length > 0) {
      const ordenadas = [...this.rutinas].sort((a, b) =>
        new Date(b.fechaGeneracionRaw).getTime() - new Date(a.fechaGeneracionRaw).getTime()
      );
      ultimaFecha = ordenadas[0].fechaGeneracion;
    }

    this.stats = {
      totalRutinas: totalRutinasSistema,
      totalSocios,
      totalModificadas,
      ultimaFecha
    };
  }

  aplicarFiltroY_Paginacion(): void {
    let filtradas = [...this.rutinas];

    if (this.filtroBusqueda && this.filtroBusqueda.trim()) {
      const q = this.filtroBusqueda.toLowerCase().trim();
      filtradas = filtradas.filter(r =>
        r.nombre.toLowerCase().includes(q) ||
        r.modificadoPor.toLowerCase().includes(q) ||
        `v${r.version}`.toLowerCase().includes(q) ||
        r.fechaGeneracion.toLowerCase().includes(q) ||
        r.usernameSocio.toLowerCase().includes(q)
      );
    }

    this.rutinasFiltradas = filtradas;
    this.totalRegistros = filtradas.length;
    this.totalPaginas = Math.max(1, Math.ceil(filtradas.length / this.tamanioPagina));

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
  }

  onFiltroUsuarioChange(): void {
    this.filtroBusqueda = '';
    this.paginaActual = 1;
    this.cargarRutinasSegunFiltro();
  }

  onBusquedaChange(): void {
    this.paginaActual = 1;
    this.aplicarFiltroY_Paginacion();
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.paginaActual = 1;
    this.aplicarFiltroY_Paginacion();
  }

  get rutinasPaginadas(): RutinaEntrenador[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    const fin = inicio + this.tamanioPagina;
    return this.rutinasFiltradas.slice(inicio, fin);
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.irAPagina(this.paginaActual + 1);
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.irAPagina(this.paginaActual - 1);
    }
  }

  get paginas(): number[] {
    const paginas: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  get rangoActual(): string {
    if (this.totalRegistros === 0) return 'No hay rutinas';
    const inicio = (this.paginaActual - 1) * this.tamanioPagina + 1;
    const fin = Math.min(this.paginaActual * this.tamanioPagina, this.totalRegistros);
    return `Mostrando ${inicio} a ${fin} de ${this.totalRegistros} rutinas`;
  }

  get mostrarEmptyPorBusqueda(): boolean {
    return this.rutinasPaginadas.length === 0
      && this.filtroBusqueda.trim() !== ''
      && this.rutinas.length > 0;
  }

  get mostrarEmptySinRutinas(): boolean {
    return this.rutinasPaginadas.length === 0
      && this.rutinas.length === 0;
  }

  get usuarioSeleccionadoNombre(): string {
    if (this.filtroUsuario === 'todos') return '';
    const encontrado = this.usuarios.find(u => String(u.idUsuario) === this.filtroUsuario);
    return encontrado ? encontrado.username : '';
  }

  verRutina(rutina: RutinaEntrenador): void {
    console.log('Ver rutina - idSocio:', rutina.idSocio, 'idRutina:', rutina.idRutina);

    if (!rutina.idSocio || rutina.idSocio === 0) {
      console.error('idSocio invalido, no se puede navegar');
      return;
    }

    this.router.navigate(['/trainer/rutinas/socio', rutina.idSocio]);
  }

  editarRutina(rutina: RutinaEntrenador): void {
    console.log('Editar rutina:', rutina.idRutina);
  }

  crearRutina(): void {
    console.log('Crear rutina para usuario:', this.filtroUsuario);
  }

  cerrarErrorModal(): void {
    this.showErrorModal = false;
  }

  // Variables para el control del menú hamburguesa / sidebar
public isSidebarOpen: boolean = false;

// Métodos de control del menú lateral (sidebar)
toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
}

closeSidebar(): void {
    this.isSidebarOpen = false;
}
}