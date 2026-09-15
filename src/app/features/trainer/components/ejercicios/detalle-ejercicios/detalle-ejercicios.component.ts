import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EjerciciosService, Ejercicio } from '../../../../../core/services/ejercicios.service';

@Component({
  selector: 'app-detalle-ejercicios',
  templateUrl: './detalle-ejercicios.component.html',
  styleUrls: ['./detalle-ejercicios.component.scss']
})
export class DetalleEjerciciosComponent implements OnInit {

  idEjercicio: number = 0;
  ejercicio: Ejercicio | null = null;

  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ejerciciosService: EjerciciosService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idEjercicio = Number(params['id']) || 0;

      if (!this.idEjercicio) {
        this.error = 'No se especifico un ejercicio valido';
        this.isLoading = false;
        return;
      }

      this.cargarEjercicio();
    });
  }

  cargarEjercicio(): void {
    this.isLoading = true;
    this.error = null;

    this.ejerciciosService.getEjercicioById(this.idEjercicio).subscribe({
      next: (data: any) => {
        console.log('Ejercicio recibido:', data);

        const ej = data?.data && !Array.isArray(data.data) ? data.data : data;
        this.ejercicio = {
          idEjercicio: ej.idEjercicio || ej.id || 0,
          nombre: ej.nombre || 'Sin nombre',
          grupoMuscular: ej.grupoMuscular || 'General',
          equipoNecesario: ej.equipoNecesario || 'Sin equipo',
          explicacionTecnica: ej.explicacionTecnica || '',
          urlImagen: ej.urlImagen || '',
          dificultad: ej.dificultad || 1,
          caloriasPorMinuto: ej.caloriasPorMinuto || 0,
          activo: ej.activo !== undefined ? ej.activo : true
        };

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar ejercicio:', err);
        this.isLoading = false;
        this.error = err.status === 404
          ? 'El ejercicio no existe'
          : 'No se pudo cargar el ejercicio';
      }
    });
  }

  volver(): void {
    this.router.navigate(['/trainer/ejercicios']);
  }

  getDificultadLabel(d: number): string {
    const labels = ['', 'Muy facil', 'Facil', 'Intermedio', 'Dificil', 'Muy dificil'];
    return labels[d] || 'Intermedio';
  }

  getDificultadClass(d: number): string {
    const clases = ['', 'nivel-1', 'nivel-2', 'nivel-3', 'nivel-4', 'nivel-5'];
    return clases[d] || 'nivel-3';
  }
}