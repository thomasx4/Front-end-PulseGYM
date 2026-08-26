import { Component, Input, OnInit, OnDestroy } from '@angular/core';
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

  // SUSCRIPCIÓN AL USUARIO AUTENTICADO
  private userSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  // INICIALIZAR COMPONENTE
  ngOnInit(): void {
    this.userSubscription = this.authService.getCurrentUser().subscribe((user: User | null) => {
      if (user) {
        if (user.name && user.name !== 'Usuario') {
          this.userName = user.name;
        } else if (user.email) {
          const nameFromEmail = user.email.split('@')[0];
          this.userName = nameFromEmail
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
        }
        this.userRole = user.role || this.userRole;
        this.updateAvatarUrl(this.userName);
      }
    });
  }

  // DESTRUIR COMPONENTE
  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  // ACTUALIZAR AVATAR
  private updateAvatarUrl(name: string): void {
    const encodedName = encodeURIComponent(name);
    this.avatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=0F1C3F&color=fff&bold=true`;
  }
}