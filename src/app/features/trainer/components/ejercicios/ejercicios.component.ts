import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EjerciciosService, Ejercicio, CrearEjercicioPayload } from '../../../../core/services/ejercicios.service';
import { environment } from '../../../../../environments/environment';
import { Observable, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

export interface EjercicioUI {
  idEjercicio: number;
  nombre: string;
  grupoMuscular: string;
  equipoNecesario: string;
  explicacionTecnica: string;
  urlImagen: string;
  dificultad: number;
  caloriasPorMinuto: number;
  activo: boolean;
  selected?: boolean;
}

@Component({
  selector: 'app-ejercicios',
  templateUrl: './ejercicios.component.html',
  styleUrls: ['./ejercicios.component.scss']
})
export class EjerciciosComponent implements OnInit {

  public isLoading: boolean = true;

  public ejercicios: EjercicioUI[] = [];
  public ejerciciosFiltrados: EjercicioUI[] = [];

  // Stats
  public totalEjercicios: number = 0;
  public totalActivos: number = 0;
  public totalGrupos: number = 0;
  public dificultadPromedio: number = 0;

  // Filtros
  public filtroNombre: string = '';
  public filtroGrupo: string = '';
  public filtroDificultad: string = '';

  // Catalogos
  public gruposMusculares: string[] = [];
  public equipos: string[] = [];

  public dificultades = [
    { value: '', label: 'Todas' },
    { value: '1', label: '1 - Muy facil' },
    { value: '2', label: '2 - Facil' },
    { value: '3', label: '3 - Intermedio' },
    { value: '4', label: '4 - Dificil' },
    { value: '5', label: '5 - Muy dificil' }
  ];

  // Modal crear/editar
  public showFormModal: boolean = false;
  public modoEdicion: boolean = false;
  public isSaving: boolean = false;
  public form: CrearEjercicioPayload = this.getFormVacio();
  public imagenPreview: string = '';
  public selectedFile: File | null = null;
  public uploadingImage: boolean = false;
  public usarUrlManual: boolean = false;

  // Modal eliminar individual
  public showDeleteModal: boolean = false;
  public ejercicioAEliminar: EjercicioUI | null = null;
  public isDeleting: boolean = false;

  // Modal error
  public showErrorModal: boolean = false;
  public errorModalTitle: string = 'Error';
  public errorModalMessage: string = '';

  // Modal exito
  public showSuccessModal: boolean = false;
  public successModalMessage: string = '';

  public environment = environment;

  constructor(
    private ejerciciosService: EjerciciosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarEjercicios();
  }

  cargarEjercicios(): void {
    this.isLoading = true;

    const filtros: any = {};
    if (this.filtroNombre.trim()) filtros.nombre = this.filtroNombre.trim();
    if (this.filtroGrupo) filtros.grupoMuscular = this.filtroGrupo;
    if (this.filtroDificultad) {
      filtros.dificultadMin = Number(this.filtroDificultad);
      filtros.dificultadMax = Number(this.filtroDificultad);
    }

    this.ejerciciosService.getEjercicios(filtros).subscribe({
      next: (response: any) => {
        let lista: Ejercicio[] = [];
        if (response && Array.isArray(response.data)) {
          lista = response.data;
        } else if (Array.isArray(response)) {
          lista = response;
        }

        this.ejercicios = lista.map(e => ({ ...this.mapearEjercicio(e), selected: false }));
        this.ejerciciosFiltrados = [...this.ejercicios];

        this.calcularStats();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar ejercicios:', error);
        this.isLoading = false;

        let mensaje = 'Error al cargar los ejercicios.';
        if (error.status === 401) {
          mensaje = 'Tu sesion ha expirado. Inicia sesion nuevamente.';
        } else if (error.status === 404) {
          this.ejercicios = [];
          this.ejerciciosFiltrados = [];
          this.calcularStats();
          return;
        }

        this.mostrarError('Error al cargar', mensaje);
      }
    });
  }

  private mapearEjercicio(e: any): EjercicioUI {
    return {
      idEjercicio: e.idEjercicio || e.id || 0,
      nombre: e.nombre || 'Sin nombre',
      grupoMuscular: e.grupoMuscular || 'General',
      equipoNecesario: e.equipoNecesario || 'Sin equipo',
      explicacionTecnica: e.explicacionTecnica || '',
      urlImagen: e.urlImagen || '',
      dificultad: e.dificultad || 1,
      caloriasPorMinuto: e.caloriasPorMinuto || 0,
      activo: e.activo !== undefined ? e.activo : true
    };
  }

  cargarCatalogos(): void {
    this.ejerciciosService.getGruposMusculares().subscribe({
      next: (response: any) => {
        this.gruposMusculares = this.extraerListaStrings(response);
      },
      error: (err: any) => {
        console.error('Error al cargar grupos musculares:', err);
        this.gruposMusculares = [];
      }
    });

    this.ejerciciosService.getEquipos().subscribe({
      next: (response: any) => {
        this.equipos = this.extraerListaStrings(response);
      },
      error: (err: any) => {
        console.error('Error al cargar equipos:', err);
        this.equipos = [];
      }
    });
  }

  private extraerListaStrings(response: any): string[] {
    if (!response) return [];
    if (Array.isArray(response) && response.every(item => typeof item === 'string')) {
      return response;
    }
    if (Array.isArray(response)) {
      return response
        .map(item => {
          if (typeof item === 'string') return item;
          return item?.nombre || item?.name || item?.valor || item?.grupoMuscular || item?.equipo || '';
        })
        .filter((s: string) => !!s);
    }
    if (response.data && Array.isArray(response.data)) {
      return this.extraerListaStrings(response.data);
    }
    if (response.items && Array.isArray(response.items)) {
      return this.extraerListaStrings(response.items);
    }
    return [];
  }

  private calcularStats(): void {
    this.totalEjercicios = this.ejercicios.length;
    this.totalActivos = this.ejercicios.filter(e => e.activo).length;
    this.totalGrupos = new Set(this.ejercicios.map(e => e.grupoMuscular)).size;

    if (this.ejercicios.length === 0) {
      this.dificultadPromedio = 0;
    } else {
      const suma = this.ejercicios.reduce((acc, e) => acc + e.dificultad, 0);
      this.dificultadPromedio = Math.round((suma / this.ejercicios.length) * 10) / 10;
    }
  }

  get ejerciciosSeleccionadosCount(): number {
    return this.ejercicios.filter(e => e.selected).length;
  }

  get todosSeleccionados(): boolean {
    if (this.ejercicios.length === 0) return false;
    return this.ejercicios.every(e => e.selected);
  }

  toggleSeleccionarTodos(event: any): void {
    const checked = event.target.checked;
    this.ejercicios.forEach(e => e.selected = checked);
  }

  async eliminarEjerciciosEnLote(): Promise<void> {
    const seleccionados = this.ejercicios.filter(e => e.selected && e.idEjercicio);
    if (seleccionados.length === 0) return;

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminarán ${seleccionados.length} ejercicio(s) seleccionados. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    });

    if (result.isConfirmed) {
      this.isLoading = true;
      const peticiones = seleccionados.map(e => this.ejerciciosService.eliminarEjercicio(e.idEjercicio));

      forkJoin(peticiones).subscribe({
        next: () => {
          this.isLoading = false;
          this.successModalMessage = 'Ejercicios eliminados correctamente';
          this.showSuccessModal = true;
          this.cargarEjercicios();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al eliminar ejercicios en lote', err);
          this.mostrarError('Error', 'No se pudieron eliminar algunos ejercicios seleccionados.');
          this.cargarEjercicios();
        }
      });
    }
  }

  onFiltroChange(): void {
    this.cargarEjercicios();
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroGrupo = '';
    this.filtroDificultad = '';
    this.cargarEjercicios();
  }

  get hayFiltros(): boolean {
    return !!(this.filtroNombre || this.filtroGrupo || this.filtroDificultad);
  }

  verEjercicio(ejercicio: EjercicioUI): void {
    this.router.navigate(['/trainer/ejercicios', ejercicio.idEjercicio]);
  }

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.form = this.getFormVacio();
    this.imagenPreview = '';
    this.selectedFile = null;
    this.usarUrlManual = false;
    this.showFormModal = true;
  }

  abrirModalEditar(ejercicio: EjercicioUI): void {
    this.modoEdicion = true;
    this.form = {
      nombre: ejercicio.nombre,
      grupoMuscular: ejercicio.grupoMuscular,
      equipoNecesario: ejercicio.equipoNecesario,
      explicacionTecnica: ejercicio.explicacionTecnica,
      urlImagen: ejercicio.urlImagen,
      dificultad: ejercicio.dificultad,
      caloriasPorMinuto: ejercicio.caloriasPorMinuto,
      activo: ejercicio.activo
    };
    (this.form as any).idEjercicio = ejercicio.idEjercicio;
    this.imagenPreview = ejercicio.urlImagen || '';
    this.selectedFile = null;
    this.usarUrlManual = false;
    this.showFormModal = true;
  }

  cerrarFormModal(): void {
    this.showFormModal = false;
    this.selectedFile = null;
    this.imagenPreview = '';
    this.usarUrlManual = false;
  }

  toggleUrlManual(): void {
    this.usarUrlManual = !this.usarUrlManual;
    if (this.usarUrlManual) {
      this.selectedFile = null;
    }
  }

  onUrlManualChange(): void {
    if (this.form.urlImagen) {
      this.imagenPreview = this.form.urlImagen;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.mostrarError('Imagen invalida', 'Por favor selecciona una imagen valida (JPG, PNG, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.mostrarError('Imagen muy grande', 'La imagen no puede superar los 5MB.');
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagenPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  abrirSelectorArchivo(): void {
    const fileInput = document.getElementById('ejercicioFileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  private subirImagen(): Observable<string> {
    return new Observable(observer => {
      if (this.usarUrlManual || !this.selectedFile) {
        observer.next(this.form.urlImagen);
        observer.complete();
        return;
      }

      if (!environment.cloudinary?.cloudName || !environment.cloudinary?.uploadPreset) {
        observer.error(new Error('Cloudinary no esta configurado. Usa el modo URL manual.'));
        return;
      }

      this.uploadingImage = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('upload_preset', environment.cloudinary.uploadPreset);
      formData.append('cloud_name', environment.cloudinary.cloudName);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;

      this.uploadToCloudinary(cloudinaryUrl, formData).subscribe({
        next: (response: any) => {
          this.uploadingImage = false;
          const imageUrl = response.secure_url || response.url;
          observer.next(imageUrl);
          observer.complete();
        },
        error: (err: any) => {
          this.uploadingImage = false;
          observer.error(err);
        }
      });
    });
  }

  private uploadToCloudinary(url: string, formData: FormData): Observable<any> {
    return new Observable((observer: any) => {
      fetch(url, { method: 'POST', body: formData })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.error?.message || `Error ${response.status} al subir imagen`);
            });
          }
          return response.json();
        })
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  guardar(): void {
    const nombreTrim = this.form.nombre.trim();

    if (!nombreTrim) {
      this.mostrarError('Campos incompletos', 'El nombre es obligatorio.');
      return;
    }

    if (nombreTrim.length > 100) {
      this.mostrarError('Título muy extenso', 'El nombre del ejercicio no puede superar los 100 caracteres.');
      return;
    }

    if (!this.form.grupoMuscular) {
      this.mostrarError('Campos incompletos', 'El grupo muscular es obligatorio.');
      return;
    }

    if (this.form.dificultad < 1 || this.form.dificultad > 5) {
      this.mostrarError('Dificultad inválida', 'La dificultad debe estar entre 1 y 5.');
      return;
    }

    if (this.form.caloriasPorMinuto < 0) {
      this.mostrarError('Valor inválido', 'Las calorías por minuto no pueden ser un valor negativo.');
      return;
    }

    this.isSaving = true;

    this.subirImagen().subscribe({
      next: (imageUrl: string) => {
        const activoFinal = this.modoEdicion ? this.form.activo : true;

        const payload: CrearEjercicioPayload = {
          nombre: nombreTrim,
          grupoMuscular: this.form.grupoMuscular,
          equipoNecesario: this.form.equipoNecesario || 'Sin equipo',
          explicacionTecnica: this.form.explicacionTecnica || '',
          urlImagen: imageUrl || '',
          dificultad: Number(this.form.dificultad),
          caloriasPorMinuto: Number(this.form.caloriasPorMinuto) || 0,
          activo: activoFinal
        };

        if (this.modoEdicion) {
          const id = (this.form as any).idEjercicio;
          this.ejerciciosService.actualizarEjercicio(id, payload).subscribe({
            next: () => this.onGuardadoExitoso('Ejercicio actualizado correctamente'),
            error: (err) => this.onErrorGuardado(err)
          });
        } else {
          this.ejerciciosService.crearEjercicio(payload).subscribe({
            next: () => this.onGuardadoExitoso('Ejercicio creado correctamente'),
            error: (err) => this.onErrorGuardado(err)
          });
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.mostrarError('Error al subir imagen', err.message || 'No se pudo subir la imagen.');
      }
    });
  }

  private onGuardadoExitoso(mensaje: string): void {
    this.isSaving = false;
    this.cerrarFormModal();
    this.successModalMessage = mensaje;
    this.showSuccessModal = true;
    this.cargarEjercicios();
  }

  private onErrorGuardado(err: any): void {
    this.isSaving = false;
    const mensaje = err.error?.message || 'No se pudo guardar el ejercicio.';
    this.mostrarError('Error al guardar', mensaje);
  }

  abrirModalEliminar(ejercicio: EjercicioUI): void {
    this.ejercicioAEliminar = ejercicio;
    this.showDeleteModal = true;
  }

  cerrarDeleteModal(): void {
    this.showDeleteModal = false;
    this.ejercicioAEliminar = null;
  }

  confirmarEliminar(): void {
    if (!this.ejercicioAEliminar) return;

    this.isDeleting = true;
    const id = this.ejercicioAEliminar.idEjercicio;

    this.ejerciciosService.eliminarEjercicio(id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.cerrarDeleteModal();
        this.successModalMessage = 'Ejercicio eliminado correctamente';
        this.showSuccessModal = true;
        this.cargarEjercicios();
      },
      error: (err) => {
        this.isDeleting = false;
        this.cerrarDeleteModal();
        this.mostrarError('Error al eliminar', err.error?.message || 'No se pudo eliminar el ejercicio.');
      }
    });
  }

  mostrarError(titulo: string, mensaje: string): void {
    this.errorModalTitle = titulo;
    this.errorModalMessage = mensaje;
    this.showErrorModal = true;
  }

  cerrarErrorModal(): void {
    this.showErrorModal = false;
  }

  cerrarSuccessModal(): void {
    this.showSuccessModal = false;
  }

  private getFormVacio(): CrearEjercicioPayload {
    return {
      nombre: '',
      grupoMuscular: '',
      equipoNecesario: '',
      explicacionTecnica: '',
      urlImagen: '',
      dificultad: 3,
      caloriasPorMinuto: 0,
      activo: true
    };
  }

  getDificultadLabel(d: number): string {
    const labels = ['', 'Muy facil', 'Facil', 'Intermedio', 'Dificil', 'Muy dificil'];
    return labels[d] || 'Intermedio';
  }

  getDificultadClass(d: number): string {
    const clases = ['', 'nivel-1', 'nivel-2', 'nivel-3', 'nivel-4', 'nivel-5'];
    return clases[d] || 'nivel-3';
  }

  // Agrega esta propiedad pública en la clase EjerciciosComponent:
  public isSidebarOpen: boolean = false;

  // Y añade estos métodos al final de la clase:
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}