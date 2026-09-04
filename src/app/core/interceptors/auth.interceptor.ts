import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { SKIP_AUTH } from '../constants/http-context';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly PUBLIC_URLS = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/cambiar-contrasena-obligatorio'
  ];

  private isRedirecting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Si la petición tiene SKIP_AUTH, pasar sin token
    if (req.context.get(SKIP_AUTH)) {
      return next.handle(req);
    }

    // Si es una URL pública (login, register, etc.), pasar sin token
    const isPublicUrl = this.PUBLIC_URLS.some(url => req.url.includes(url));
    if (isPublicUrl) {
      return next.handle(req);
    }

    // Si no hay token, NO hacer la petición y cancelar
    const token = this.authService.getToken();
    if (!token) {
      // Si estamos en una ruta protegida y no hay token, redirigir a login
      const currentUrl = this.router.url;
      const isOnAuthPage = currentUrl.includes('/auth') || 
                           this.PUBLIC_URLS.some(url => currentUrl.includes(url));
      
      if (!isOnAuthPage && !this.isRedirecting) {
        this.isRedirecting = true;
        this.router.navigate(['/auth/login']).finally(() => {
          this.isRedirecting = false;
        });
      }
      // Cancelar la petición
      return EMPTY;
    }

    // Clonar la petición con el token
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si el error es 401 (token expirado o inválido)
        if (error.status === 401) {
          // Limpiar estado de autenticación
          this.authService.logout();
          
          // Redirigir a login solo si no estamos ya en una ruta de autenticación
          const currentUrl = this.router.url;
          const isOnAuthPage = currentUrl.includes('/auth') || 
                               this.PUBLIC_URLS.some(url => currentUrl.includes(url));
          
          if (!isOnAuthPage && !this.isRedirecting) {
            this.isRedirecting = true;
            this.router.navigate(['/auth/login']).finally(() => {
              this.isRedirecting = false;
            });
          }
          // Retornar EMPTY para cancelar la petición
          return EMPTY;
        }
        return throwError(() => error);
      })
    );
  }
}