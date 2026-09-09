import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../../../core/services/payment.service';

@Component({
  selector: 'app-payment-reports',
  templateUrl: './payment-reports.component.html',
  styleUrls: ['./payment-reports.component.scss']
})
export class PaymentReportsComponent implements OnInit {

  fechaDiaria: string = new Date().toISOString().slice(0, 10);
  totalDiario: number = 0;
  cantidadPagosDiarios: number = 0;
  cargandoDiario: boolean = false;

  mesMensual: number = new Date().getMonth() + 1;
  anioMensual: number = 2026;
  totalMensual: number = 0;
  totalPagosMensuales: number = 0;
  cargandoMensual: boolean = false;

  exportando: boolean = false;

  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  constructor(private paymentService: PaymentService) { }

  ngOnInit(): void {
    this.cargarIngresosDiarios();
    this.cargarIngresosMensuales();
  }

  cargarIngresosDiarios(): void {
    if (!this.fechaDiaria) return;
    this.cargandoDiario = true;

    this.paymentService.obtenerIngresosDiarios(this.fechaDiaria).subscribe({
      next: (res) => {
        this.totalDiario = res?.totalIngresos || 0;
        this.cantidadPagosDiarios = res?.cantidadPagos || 0;
        this.cargandoDiario = false;
      },
      error: (err) => {
        console.error('Error al obtener ingresos diarios:', err);
        this.totalDiario = 0;
        this.cantidadPagosDiarios = 0;
        this.cargandoDiario = false;
      }
    });
  }

  cargarIngresosMensuales(): void {
    this.cargandoMensual = true;

    const mesNum = Number(this.mesMensual);
    const anioNum = Number(this.anioMensual);

    this.paymentService.obtenerIngresosMensuales(mesNum, anioNum).subscribe({
      next: (res: any) => {
        console.log('Respuesta Endpoint 11 (Mensual):', res);

        this.totalMensual = res?.totalGeneral ?? 0;

        if (Array.isArray(res?.detalle)) {
          this.totalPagosMensuales = res.detalle.length;
        } else {
          this.totalPagosMensuales = res?.totalPagos ?? 0;
        }

        this.cargandoMensual = false;
      },
      error: (err) => {
        console.error('Error al obtener ingresos mensuales:', err);
        this.totalMensual = 0;
        this.totalPagosMensuales = 0;
        this.cargandoMensual = false;
      }
    });
  }

  exportarDiarioPdf(): void {
    this.exportando = true;
    this.paymentService.exportarIngresosDiariosPdf(this.fechaDiaria).subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, `Ingresos_Diarios_${this.fechaDiaria}.pdf`);
        this.exportando = false;
      },
      error: () => this.exportando = false
    });
  }

  exportarDiarioExcel(): void {
    this.exportando = true;
    this.paymentService.exportarIngresosDiariosExcel(this.fechaDiaria).subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, `Ingresos_Diarios_${this.fechaDiaria}.xlsx`);
        this.exportando = false;
      },
      error: () => this.exportando = false
    });
  }

  exportarMensualPdf(): void {
    this.exportando = true;
    this.paymentService.exportarIngresosMensualesPdf(this.mesMensual, this.anioMensual).subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, `Ingresos_Mensuales_${this.mesMensual}_${this.anioMensual}.pdf`);
        this.exportando = false;
      },
      error: () => this.exportando = false
    });
  }

  exportarMensualExcel(): void {
    this.exportando = true;
    this.paymentService.exportarIngresosMensualesExcel(this.mesMensual, this.anioMensual).subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, `Ingresos_Mensuales_${this.mesMensual}_${this.anioMensual}.xlsx`);
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