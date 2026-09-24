import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment.prod';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-medical-profile-list',
  templateUrl: './medical-profile-list.component.html',
  styleUrls: ['./medical-profile-list.component.scss']
})
export class MedicalProfileListComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/perfil-medico`;

  perfiles: any[] = [];
  loading: boolean = false;
  searchTerm: string = '';

  // Paginación
  pageIndex: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;

  // Métricas
  countConAlergias: number = 0;
  countConCondiciones: number = 0;

  // ⭐ Propiedades para selección múltiple
  idsSeleccionados: Set<number> = new Set<number>();

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.cargarPerfiles();
  }

  cargarPerfiles(): void {
    this.loading = true;
    this.limpiarSeleccion();

    let params = new HttpParams()
      .set('page', this.pageIndex.toString())
      .set('size', this.pageSize.toString());

    if (this.searchTerm.trim()) {
      params = params.set('busqueda', this.searchTerm.trim());
    }

    this.http.get<any>(this.apiUrl, { params }).subscribe({
      next: (response) => {
        this.perfiles = response.content || response.contenido || response.data || [];
        this.totalElements = response.totalElements || response.totalElementos || this.perfiles.length;
        this.totalPages = response.totalPages || response.totalPaginas || 1;

        this.calcularMetricas();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar perfiles médicos:', err);
        this.loading = false;
        this.perfiles = [];
      }
    });
  }

  cortarTextoDosPalabras(texto: string): string {
    if (!texto || texto.trim() === '') {
      return 'Ninguna';
    }
    const palabras = texto.trim().split(/\s+/);
    if (palabras.length <= 2) {
      return texto;
    }
    return `${palabras[0]} ${palabras[1]}...`;
  }

  isSeleccionado(id: number): boolean {
    return this.idsSeleccionados.has(id);
  }

  toggleSeleccionItem(id: number): void {
    if (this.idsSeleccionados.has(id)) {
      this.idsSeleccionados.delete(id);
    } else {
      this.idsSeleccionados.add(id);
    }
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.perfiles.forEach(item => {
        if (item.idSocio !== undefined && item.idSocio !== null) {
          this.idsSeleccionados.add(item.idSocio);
        }
      });
    } else {
      this.limpiarSeleccion();
    }
  }

  limpiarSeleccion(): void {
    this.idsSeleccionados.clear();
  }

  get isAllSelected(): boolean {
    if (this.perfiles.length === 0) return false;
    return this.perfiles.every(item => item.idSocio !== undefined && item.idSocio !== null && this.idsSeleccionados.has(item.idSocio));
  }

  get isSomeSelected(): boolean {
    if (this.perfiles.length === 0) return false;
    const count = this.perfiles.filter(item => item.idSocio !== undefined && item.idSocio !== null && this.idsSeleccionados.has(item.idSocio)).length;
    return count > 0 && !this.isAllSelected;
  }

  eliminarSeleccionados(): void {
    const ids: number[] = Array.from(this.idsSeleccionados);
    if (ids.length === 0) return;

    Swal.fire({
      title: '¿Eliminar perfiles médicos?',
      text: `¿Estás seguro de que deseas eliminar los ${ids.length} perfil(es) médico(s) seleccionado(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af'
    }).then((result) => {
      if (result.isConfirmed) {
        let completados = 0;
        ids.forEach(id => {
          this.http.delete(`${this.apiUrl}/${id}`).subscribe({
            next: () => {
              completados++;
              if (completados === ids.length) {
                this.limpiarSeleccion();
                this.cargarPerfiles();
                Swal.fire({
                  icon: 'success',
                  title: 'Perfiles eliminados',
                  text: 'Los perfiles médicos seleccionados han sido eliminados correctamente.',
                  confirmButtonColor: '#0f1c3f'
                });
              }
            },
            error: (err) => {
              console.error(`Error al eliminar perfil médico ID ${id}:`, err);
            }
          });
        });
      }
    });
  }

  buscarPerfiles(): void {
    this.pageIndex = 0;
    this.cargarPerfiles();
  }

  calcularMetricas(): void {
    this.countConAlergias = this.perfiles.filter(p => p.alergias && p.alergias.trim() !== '' && p.alergias.toLowerCase() !== 'ninguna').length;
    this.countConCondiciones = this.perfiles.filter(p => p.condicionesCronicas && p.condicionesCronicas.trim() !== '' && p.condicionesCronicas.toLowerCase() !== 'ninguna').length;
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPages) {
      this.pageIndex = nuevaPagina;
      this.cargarPerfiles();
    }
  }

  get paginasVisibles(): number[] {
    const max = 4;
    let inicio = Math.max(0, this.pageIndex - 1);
    let fin = inicio + max;
    if (fin > this.totalPages) {
      fin = this.totalPages;
      inicio = Math.max(0, fin - max);
    }
    const pags = [];
    for (let i = inicio; i < fin; i++) {
      pags.push(i);
    }
    return pags;
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  irANuevoPerfil(): void {
    this.router.navigate(['/dashboard-admin/users/medical-profile/new']);
  }

  verDetalle(idSocio: number): void {
    this.router.navigate([`/dashboard-admin/users/medical-profile/detail/${idSocio}`]);
  }

  editarPerfil(idSocio: number): void {
    this.router.navigate([`/dashboard-admin/users/medical-profile/edit/${idSocio}`]);
  }

  eliminarPerfil(idSocio: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se eliminará el perfil médico de este socio.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0e3b72',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${idSocio}`).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El perfil médico ha sido eliminado.', 'success');
            this.cargarPerfiles();
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo eliminar el perfil médico.', 'error');
          }
        });
      }
    });
  }
}