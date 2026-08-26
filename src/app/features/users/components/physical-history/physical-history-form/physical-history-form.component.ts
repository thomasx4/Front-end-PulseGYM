import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PhysicalHistoryService } from '../../../../../core/services/physical-history.service';
import { UserService } from '../../../../../core/services/user.service';
import { PhysicalHistoryRequest } from '../../../../../core/models/physical-history';

@Component({
  selector: 'app-physical-history-form',
  templateUrl: './physical-history-form.component.html',
  styleUrls: ['./physical-history-form.component.scss']
})
export class PhysicalHistoryFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  idHistorial: number | null = null;
  loading: boolean = false;
  submitting: boolean = false;

  sociosList: { id: number; name: string }[] = [];
  recepcionistasList: { id: number; name: string }[] = [];

  editMetaInfo = {
    fechaFormatted: '',
    registradoPor: ''
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private physicalHistoryService: PhysicalHistoryService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSelectOptions();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.idHistorial = +params['id'];
        this.loadRecordData(this.idHistorial);
      }
    });
  }

  private initForm(): void {
    const defaultDate = this.formatDateForInput(new Date());

    this.form = this.fb.group({
      idSocio: [null, [Validators.required]],
      idRecepcionista: [null],
      fechaMedicion: [defaultDate],
      pesoKg: [null, [Validators.required, Validators.min(0)]],
      porcentajeGrasa: [null, [Validators.min(0), Validators.max(100)]],
      porcentajeMusculo: [null, [Validators.min(0), Validators.max(100)]],
      cinturaCm: [null, [Validators.min(0)]],
      pechoCm: [null, [Validators.min(0)]],
      brazoIzqCm: [null, [Validators.min(0)]],
      brazoDerCm: [null, [Validators.min(0)]],
      piernaIzqCm: [null, [Validators.min(0)]],
      piernaDerCm: [null, [Validators.min(0)]]
    });
  }

  private loadSelectOptions(): void {
    this.userService.obtenerTodosLosPerfilesActivos().subscribe({
      next: (users: any[]) => {
        this.sociosList = users.map(u => ({
          id: u.idUsuario || u.id,
          name: `${u.nombre} ${u.apellido}`
        }));
        this.recepcionistasList = [...this.sociosList];
      },
      error: () => {
  
      }
    });
  }

  private loadRecordData(id: number): void {
    this.loading = true;
    this.physicalHistoryService.getAll().subscribe({
      next: (records) => {
        const item = records.find(r => r.idHistorialFisico === id);
        if (item) {
          this.form.patchValue({
            idSocio: item.idSocio,
            idRecepcionista: item.idRecepcionista || null,
            fechaMedicion: item.fechaMedicion ? this.formatDateForInput(new Date(item.fechaMedicion)) : '',
            pesoKg: item.pesoKg,
            porcentajeGrasa: item.porcentajeGrasa,
            porcentajeMusculo: item.porcentajeMusculo,
            cinturaCm: item.cinturaCm,
            pechoCm: item.pechoCm,
            brazoIzqCm: item.brazoIzqCm,
            brazoDerCm: item.brazoDerCm,
            piernaIzqCm: item.piernaIzqCm,
            piernaDerCm: item.piernaDerCm
          });

          this.editMetaInfo = {
            fechaFormatted: item.fechaMedicion ? new Date(item.fechaMedicion).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
            registradoPor: item.nombreRecepcionista || 'Sistema'
          };
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar medición:', err);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const rawVal = this.form.value;

    const payload: PhysicalHistoryRequest = {
      idSocio: Number(rawVal.idSocio),
      idRecepcionista: rawVal.idRecepcionista ? Number(rawVal.idRecepcionista) : undefined,
      fechaMedicion: rawVal.fechaMedicion ? new Date(rawVal.fechaMedicion).toISOString() : undefined,
      pesoKg: Number(rawVal.pesoKg),
      porcentajeGrasa: rawVal.porcentajeGrasa ? Number(rawVal.porcentajeGrasa) : 0,
      porcentajeMusculo: rawVal.porcentajeMusculo ? Number(rawVal.porcentajeMusculo) : 0,
      cinturaCm: rawVal.cinturaCm ? Number(rawVal.cinturaCm) : 0,
      pechoCm: rawVal.pechoCm ? Number(rawVal.pechoCm) : 0,
      brazoIzqCm: rawVal.brazoIzqCm ? Number(rawVal.brazoIzqCm) : 0,
      brazoDerCm: rawVal.brazoDerCm ? Number(rawVal.brazoDerCm) : 0,
      piernaIzqCm: rawVal.piernaIzqCm ? Number(rawVal.piernaIzqCm) : 0,
      piernaDerCm: rawVal.piernaDerCm ? Number(rawVal.piernaDerCm) : 0
    };

    if (this.isEditMode && this.idHistorial) {
      this.physicalHistoryService.update(this.idHistorial, payload).subscribe({
        next: () => {
          this.submitting = false;
          this.onCancel();
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.submitting = false;
        }
      });
    } else {
      this.physicalHistoryService.create(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.onCancel();
        },
        error: (err) => {
          console.error('Error al crear:', err);
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard-admin/users/physical-history']);
  }

  private formatDateForInput(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}