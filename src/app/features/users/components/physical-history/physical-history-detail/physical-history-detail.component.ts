import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PhysicalHistoryService } from '../../../../../core/services/physical-history.service';
import { PhysicalHistory } from '../../../../../core/models/physical-history';

@Component({
  selector: 'app-physical-history-detail',
  templateUrl: './physical-history-detail.component.html',
  styleUrls: ['./physical-history-detail.component.scss']
})
export class PhysicalHistoryDetailComponent implements OnInit {
  record: PhysicalHistory | null = null;
  idHistorial: number | null = null;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private physicalHistoryService: PhysicalHistoryService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.idHistorial = +params['id'];
        this.loadDetail(this.idHistorial);
      }
    });
  }

  loadDetail(id: number): void {
    this.loading = true;
    this.physicalHistoryService.getAll().subscribe({
      next: (records) => {
        const found = records.find(r => r.idHistorialFisico === id);
        if (found) {
          this.record = found;
        } else {
          console.error('Registro de historial físico no encontrado');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener el detalle del historial:', err);
        this.loading = false;
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'PG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  onBack(): void {
    this.router.navigate(['/dashboard-admin/users/physical-history']);
  }

  onEdit(): void {
    if (this.idHistorial) {
      this.router.navigate(['/dashboard-admin/users/physical-history/edit', this.idHistorial]);
    }
  }

  onNewMedicion(): void {
    this.router.navigate(['/dashboard-admin/users/physical-history/new']);
  }
}