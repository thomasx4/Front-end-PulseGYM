import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PhysicalHistoryService } from '../../../../../core/services/physical-history.service';
import { PhysicalHistory } from '../../../../../core/models/physical-history';

@Component({
  selector: 'app-physical-history-list',
  templateUrl: './physical-history-list.component.html',
  styleUrls: ['./physical-history-list.component.scss']
})
export class PhysicalHistoryListComponent implements OnInit {
  records: PhysicalHistory[] = [];
  filteredRecords: PhysicalHistory[] = [];
  loading: boolean = false;
  searchQuery: string = '';

  selectedSocioId: string = 'ALL';
  uniqueSocios: { id: number; name: string }[] = [];

  totalRecords: number = 0;
  firstDate: string = '-';
  lastDate: string = '-';
  avgDaysBetween: number = 0;

  constructor(
    private physicalHistoryService: PhysicalHistoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.physicalHistoryService.getAll().subscribe({
      next: (data) => {
        this.records = this.calculateTrends(data);
        this.extractUniqueSocios();
        this.applyFilters();
        this.calculateKPIs();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener historiales físicos:', err);
        this.loading = false;
      }
    });
  }

  private calculateTrends(data: PhysicalHistory[]): PhysicalHistory[] {
    const sorted = [...data].sort((a, b) => 
      new Date(a.fechaMedicion).getTime() - new Date(b.fechaMedicion).getTime()
    );

    const socioHistoryMap = new Map<number, PhysicalHistory[]>();
    sorted.forEach(item => {
      if (!socioHistoryMap.has(item.idSocio)) {
        socioHistoryMap.set(item.idSocio, []);
      }
      socioHistoryMap.get(item.idSocio)!.push(item);
    });

    socioHistoryMap.forEach((historyList) => {
      historyList.forEach((item, index) => {
        if (index === 0) {
          item.tendenciaPeso = 'EQUAL';
          item.tendenciaGrasa = 'EQUAL';
          item.tendenciaMusculo = 'EQUAL';
        } else {
          const prev = historyList[index - 1];
          item.tendenciaPeso = item.pesoKg > prev.pesoKg ? 'UP' : item.pesoKg < prev.pesoKg ? 'DOWN' : 'EQUAL';
          item.tendenciaGrasa = item.porcentajeGrasa > prev.porcentajeGrasa ? 'UP' : item.porcentajeGrasa < prev.porcentajeGrasa ? 'DOWN' : 'EQUAL';
          item.tendenciaMusculo = item.porcentajeMusculo > prev.porcentajeMusculo ? 'UP' : item.porcentajeMusculo < prev.porcentajeMusculo ? 'DOWN' : 'EQUAL';
        }
      });
    });

    return data.sort((a, b) => 
      new Date(b.fechaMedicion).getTime() - new Date(a.fechaMedicion).getTime()
    );
  }

  private extractUniqueSocios(): void {
    const map = new Map<number, string>();
    this.records.forEach(r => map.set(r.idSocio, r.nombreSocio));
    this.uniqueSocios = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  applyFilters(): void {
    this.filteredRecords = this.records.filter(r => {
      const matchesSocio = this.selectedSocioId === 'ALL' || r.idSocio === Number(this.selectedSocioId);
      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        r.nombreSocio.toLowerCase().includes(query) || 
        (r.nombreRecepcionista && r.nombreRecepcionista.toLowerCase().includes(query)) ||
        r.fechaMedicion.toLowerCase().includes(query);

      return matchesSocio && matchesSearch;
    });
  }

  private calculateKPIs(): void {
    this.totalRecords = this.filteredRecords.length;
    if (this.totalRecords > 0) {
      const dates = this.filteredRecords
        .map(r => new Date(r.fechaMedicion).getTime())
        .sort((a, b) => a - b);
      
      this.firstDate = new Date(dates[0]).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      this.lastDate = new Date(dates[dates.length - 1]).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

      if (dates.length > 1) {
        const diffTime = Math.abs(dates[dates.length - 1] - dates[0]);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        this.avgDaysBetween = Math.round(diffDays / (dates.length - 1));
      } else {
        this.avgDaysBetween = 0;
      }
    } else {
      this.firstDate = '-';
      this.lastDate = '-';
      this.avgDaysBetween = 0;
    }
  }

  getAvatarUrl(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F1C3F&color=fff&bold=true`;
  }

  onNewMedicion(): void {
    this.router.navigate(['/dashboard-admin/users/physical-history/new']);
  }

  onViewDetail(id: number): void {
    this.router.navigate(['/dashboard-admin/users/physical-history/detail', id]);
  }

  onEdit(id: number): void {
    this.router.navigate(['/dashboard-admin/users/physical-history/edit', id]);
  }
}