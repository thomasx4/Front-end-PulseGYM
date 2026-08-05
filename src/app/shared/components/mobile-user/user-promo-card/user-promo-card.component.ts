/**
 * Tarjeta promocional para el dashboard de usuario
 */
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-promo-card',
  templateUrl: './user-promo-card.component.html',
  styleUrls: ['./user-promo-card.component.scss']
})
export class UserPromoCardComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() actionLabel: string = '';
  @Input() imageUrl: string = '';
}