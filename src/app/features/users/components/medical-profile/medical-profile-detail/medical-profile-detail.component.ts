import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment.prod';

@Component({
  selector: 'app-medical-profile-detail',
  templateUrl: './medical-profile-detail.component.html',
  styleUrls: ['./medical-profile-detail.component.scss']
})
export class MedicalProfileDetailComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/pg-ms-users/api/v1/usuarios/perfil-medico`;

  idSocio: number | null = null;
  perfil: any = null;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.idSocio = +idParam;
      this.cargarDetallePerfil(this.idSocio);
    }
  }

  cargarDetallePerfil(id: number): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
      next: (response) => {
        this.perfil = response;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el detalle del perfil médico:', err);
        this.loading = false;
      }
    });
  }

  getIniciales(nombre: string): string {
    if (!nombre) return 'S';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    }
    return nombre.charAt(0).toUpperCase();
  }

  volverALista(): void {
    this.router.navigate(['/dashboard-admin/users/medical-profile']);
  }

  editarPerfil(): void {
    if (this.idSocio) {
      this.router.navigate([`/dashboard-admin/users/medical-profile/edit/${this.idSocio}`]);
    }
  }
}