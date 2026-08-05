/**
 * Panel de acciones rapidas para el dashboard de usuario
 */
import { Component, Input } from '@angular/core';

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  variant: 'primary' | 'secondary';
}

@Component({
  selector: 'app-user-quick-actions',
  templateUrl: './user-quick-actions.component.html',
  styleUrls: ['./user-quick-actions.component.scss']
})
export class UserQuickActionsComponent {
  @Input() title: string = '';
  @Input() actions: QuickAction[] = [];
}