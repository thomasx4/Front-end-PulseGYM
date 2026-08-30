// src/app/shared/components/main-layout/header/header.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../features/auth/models/auth/auth.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() userName: string = 'Usuario';
  @Input() userRole: string = 'Socio';
  @Input() avatarUrl: string | null = null;

  hasAvatarError: boolean = false;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.getCurrentUser().subscribe((user: User | null) => {
      if (user) {
        // ✅ Asignar Nombre / Username
        if (user.username && user.username.trim() !== '') {
          this.userName = user.username;
        } else if (user.name && user.name !== 'Usuario') {
          this.userName = user.name;
        } else if (user.email) {
          const nameFromEmail = user.email.split('@')[0];
          this.userName = nameFromEmail
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
        }

        this.userRole = user.role || this.userRole;

        // ✅ Si el usuario ya tiene foto en el objeto (desde el backend)
        const directFoto = (user as any).fotoUrl || (user as any).fotoPerfil || (user as any).foto;
        if (directFoto && this.isValidUrl(directFoto)) {
          this.avatarUrl = this.formatUrl(directFoto);
        }
        // ✅ Si no tiene foto, intentar obtenerla desde el perfil completo
        else if (user.email) {
          this.cargarPerfilCompleto();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  private cargarPerfilCompleto(): void {
    this.userService.obtenerMiPerfil().pipe(
      catchError((error) => {
        console.warn('⚠️ No se pudo obtener el perfil completo:', error);
        this.avatarUrl = null;
        this.hasAvatarError = true;
        return of(null);
      })
    ).subscribe((perfil: any) => {
      if (perfil) {
        const foto = perfil.fotoUrl || perfil.fotoPerfil || perfil.foto || perfil.avatarUrl;
        if (foto && this.isValidUrl(foto)) {
          this.avatarUrl = this.formatUrl(foto);
          return;
        }

        this.avatarUrl = null;
        this.hasAvatarError = true;
      }
    });
  }

  onAvatarError(): void {
    this.hasAvatarError = true;
    this.avatarUrl = null;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const partes = name.trim().split(' ').filter(p => p.length > 0);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  }

  private isValidUrl(url: string): boolean {
    if (!url) return false;
    const clean = String(url).trim().toLowerCase();
    return clean !== '' &&
      clean !== 'null' &&
      clean !== 'undefined' &&
      !clean.includes('ui-avatars.com') &&
      (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('//'));
  }

  private formatUrl(url: string): string {
    const rawUrl = String(url).trim();
    if (rawUrl.startsWith('//')) {
      return `https:${rawUrl}`;
    }
    return rawUrl;
  }
}