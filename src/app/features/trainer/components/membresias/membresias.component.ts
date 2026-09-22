import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MembresiasService, Membresia } from '../../../../core/services/membresias.service';

@Component({
  selector: 'app-membresias',
  templateUrl: './membresias.component.html',
  styleUrls: ['./membresias.component.scss']
})
export class MembresiasComponent implements OnInit {

  // ==========================================
  // Modo: 'lista' | 'detalle'
  // ==========================================
  modo: 'lista' | 'detalle' = 'lista';

  // ==========================================
  // Lista
  // ==========================================
  membresias: Membresia[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  // ==========================================
  // Detalle
  // ==========================================
  idMembresia: number = 0;
  membresia: Membresia | null = null;
  isLoadingDetalle: boolean = false;
  errorDetalle: string | null = null;

  // Estadísticas
  sociosActivos: number = 0;
  gananciaEstimada: number = 0;

  // Control de menú lateral (Hamburguesa)
  isSidebarOpen: boolean = false;

  constructor(
    private membresiasService: MembresiasService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];

      if (id) {
        this.modo = 'detalle';
        this.idMembresia = Number(id);
        this.cargarMembresiaDetalle();
      } else {
        this.modo = 'lista';
        this.cargarMembresias();
      }
    });
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

  // ==========================================
  // LISTA
  // ==========================================
  cargarMembresias(): void {
    this.isLoading = true;
    this.error = null;

    this.membresiasService.getMembresias().subscribe({
      next: (data: Membresia[]) => {
        this.membresias = Array.isArray(data) ? data : [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar membresias:', err);
        this.error = 'No se pudieron cargar las membresías.';
        this.isLoading = false;
      }
    });
  }

  verDetalle(idMembresia: number): void {
    this.router.navigate(['/trainer/membresias', idMembresia]);
  }

  // ==========================================
  // DETALLE
  // ==========================================
  cargarMembresiaDetalle(): void {
    this.isLoadingDetalle = true;
    this.errorDetalle = null;

    this.membresiasService.getMembresiaById(this.idMembresia).subscribe({
      next: (data: Membresia | null) => {
        if (data) {
          this.membresia = data;
        } else {
          this.errorDetalle = 'La membresía no existe';
        }
        this.isLoadingDetalle = false;
      },
      error: (err) => {
        console.error('Error al cargar membresía:', err);
        this.errorDetalle = 'No se pudo cargar la membresía';
        this.isLoadingDetalle = false;
      }
    });
  }

  volverALista(): void {
    this.router.navigate(['/trainer/membresias']);
  }

  // ==========================================
  // HELPERS
  // ==========================================
  esPremium(m: Membresia | null): boolean {
    return m?.incluyeIA === true;
  }

  formatearPrecio(precio: number | undefined | null): string {
    if (precio === null || precio === undefined) return '$ 0';
    return '$ ' + precio.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getBeneficiosArray(m: Membresia | null): string[] {
    if (!m) return [];

    const lista: string[] = [];

    if (m.beneficios) {
      const base = m.beneficios.split(',').map(b => b.trim()).filter(b => !!b);
      lista.push(...base);
    }

    if (m.esFlexible) {
      lista.push('Flexible - Sin permanencia');
    }

    if (m.incluyeIA) {
      lista.push('Incluye asesoría con IA');
    }

    return lista;
  }
}