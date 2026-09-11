import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PlantillaDisenoEmail, EnumEventoAsociado, EnumCanalNotificacion } from '../../models/notification.model';

@Component({
  selector: 'app-admin-disenos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-disenos.component.html',
  styleUrls: ['./admin-disenos.component.scss']
})
export class AdminDisenosComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/diseno-email`;
  private rolAdmin = 'ADMIN';

  disenos: PlantillaDisenoEmail[] = [];
  modalAbierto = false;
  esEdicion = false;

  disenoForm: PlantillaDisenoEmail = {
    nombre: '',
    eventoAsociado: 'WELCOME',
    canal: 'EMAIL',
    colorPrincipal: '#2c4b77',
    colorSecundario: '#8bb5d6',
    tituloHeader: 'Pulse Gym',
    subtituloHeader: 'Tu bienestar, nuestra pasión',
    activo: true
  };

  ngOnInit(): void {
    this.cargarDisenos();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('X-User-Rol', this.rolAdmin);
  }

  cargarDisenos(): void {
    this.http.get<{ success: boolean; data: PlantillaDisenoEmail[] }>(`${this.apiUrl}/leer`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => this.disenos = res.data || [],
        error: (err) => console.error('Error al cargar diseños', err)
      });
  }

  abrirModalCrear(): void {
    this.esEdicion = false;
    this.disenoForm = {
      nombre: '',
      eventoAsociado: 'WELCOME',
      canal: 'EMAIL',
      colorPrincipal: '#2c4b77',
      colorSecundario: '#8bb5d6',
      tituloHeader: 'Pulse Gym',
      subtituloHeader: 'Tu bienestar, nuestra pasión',
      activo: true
    };
    this.modalAbierto = true;
  }

  abrirModalEditar(diseno: PlantillaDisenoEmail): void {
    this.esEdicion = true;
    this.disenoForm = { ...diseno };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarDiseno(): void {
    if (this.esEdicion && this.disenoForm.idDiseno) {
      this.http.put(`${this.apiUrl}/actualizar/${this.disenoForm.idDiseno}`, this.disenoForm, { headers: this.getHeaders() })
        .subscribe({
          next: () => { this.cargarDisenos(); this.cerrarModal(); },
          error: (err) => alert('Error al actualizar diseño: ' + err.error?.message)
        });
    } else {
      this.http.post(`${this.apiUrl}/crear`, this.disenoForm, { headers: this.getHeaders() })
        .subscribe({
          next: () => { this.cargarDisenos(); this.cerrarModal(); },
          error: (err) => alert('Error al crear diseño: ' + err.error?.message)
        });
    }
  }
}