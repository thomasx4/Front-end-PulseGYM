import { Component, OnInit } from '@angular/core';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier } from '../../models/suppliers.model';

@Component({
  selector: 'app-supplier-list',
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.scss']
})
export class SupplierListComponent implements OnInit {

  proveedores: Supplier[] = [];
  busquedaTexto: string = '';

  cargando: boolean = false;
  errorMensaje: string = '';
  mostrarModalRegistro: boolean = false;

  totalProveedores: number = 0;
  totalEquiposSuministrados: number = 0;
  proveedorPrincipalNombre: string = 'N/A';
  proveedorPrincipalCant: number = 0;

  constructor(private supplierService: SupplierService) { }

  ngOnInit(): void {
    this.cargarProveedores();
  }

  cargarProveedores(): void {
    this.errorMensaje = '';

    this.supplierService.obtenerTodos().subscribe({
      next: (data: Supplier[]) => {
        this.proveedores = data;
        this.calcularMetricas(data);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener proveedores:', err);
        this.errorMensaje = 'No se pudo cargar la lista de proveedores. Por favor intente más tarde.';
        this.cargando = false;
      }
    });
  }

  buscar(): void {
    if (!this.busquedaTexto.trim()) {
      this.cargarProveedores();
      return;
    }

    this.cargando = true;
    this.errorMensaje = '';

    this.supplierService.buscarPorNombre(this.busquedaTexto.trim()).subscribe({
      next: (data: Supplier[]) => {
        this.proveedores = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al buscar proveedores:', err);
        this.errorMensaje = 'Ocurrió un error al buscar proveedores.';
        this.cargando = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.busquedaTexto = '';
    this.cargarProveedores();
  }

  calcularMetricas(lista: Supplier[]): void {
    this.totalProveedores = lista.length;
    this.totalEquiposSuministrados = lista.reduce((sum, item) => sum + (item.cantidadEquipos || 0), 0);

    if (lista.length > 0) {
      const topProveedor = lista.reduce((max, item) =>
        ((item.cantidadEquipos || 0) > (max.cantidadEquipos || 0)) ? item : max
        , lista[0]);

      this.proveedorPrincipalNombre = topProveedor.nombreEmpresa || 'N/A';
      this.proveedorPrincipalCant = topProveedor.cantidadEquipos || 0;
    } else {
      this.proveedorPrincipalNombre = 'N/A';
      this.proveedorPrincipalCant = 0;
    }
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'PR';
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  abrirModalRegistro(): void {
    this.mostrarModalRegistro = true;
  }

  cerrarModalRegistro(): void {
    this.mostrarModalRegistro = false;
  }

  onProveedorGuardado(): void {
    this.cerrarModalRegistro();
    this.cargarProveedores();
  }
}