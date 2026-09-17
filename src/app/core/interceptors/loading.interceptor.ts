import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';
import { SKIP_LOADING } from '../constants/http-context';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
    private loadingService = inject(LoadingService);

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const skipLoading = req.context.get(SKIP_LOADING);

        if (skipLoading) {
            return next.handle(req);
        }

        this.loadingService.show();

        return next.handle(req).pipe(
            finalize(() => {
                this.loadingService.hide();
            })
        );
    }
}