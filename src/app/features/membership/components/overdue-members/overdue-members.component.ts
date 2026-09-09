import { Component, OnInit } from '@angular/core';
import { MembershipService, SocioEnMoraDTO } from '../../../../core/services/membership.service';

@Component({
  selector: 'app-overdue-members',
  templateUrl: './overdue-members.component.html',
  styleUrls: ['./overdue-members.component.scss']
})
export class OverdueMembersComponent implements OnInit {

  sociosEnMora: SocioEnMoraDTO[] = [];
  sociosFiltrados: SocioEnMoraDTO[] = [];
  cargando: boolean = false;
  exportando: boolean = false;

  // Filtros
  busquedaTexto: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  mostrarFiltros: boolean = false;

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 7;

  constructor(private membershipService: MembershipService) { }

  ngOnInit(): void {
    this.cargarSociosEnMora();
  }

  cargarSociosEnMora(): void {
    this.cargando = true;

    this.membershipService.obtenerSociosEnMora(this.fechaInicio, this.fechaFin).subscribe({
      next: (res) => {
        this.sociosEnMora = res?.sociosEnMora || [];
        this.aplicarBusquedaLocal();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar socios en mora:', err);
        this.cargando = false;
      }
    });
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  filtrarPorRango(): void {
    this.mostrarFiltros = false;
    this.cargarSociosEnMora();
  }

  limpiarFiltros(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.busquedaTexto = '';
    this.mostrarFiltros = false;
    this.cargarSociosEnMora();
  }

  aplicarBusquedaLocal(): void {
    this.paginaActual = 1;
    if (!this.busquedaTexto.trim()) {
      this.sociosFiltrados = [...this.sociosEnMora];
      return;
    }

    const q = this.busquedaTexto.toLowerCase().trim();
    this.sociosFiltrados = this.sociosEnMora.filter(item =>
      item.nombreCompleto.toLowerCase().includes(q) ||
      item.identificacion.includes(q) ||
      item.email.toLowerCase().includes(q)
    );
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'US';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  // PAGINACIÓN
  get totalElementos(): number {
    return this.sociosFiltrados.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalElementos / this.itemsPorPagina) || 1;
  }

  get inicio(): number {
    return this.totalElementos === 0 ? 0 : (this.paginaActual - 1) * this.itemsPorPagina;
  }

  get fin(): number {
    return Math.min(this.paginaActual * this.itemsPorPagina, this.totalElementos);
  }

  get paginas(): number[] {
    const arr: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) arr.push(i);
    return arr;
  }

  get sociosPaginados(): SocioEnMoraDTO[] {
    return this.sociosFiltrados.slice(this.inicio, this.fin);
  }

  irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p;
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  // EXPORTACIÓN
  exportarPdf(): void {
    this.exportando = true;
    this.membershipService.exportarMoraPdf().subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, `Socios_En_Mora_${new Date().toISOString().slice(0, 10)}.pdf`);
        this.exportando = false;
      },
      error: () => this.exportando = false
    });
  }

  exportarExcel(): void {
    this.exportando = true;
    this.membershipService.exportarMoraExcel().subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, `Socios_En_Mora_${new Date().toISOString().slice(0, 10)}.xlsx`);
        this.exportando = false;
      },
      error: () => this.exportando = false
    });
  }

  private descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}