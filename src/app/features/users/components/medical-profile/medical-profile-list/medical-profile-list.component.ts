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

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.cargarPerfiles();
  }

  cargarPerfiles(): void {
    this.loading = true;
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