import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { MancuerIaService, ChatMessage } from './services/mancuer-ia.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { marked } from 'marked';

@Component({
  selector: 'app-mancuer-ia',
  templateUrl: './mancuer-ia.component.html',
  styleUrls: ['./mancuer-ia.component.scss']
})
export class MancuerIaComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatScroll') private chatScroll!: ElementRef;

  messages: ChatMessage[] = [];
  userInput: string = '';
  isBusy: boolean = false;
  isOnline: boolean = false;
  mcpInfo: string = '—';
  llmModel: string = '—';
  showLogs: boolean = false;
  logs: { time: string; text: string; type: string }[] = [];

  faqs = [
    { text: '¿Qué plan nutricional es ideal para un principiante?', query: '¿Qué plan nutricional es ideal para un principiante?' },
    { text: 'Muéstrame el progreso de un socio.', query: 'Muéstrame el progreso de un socio.' },
    { text: '¿Cuántos equipos están en mantenimiento?', query: '¿Cuántos equipos están en mantenimiento?' },
    { text: 'Genera una rutina para hipertrofia en piernas.', query: 'Genera una rutina para hipertrofia en piernas.' },
    { text: 'Crea un reporte de pagos del último mes.', query: 'Crea un reporte de pagos del último mes.' }
  ];

  constructor(
    private aiService: MancuerIaService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.checkStatus();
    this.loadHistory();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
    } catch (err) { }
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
          this.messages = data.messages;
        }
      }
    });
  }

  send(text?: string) {
    const messageToSend = text || this.userInput;
    if (!messageToSend.trim() || this.isBusy) return;

    const userMsg: ChatMessage = { role: 'user', content: messageToSend, ts: Date.now() };
    this.messages.push(userMsg);

    if (!text) {
      this.userInput = '';
    }

    this.isBusy = true;
    this.logMessage(`→ POST /api/chat: "${messageToSend}"`);

    const typingMsg: ChatMessage = { role: 'assistant', content: 'Pensando...', ts: Date.now() };
    this.messages.push(typingMsg);

    this.aiService.sendMessage(messageToSend).subscribe({
      next: (res) => {
        this.messages.pop();
        const replyMsg: ChatMessage = { role: 'assistant', content: res.response, ts: Date.now() };
        this.messages.push(replyMsg);
        this.isBusy = false;
        this.logMessage(`← Respuesta recibida exitosamente`, 'ok');
      },
      error: (err) => {
        this.messages.pop();
        const errorMsg: ChatMessage = { role: 'error', content: 'Error al comunicarse con MancuerIA: ' + err.message, ts: Date.now() };
        this.messages.push(errorMsg);
        this.isBusy = false;
        this.logMessage(`✗ Error en petición: ${err.message}`, 'err');
      }
    });
  }

  clearHistory() {
    Swal.fire({
      title: '¿Limpiar historial?',
      text: '¿Deseas limpiar el historial de la conversación actual?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-swal-confirm-btn',
        cancelButton: 'custom-swal-cancel-btn'
      },
      buttonsStyling: false
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
              showConfirmButton: false,
              customClass: { popup: 'custom-swal-popup' }
            });
          }
        });
      }
    });
  }

  exportConversation() {
    if (this.messages.length === 0) {
      Swal.fire({
        title: 'Atención',
        text: 'No hay mensajes para exportar.',
        icon: 'info',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'custom-swal-popup',
          confirmButton: 'custom-swal-confirm-btn'
        },
        buttonsStyling: false
      });
      return;
    }

    let textContent = '--- HISTORIAL DE CONVERSACIÓN MANCUERIA ---\n\n';
    this.messages.forEach(msg => {
      const roleName = msg.role === 'user' ? 'Administrador' : msg.role === 'assistant' ? 'MancuerIA' : 'Error';
      const timeStr = msg.ts ? new Date(msg.ts).toLocaleString() : '';
      textContent += `[${timeStr}] ${roleName}:\n${msg.content}\n\n-----------------------------------\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mancuer-ia-conversacion-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.logMessage('Conversación exportada exitosamente', 'ok');

    Swal.fire({
      title: '¡Exportado con éxito!',
      text: 'El archivo de texto con la conversación ha sido descargado.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      customClass: { popup: 'custom-swal-popup' }
    });
  }
}