import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MancuerIaService, ChatMessage } from './services/mancuer-ia.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { marked } from 'marked';

@Component({
  selector: 'app-mancuer-ia',
  templateUrl: './mancuer-ia.component.html',
  styleUrls: ['./mancuer-ia.component.scss']
})
export class MancuerIaComponent implements OnInit, OnDestroy {
  @ViewChild('chatScroll') private chatScroll!: ElementRef;

  messages: ChatMessage[] = [];
  userInput: string = '';
  isBusy: boolean = false;
  isOnline: boolean = false;
  mcpInfo: string = '—';
  llmModel: string = '—';
  showLogs: boolean = false;
  logs: { time: string; text: string; type: string }[] = [];

  currentMonthIncomeText: string = '';
  currentMonthIncomeQuery: string = '';

  isRateLimited: boolean = false;
  remainingSeconds: number = 0;
  countdownDisplay: string = '';
  private timerInterval: any = null;

  constructor(
    private aiService: MancuerIaService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.initDynamicQueries();
    this.checkStatus();
    this.loadHistory();
    this.checkStoredRateLimit();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  initDynamicQueries() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    const monthYearStr = now.toLocaleDateString('es-ES', options);
    
    const formattedMonthYear = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1);

    this.currentMonthIncomeText = `Ingresos de ${formattedMonthYear}`;
    this.currentMonthIncomeQuery = `¿Cuáles son los ingresos de ${formattedMonthYear}?`;
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.chatScroll) {
          this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
        }
      } catch (err) { }
    }, 50);
  }

  renderMarkdown(content: string): SafeHtml {
    if (!content) return '';
    if (content === 'Pensando...') return content;
    const parsedHtml = marked.parse(content) as string;
    return this.sanitizer.bypassSecurityTrustHtml(parsedHtml);
  }

  logMessage(text: string, type: string = '') {
    const time = new Date().toLocaleTimeString();
    this.logs.push({ time, text, type });
  }

  checkStatus() {
    this.aiService.getStatus().subscribe({
      next: (data) => {
        this.isOnline = true;
        this.mcpInfo = `${data.mcp.mode} (${data.mcp.url})`;
        this.llmModel = data.llm.model;
        this.logMessage('Estado del servidor verificado: Online', 'ok');
      },
      error: () => {
        this.isOnline = false;
        this.mcpInfo = 'Offline';
        this.llmModel = 'Offline';
        this.logMessage('No se pudo conectar con el servidor de IA', 'err');
      }
    });
  }

  loadHistory() {
    this.aiService.getHistory().subscribe({
      next: (data) => {
        if (data.messages && data.messages.length > 0) {
          // Validación: Mantener máximo 50 mensajes en memoria para optimizar rendimiento
          this.messages = data.messages.slice(-50);
          this.scrollToBottom();
        }
      }
    });
  }

  checkStoredRateLimit() {
    const storedUnblockTime = localStorage.getItem('mancueria_unblock_time');
    if (storedUnblockTime) {
      const unblockTime = parseInt(storedUnblockTime, 10);
      const now = Date.now();
      const diffSecs = Math.ceil((unblockTime - now) / 1000);

      if (diffSecs > 0) {
        this.startCountdown(diffSecs, false);
      } else {
        localStorage.removeItem('mancueria_unblock_time');
      }
    }
  }

  startCountdown(totalSeconds: number, saveToStorage: boolean = true) {
    this.isRateLimited = true;
    this.remainingSeconds = totalSeconds;

    if (saveToStorage) {
      const unblockTime = Date.now() + (totalSeconds * 1000);
      localStorage.setItem('mancueria_unblock_time', unblockTime.toString());
    }

    this.updateCountdownDisplay();
    this.clearTimer();

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        this.clearTimer();
        this.isRateLimited = false;
        localStorage.removeItem('mancueria_unblock_time');
      } else {
        this.updateCountdownDisplay();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateCountdownDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    if (mins > 0) {
      this.countdownDisplay = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    } else {
      this.countdownDisplay = `${secs} segundo${secs !== 1 ? 's' : ''}`;
    }
  }

  send(text?: string) {
    if (this.isRateLimited) return;

    const messageToSend = text || this.userInput;
    
    // Validación: Contenido vacío, espacios o exceso de caracteres
    if (!messageToSend || !messageToSend.trim() || this.isBusy) return;

    if (messageToSend.length > 1000) {
      Swal.fire({
        title: 'Mensaje demasiado largo',
        text: 'El mensaje no puede superar los 1000 caracteres.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0e3b72'
      });
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: messageToSend, ts: Date.now() };
    this.messages.push(userMsg);
    
    // Validación de longitud del historial local
    if (this.messages.length > 50) {
      this.messages = this.messages.slice(-50);
    }

    this.scrollToBottom();

    if (!text) {
      this.userInput = '';
    }

    this.isBusy = true;
    this.logMessage(`→ POST /api/chat: "${messageToSend}"`);

    const typingMsg: ChatMessage = { role: 'assistant', content: 'Pensando...', ts: Date.now() };
    this.messages.push(typingMsg);
    this.scrollToBottom();

    this.aiService.sendMessage(messageToSend).subscribe({
      next: (res) => {
        this.messages.pop();
        const replyMsg: ChatMessage = { role: 'assistant', content: res.response, ts: Date.now() };
        this.messages.push(replyMsg);
        this.isBusy = false;
        this.scrollToBottom();
        this.logMessage(`← Respuesta recibida exitosamente`, 'ok');
      },
      error: (err) => {
        this.messages.pop();
        this.isBusy = false;

        const errorObj = err.error || {};
        const errorText = errorObj.error || err.message || '';
        const isRateLimit = err.status === 429 || errorText.includes('RATE_LIMIT_EXCEEDED') || errorText.includes('rate_limit_exceeded');

        if (isRateLimit) {
          const minMatch = errorText.match(/try again in (\d+)m([\d\.]+)s/);
          const secMatch = errorText.match(/try again in ([\d\.]+)s/);

          let totalSeconds = 30; 
          let timeMsgDetail = 'unos momentos';

          if (minMatch) {
            const minutes = parseInt(minMatch[1], 10);
            const seconds = Math.ceil(parseFloat(minMatch[2]));
            totalSeconds = (minutes * 60) + seconds;
            timeMsgDetail = `${minutes} minuto${minutes > 1 ? 's' : ''} y ${seconds} segundo${seconds !== 1 ? 's' : ''}`;
          } else if (secMatch) {
            const seconds = Math.ceil(parseFloat(secMatch[1]));
            totalSeconds = seconds;
            timeMsgDetail = `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
          }

          this.startCountdown(totalSeconds, true);

          Swal.fire({
            title: '¡Límite de uso alcanzado!',
            html: `
              <p style="color: #475569; font-size: 14px; margin-bottom: 12px; line-height: 1.5;">
                Has alcanzado el límite de peticiones de la IA. El chat ha sido bloqueado temporalmente.
              </p>
              <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center;">
                <span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Tiempo de espera requerido</span>
                <span style="display: block; font-size: 18px; font-weight: 800; color: #0f1c3f; margin-top: 4px;">${timeMsgDetail}</span>
              </div>
            `,
            icon: 'warning',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0e3b72'
          });
        } else {
          const errorMsg: ChatMessage = { role: 'error', content: 'Error al comunicarse con MancuerIA: ' + errorText, ts: Date.now() };
          this.messages.push(errorMsg);
          this.scrollToBottom();
        }

        this.logMessage(`✗ Error en petición: ${errorText}`, 'err');
      }
    });
  }

  clearHistory() {
    if (this.isRateLimited) return;

    Swal.fire({
      title: '¿Limpiar historial?',
      text: '¿Deseas limpiar el historial de la conversación actual?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0e3b72',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        this.aiService.clearHistory().subscribe({
          next: () => {
            this.messages = [];
            this.logMessage('Historial limpiado correctamente', 'ok');
            Swal.fire({
              title: '¡Limpiado!',
              text: 'El historial se ha vaciado correctamente.',
              icon: 'success',
              timer: 1800,
              showConfirmButton: false
            });
          }
        });
      }
    });
  }

  // (Añade estas propiedades dentro de la clase MancuerIaComponent)
  showMcpModal: boolean = false;

// (Añade estos métodos al final de tu clase en el TypeScript)
  openMcpInfoModal() {
    this.showMcpModal = true;
    this.logMessage('Abrió la guía de información del MCP', 'ok');
  }

  closeMcpInfoModal() {
    this.showMcpModal = false;
  }
}