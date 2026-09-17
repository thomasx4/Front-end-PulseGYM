import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SKIP_LOADING } from '../../../core/constants/http-context';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'error';
    content: string;
    ts?: number;
}

export interface StatusResponse {
    status: string;
    mcp: { online: boolean; mode: string; url: string };
    llm: { model: string };
}

@Injectable({
    providedIn: 'root'
})
export class MancuerIaService {
    private apiUrl = 'http://localhost:5050';

    constructor(private http: HttpClient) { }

    private getContext(): { context: HttpContext } {
        const context = new HttpContext().set(SKIP_LOADING, true);
        return { context };
    }

    getStatus(): Observable<StatusResponse> {
        return this.http.get<StatusResponse>(`${this.apiUrl}/api/status`, this.getContext());
    }

    getHistory(): Observable<{ messages: ChatMessage[] }> {
        return this.http.get<{ messages: ChatMessage[] }>(`${this.apiUrl}/api/history`, this.getContext());
    }

    sendMessage(message: string): Observable<{ success: boolean; response: string }> {
        return this.http.post<{ success: boolean; response: string }>(`${this.apiUrl}/api/chat`, { message }, this.getContext());
    }

    clearHistory(): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(`${this.apiUrl}/api/history/clear`, {}, this.getContext());
    }
}