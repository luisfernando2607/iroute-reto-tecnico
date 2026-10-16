import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  ttl: number;
}

/** Notificaciones tipo toast, consumidas por el componente raíz. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.push('success', message, 4000);
  }

  error(message: string): void {
    this.push('error', message, 6500);
  }

  info(message: string): void {
    this.push('info', message, 4000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, message: string, ttl: number): void {
    // Evita apilar el mismo mensaje varias veces seguidas.
    if (this.toasts().some((t) => t.message === message && t.kind === kind)) return;
    const toast: Toast = { id: ++this.seq, kind, message, ttl };
    this.toasts.update((list) => [...list.slice(-3), toast]);
    setTimeout(() => this.dismiss(toast.id), ttl);
  }
}
