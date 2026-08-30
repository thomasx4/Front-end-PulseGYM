import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PhysicalHistoryService } from '../../../../../core/services/physical-history.service';
import { UserService } from '../../../../../core/services/user.service';
import { PhysicalHistory } from '../../../../../core/models/physical-history';

@Component({
  selector: 'app-physical-history-list',
  templateUrl: './physical-history-list.component.html',
  styleUrls: ['./physical-history-list.component.scss']
})
export class PhysicalHistoryListComponent implements OnInit {
  records: PhysicalHistory[] = [];
  filteredRecords: PhysicalHistory[] = [];
  paginatedRecords: PhysicalHistory[] = [];
  loading: boolean = false;
  searchQuery: string = '';

  userProfilesMap: Map<number, any> = new Map<number, any>();
  
  // Set para rastrear los IDs de historiales cuyos avatares fallaron al cargar
  failedAvatars: Set<number> = new Set<number>();

  selectedSocioId: string = 'ALL';
  uniqueSocios: { id: number; name: string }[] = [];

  startDate: string = '';
  endDate: string = '';

  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 1;
  pagesArray: number[] = [];

  totalRecords: number = 0;
  firstDate: string = '-';
  lastDate: string = '-';
  avgDaysBetween: number = 0;

  constructor(
    private physicalHistoryService: PhysicalHistoryService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsersAndData();
  }

  loadUsersAndData(): void {
    this.loading = true;
    this.userService.obtenerTodosLosPerfiles().subscribe({
      next: (users: any[]) => {
        if (users && users.length) {
          users.forEach(u => {
            const key = u.idUsuario || u.id;
            if (key) {
              this.userProfilesMap.set(key, u);
            }
          });
        }
        this.fetchData();
      },
      error: (err) => {
        console.error('Error al cargar mapa de usuarios para fotos:', err);
        this.fetchData();
      }
    });
  }

  fetchData(): void {
    this.physicalHistoryService.getAll().subscribe({
      next: (data) => {
        this.records = this.calculateTrends(data);
        this.extractUniqueSocios();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener historiales físicos:', err);
        this.loading = false;
      }
    });
  }

  // Extrae la URL de foto de Cloudinary o perfil
  getUserFoto(item: PhysicalHistory): string | null {
    if (!item) return null;

    const userId = item.idRecepcionista || item.idSocio;
    const profile = this.userProfilesMap.get(userId);

    let rawUrl = 
      (item as any).fotoUrl ||
      (item as any).fotoPerfil ||
      (item as any).foto ||
      profile?.fotoUrl || 
      profile?.fotoPerfil || 
      profile?.foto || 
      profile?.avatar ||
      null;

    if (!rawUrl || typeof rawUrl !== 'string') return null;

    rawUrl = rawUrl.trim();
    if (rawUrl === '' || rawUrl === 'null' || rawUrl === 'undefined') return null;

    if (rawUrl.startsWith('//')) {
      return `https:${rawUrl}`;
    }

    return rawUrl;
  }

  onAvatarError(idHistorial: number): void {
    if (idHistorial) {
      this.failedAvatars.add(idHistorial);
    }
  }

  hasAvatarError(idHistorial: number): boolean {
    return this.failedAvatars.has(idHistorial);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
        (r.nombreRecepcionista && r.nombreRecepcionista.toLowerCase().includes(query));

      let matchesDateRange = true;
      if (r.fechaMedicion) {
        const recordDate = new Date(r.fechaMedicion);

        if (this.startDate) {
          const start = new Date(this.startDate + 'T00:00:00');
          matchesDateRange = matchesDateRange && recordDate >= start;
        }

        if (this.endDate) {
          const end = new Date(this.endDate + 'T23:59:59');
          matchesDateRange = matchesDateRange && recordDate <= end;
        }
      }

      return matchesSocio && matchesSearch && matchesDateRange;
    });

    this.currentPage = 1;
    this.updatePagination();
    this.calculateKPIs();
  }

  clearDates(): void {
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRecords.length / this.pageSize) || 1;
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRecords = this.filteredRecords.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  get startIndex(): number {
    return this.filteredRecords.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredRecords.length);
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