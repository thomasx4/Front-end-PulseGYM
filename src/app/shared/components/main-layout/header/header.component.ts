import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../features/auth/models/auth/auth.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  // DATOS DEL USUARIO (recibidos desde el padre)
  @Input() userName: string = 'Usuario';
  @Input() userRole: string = 'Socio';
  @Input() avatarUrl: string = '';

  // EVENTO PARA BÚSQUEDA
  @Output() search = new EventEmitter<string>();

  // SUSCRIPCIÓN AL USUARIO AUTENTICADO
  private userSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  // INICIALIZAR COMPONENTE
  ngOnInit(): void {
    this.userSubscription = this.authService.getCurrentUser().subscribe((user: User | null) => {
      if (user) {
        // Asignar nombre del usuario
        if (user.name && user.name !== 'Usuario') {
          this.userName = user.name;
        } else if (user.email) {
          // Extraer nombre del email si no hay nombre disponible
          const nameFromEmail = user.email.split('@')[0];
          this.userName = nameFromEmail
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
        }
        // Asignar rol
        this.userRole = user.role || this.userRole;
        // Generar avatar
        this.updateAvatarUrl(this.userName);
      }
    });
  }

  // DESTRUIR COMPONENTE - Limpiar suscripciones
  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  // MANEJAR BÚSQUEDA - Emitir evento al padre
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }

  // ACTUALIZAR AVATAR - Generar URL con iniciales
  private updateAvatarUrl(name: string): void {
    const encodedName = encodeURIComponent(name);
    this.avatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=0F1C3F&color=fff&bold=true`;
  }
}