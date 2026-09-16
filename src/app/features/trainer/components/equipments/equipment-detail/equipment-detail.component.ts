import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Equipo, RegistrarFallaPayload } from '../../../models/trainer.model';
import { SedeService } from '../../../../../core/services/sede.service';
import { SupplierService } from '../../../../../core/services/supplier.service';
import { Supplier } from '../../../models/trainer.model';
import { EquipmentService } from '../../../../../core/services/equipment.service';
import { MantenimientoItem } from '../../../models/trainer.model';

@Component({
  selector: 'app-equipment-detail',
  templateUrl: './equipment-detail.component.html',
  styleUrls: ['./equipment-detail.component.scss']
})
export class EquipmentDetailComponent implements OnChanges {

  @Input() equipo: Equipo | null = null;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() fallaReportada = new EventEmitter<void>();

  nombreSede: string = 'Cargando...';
  nombreProveedor: string = 'Cargando...';

  mostrandoFormFalla: boolean = false;
  guardandoFalla: boolean = false;

  urgenciaSeleccionada: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'NINGUNA' = 'MEDIA';
  descripcionFalla: string = '';

  historialMantenimientos: MantenimientoItem[] = [];
  cargandoMantenimientos: boolean = false;

  // ==========================================
  // Modales de estado
  // ==========================================
  mostrarModalError: boolean = false;
  modalErrorTitulo: string = 'Error';
  modalErrorMensaje: string = '';

  mostrarModalExito: boolean = false;
  modalExitoMensaje: string = '';

  constructor(
    private sedeService: SedeService,
    private supplierService: SupplierService,
    private equipmentService: EquipmentService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equipo'] && this.equipo) {
      this.cargarSede();
      this.cargarProveedor();
      this.mostrandoFormFalla = false;
      this.descripcionFalla = '';
      this.urgenciaSeleccionada = 'MEDIA';

      const eq = this.equipo as any;
      const id = eq?.idEquipo || eq?.id;

      if (id) {
        this.cargarHistorialMantenimiento(Number(id));
      }
    }
  }

  cargarHistorialMantenimiento(idEquipo: number): void {
    this.cargandoMantenimientos = true;
    this.equipmentService.obtenerHistorialMantenimiento(idEquipo).subscribe({
      next: (res) => {
        this.historialMantenimientos = res?.data || [];
        this.cargandoMantenimientos = false;
      },
      error: (err) => {
        console.error('Error al obtener el historial de mantenimientos:', err);
        this.historialMantenimientos = [];
        this.cargandoMantenimientos = false;
      }
    });
  }

  private cargarSede(): void {
    const eq = this.equipo as any;
    const idEquipo = eq?.idEquipo || eq?.id;

    const mapaSedes = JSON.parse(localStorage.getItem('pulse_equipos_sedes') || '{}');
    const idSede = eq?.idSede || eq?.sedeId || mapaSedes[idEquipo];

    this.sedeService.obtenerSedes().subscribe({
      next: (res: any) => {
        const listaSedes: any[] = Array.isArray(res) ? res : (res?.data || []);

        if (idSede) {
          const encontrada = listaSedes.find((s: any) => Number(s.idSede || s.id) === Number(idSede));
          this.nombreSede = encontrada ? (encontrada.nombreSede || encontrada.nombre) : `Sede #${idSede}`;
        } else {
          this.nombreSede = listaSedes[0]?.nombreSede || listaSedes[0]?.nombre || 'Sede N/A';
        }
      },
      error: () => this.nombreSede = 'Sede N/A'
    });
  }

  private cargarProveedor(): void {
    const eq = this.equipo as any;
    const idEquipo = eq?.idEquipo || eq?.id;

    const mapaProveedores = JSON.parse(localStorage.getItem('pulse_equipos_proveedores') || '{}');
    const idProveedor = eq?.idProveedor || eq?.proveedorId || mapaProveedores[idEquipo];

    this.supplierService.obtenerTodos().subscribe({
      next: (data: Supplier[]) => {
        const listaProv: Supplier[] = data || [];

        if (idProveedor) {
          const provEncontrado = listaProv.find((p: Supplier) => Number(p.idProveedor) === Number(idProveedor));
          this.nombreProveedor = provEncontrado ? provEncontrado.nombreEmpresa : `Proveedor #${idProveedor}`;
        } else {
          this.nombreProveedor = listaProv[0]?.nombreEmpresa || 'Proveedor Registrado';
        }
      },
      error: () => this.nombreProveedor = 'Proveedor Registrado'
    });
  }

  toggleFormFalla(): void {
    this.mostrandoFormFalla = !this.mostrandoFormFalla;
  }

  enviarReporteFalla(): void {
    const eq = this.equipo as any;
    const idEquipo = eq?.idEquipo || eq?.id;

    if (!idEquipo || !this.descripcionFalla.trim()) {
      this.mostrarError('Campos incompletos', 'Por favor escribe una descripción para la falla.');
      return;
    }

    this.guardandoFalla = true;
    const payload: RegistrarFallaPayload = {
      urgencia: this.urgenciaSeleccionada,
      descripcion: this.descripcionFalla.trim()
    };

    this.equipmentService.registrarFalla(idEquipo, payload).subscribe({
      next: (res) => {
        this.guardandoFalla = false;
        this.mostrandoFormFalla = false;

        // Actualización local rápida de la ficha
        if (this.equipo) {
          (this.equipo as any).urgenciaFalla = this.urgenciaSeleccionada;
          (this.equipo as any).descripcionFalla = this.descripcionFalla.trim();
        }

        this.mostrarExito('Falla reportada correctamente');
        this.fallaReportada.emit();
      },
      error: (err) => {
        console.error('Error al reportar la falla:', err);
        this.mostrarError(
          'No se pudo registrar la falla',
          err?.error?.message || 'Intenta de nuevo en unos momentos.'
        );
        this.guardandoFalla = false;
      }
    });
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }

  formatearEstado(estado?: string): string {
    if (!estado) return 'N/A';
    switch (estado) {
      case 'OPERATIVO': return 'OPERATIVO';
      case 'MANTENIMIENTO': return 'EN MANTENIMIENTO';
      case 'FUERA_DE_SERVICIO': return 'FUERA DE SERVICIO';
      default: return estado;
    }
  }

  // ==========================================
  // Modales
  // ==========================================
  mostrarError(titulo: string, mensaje: string): void {
    this.modalErrorTitulo = titulo;
    this.modalErrorMensaje = mensaje;
    this.mostrarModalError = true;
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
  }

  mostrarExito(mensaje: string): void {
    this.modalExitoMensaje = mensaje;
    this.mostrarModalExito = true;
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
  }
}