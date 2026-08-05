import { Component, Input } from '@angular/core';

export type BadgeVarient = 'activo' | 'inactivo';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})

export class StatusBadgeComponent {
    @Input() texto: string = '';
    @Input() variante: BadgeVarient = 'inactivo';
}
