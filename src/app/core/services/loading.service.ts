import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private activeRequests = 0;
    private loadingSubject = new BehaviorSubject<boolean>(false);

    public loading$: Observable<boolean> = this.loadingSubject.asObservable();

    show(): void {
        if (this.activeRequests === 0) {
            this.loadingSubject.next(true);
        }
        this.activeRequests++;
    }

    hide(): void {
        this.activeRequests--;
        if (this.activeRequests <= 0) {
            this.activeRequests = 0;
            this.loadingSubject.next(false);
        }
    }
}