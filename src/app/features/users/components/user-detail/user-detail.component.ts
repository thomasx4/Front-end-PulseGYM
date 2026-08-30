import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import Swal from 'sweetalert2';

export interface UserDetail {
  idUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
  sexo?: string;
  telefono: string;
  documentoIdentidad: string;
  fotoUrl: string;
  fechaNacimiento: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  idSede: number;
  objetivoPrincipal: string;
  nivelExperiencia: string;
  fechaContratacion: string;
  especialidad: string;
  anosExperiencia: number;
  horarioDisponibilidad: string;
  tarifaHora: number;
  turno: string;
  fechaRegistro: string;
  estado: string;
  rol?: string;
  nombreSede?: string;
}

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  userId: number | null = null;
  user: UserDetail | null = null;
  loading: boolean = false;
  errorMensaje: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.userId = parseInt(id);
        this.cargarUsuario(this.userId);
      }
    });
  }

  cargarUsuario(id: number): void {
    this.loading = true;
    this.userService.obtenerPerfilPorId(id).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        this.user = data;
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMensaje = error.error?.message || 'No se pudo cargar la información del usuario.';
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMensaje,
          confirmButtonColor: '#0f1c3f'
        });
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard-admin/users/profiles']);
  }

  editarUsuario(): void {
    if (this.userId) {
      this.router.navigate(['/dashboard-admin/users/profiles/edit', this.userId]);
    }
  }

  esRol(rol: string): boolean {
    if (!this.user || !this.user.rol) return false;
    return this.user.rol.toLowerCase() === rol.toLowerCase();
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/D';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'N/D';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getEstadoClass(estado: string): string {
    if (!estado) return 'estado-inactivo';
    return estado === 'ACTIVO' ? 'estado-activo' : 'estado-inactivo';
  }

  getRolClass(rol: string): string {
    if (!rol) return 'rol-default';
    const rolLower = rol.toLowerCase();
    if (rolLower.includes('administrador') || rolLower.includes('admin')) return 'rol-admin';
    if (rolLower.includes('entrenador') || rolLower.includes('trainer')) return 'rol-trainer';
    if (rolLower.includes('recepcionista') || rolLower.includes('receptionist')) return 'rol-receptionist';
    if (rolLower.includes('socio') || rolLower.includes('user') || rolLower.includes('member')) return 'rol-member';
    return 'rol-default';
  }
}