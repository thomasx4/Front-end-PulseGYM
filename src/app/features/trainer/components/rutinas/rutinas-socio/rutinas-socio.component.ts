import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntrenadorService, RutinaDetalle, Usuario } from '../../../../../core/services/entrenador.service';

@Component({
  selector: 'app-rutinas-socio',
  templateUrl: './rutinas-socio.component.html',
  styleUrls: ['./rutinas-socio.component.scss']
})
export class RutinasSocioComponent implements OnInit {

  public isLoading: boolean = true;
  public errorMessage: string = '';

  public idSocio: number = 0;
  public usernameSocio: string = 'Socio';

  public rutinas: RutinaDetalle[] = [];

  // Modales
  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entrenadorService: EntrenadorService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idSocio = Number(params['idSocio']) || 0;
      if (this.idSocio) {
        this.cargarUsernameY_Rutinas();
      } else {
        this.errorMessage = 'No se especifico un socio valido.';
        this.isLoading = false;
      }
    });
  }

  private cargarUsernameY_Rutinas(): void {
    this.isLoading = true;

    this.entrenadorService.getUsuarios().subscribe({
      next: (usuarios: Usuario[]) => {
        const socio = usuarios.find(u => u.idUsuario === this.idSocio);
        this.usernameSocio = socio ? socio.username : `Socio #${this.idSocio}`;
        this.cargarRutinas();
      },
      error: () => {
        this.usernameSocio = `Socio #${this.idSocio}`;
        this.cargarRutinas();
      }
    });
  }

  private cargarRutinas(): void {
    this.entrenadorService.getRutinasSocio(this.idSocio).subscribe({
      next: (response: RutinaDetalle[]) => {
        console.log('Rutinas del socio:', response);

        this.rutinas = (response || []).sort((a, b) =>
          new Date(b.fechaGeneracion).getTime() - new Date(a.fechaGeneracion).getTime()
        );

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar rutinas del socio:', error);
        this.isLoading = false;

        if (error.status === 404) {
          this.rutinas = [];
          return;
        }

        let mensaje = 'Error al cargar las rutinas del socio.';
        if (error.status === 401) {
          mensaje = 'Tu sesion ha expirado. Inicia sesion nuevamente.';
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }

        this.errorModalTitle = 'Error al cargar';
        this.errorModalMessage = mensaje;
        this.showErrorModal = true;
      }
    });
  }

  // ==========================================
  // Helpers
  // ==========================================
  public formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    const date = new Date(fecha);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    return `${dia} ${mes} ${anio}`;
  }

  public getDiasPorSemana(detalles: any[]): number {
    if (!detalles || detalles.length === 0) return 0;
    const dias = new Set(detalles.map(d => d.diaSemana));
    return dias.size;
  }

  // ==========================================
  // Acciones
  // ==========================================
  verDetalle(idRutina: number): void {
    this.router.navigate(['/trainer/rutinas/socio', this.idSocio, 'rutina', idRutina]);
  }

  volver(): void {
    this.router.navigate(['/trainer/rutinas']);
  }

  onRetry(): void {
    this.showErrorModal = false;
    this.cargarRutinas();
  }

  onCloseModal(): void {
    this.showErrorModal = false;
  }

  // Agrega esta propiedad dentro de la clase junto a las demás variables públicas:
public isSidebarOpen: boolean = false;

// Y añade estos dos métodos al final de la clase:
toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
}

closeSidebar(): void {
    this.isSidebarOpen = false;
}
}