import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PhysicalHistoryService, FiltrosHistorialFisico } from '../../../../../core/services/physical-history.service';
import { UserService } from '../../../../../core/services/user.service';
import { PhysicalHistory } from '../../../../../core/models/physical-history';

@Component({
  selector: 'app-physical-history-list',
  templateUrl: './physical-history-list.component.html',
  styleUrls: ['./physical-history-list.component.scss']
})
export class PhysicalHistoryListComponent implements OnInit {
  records: PhysicalHistory[] = [];
  paginatedRecords: PhysicalHistory[] = [];
  loading: boolean = false;
  searchQuery: string = '';

  userProfilesMap: Map<number, any> = new Map<number, any>();
  failedAvatars: Set<number> = new Set<number>();

  selectedSocioId: string = 'ALL';
  uniqueSocios: { id: number; name: string }[] = [];

  startDate: string = '';
  endDate: string = '';

  currentPage: number = 0;
  pageSize: number = 6;
  totalPages: number = 1;
  totalElements: number = 0;

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
    this.loading = true;

    const inicio = this.startDate ? `${this.startDate}T00:00:00` : undefined;
    const fin = this.endDate ? `${this.endDate}T23:59:59` : undefined;

    const filtros: FiltrosHistorialFisico = {
      pagina: this.currentPage,
      tamanio: this.pageSize,
      busqueda: this.searchQuery.trim() || undefined,
      idSocio: this.selectedSocioId !== 'ALL' ? Number(this.selectedSocioId) : undefined,
      fechaInicio: inicio,
      fechaFin: fin
    };

    this.physicalHistoryService.getAll(filtros).subscribe({
      next: (response: any) => {
        let rawData: PhysicalHistory[] = [];

        if (Array.isArray(response)) {
          rawData = response;
          this.totalElements = rawData.length;
          this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;
          this.paginatedRecords = rawData;
        } else {
          rawData = response.content || response.data || response.contenido || [];
          
          const totalElemVal = response.totalElements ?? response.totalElementos;
          this.totalElements = totalElemVal !== undefined && totalElemVal !== null ? totalElemVal : rawData.length;

          const totalPagVal = response.totalPages ?? response.totalPaginas;
          this.totalPages = totalPagVal !== undefined && totalPagVal !== null ? totalPagVal : (Math.ceil(this.totalElements / this.pageSize) || 1);

          const pageNumVal = response.number ?? response.currentPage ?? response.numeroPagina;
          this.currentPage = pageNumVal !== undefined && pageNumVal !== null ? pageNumVal : this.currentPage;

          this.paginatedRecords = rawData;
        }

        if (this.uniqueSocios.length === 0 && rawData.length > 0) {
          this.extractUniqueSocios(rawData);
        }

        this.records = this.calculateTrends(rawData);
        this.calculateKPIs(rawData);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al obtener historiales físicos:', err);
        this.paginatedRecords = [];
        this.totalElements = 0;
        this.totalPages = 1;
        this.loading = false;
      }
    });
  }

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

    return data;
  }

  private extractUniqueSocios(data: PhysicalHistory[]): void {
    const map = new Map<number, string>();
    data.forEach(r => map.set(r.idSocio, r.nombreSocio));
    this.uniqueSocios = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.fetchData();
  }

  clearDates(): void {
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  get pagesArray(): number[] {
    const maxVisibles = 5;
    let inicio = Math.max(0, this.currentPage - 2);
    let fin = inicio + maxVisibles;

    if (fin > this.totalPages) {
      fin = this.totalPages;
      inicio = Math.max(0, fin - maxVisibles);
    }

    const paginas: number[] = [];
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  goToPage(pZeroBased: number): void {
    if (pZeroBased >= 0 && pZeroBased < this.totalPages && pZeroBased !== this.currentPage) {
      this.currentPage = pZeroBased;
      this.fetchData();
    }
  }

  get startIndex(): number {
    return this.totalElements === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  private calculateKPIs(data: PhysicalHistory[]): void {
    this.totalRecords = this.totalElements;
    if (data.length > 0) {
      const dates = data
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