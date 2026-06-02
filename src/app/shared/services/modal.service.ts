import { Injectable, signal } from '@angular/core';

export type AppModalType = 'success' | 'error' | 'info' | 'confirm';

export interface AppModalConfig {
  readonly title: string;
  readonly message: string;
  readonly type: AppModalType;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly showCancel?: boolean;
  readonly autoCloseMs?: number;
}

export interface AppModalState extends AppModalConfig {
  readonly id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private readonly currentModalSignal = signal<AppModalState | null>(null);
  private modalId = 0;
  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private confirmResolver: ((confirmed: boolean) => void) | null = null;

  readonly currentModal = this.currentModalSignal.asReadonly();

  showSuccess(title: string, message: string, autoCloseMs = 1500): void {
    this.show({ title, message, type: 'success', autoCloseMs });
  }

  showError(title: string, message: string): void {
    this.show({ title, message, type: 'error' });
  }

  showInfo(title: string, message: string, autoCloseMs = 2000): void {
    this.show({ title, message, type: 'info', autoCloseMs });
  }

  confirm(title: string, message: string, confirmText?: string, cancelText?: string): Promise<boolean> {
    this.clearAutoCloseTimer();
    this.resolvePendingConfirm(false);

    const id = ++this.modalId;
    this.currentModalSignal.set({
      id,
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText,
      showCancel: true
    });

    return new Promise<boolean>(resolve => {
      this.confirmResolver = resolve;
    });
  }

  close(): void {
    const modal = this.currentModalSignal();
    this.clearAutoCloseTimer();
    this.currentModalSignal.set(null);
    this.resolvePendingConfirm(modal?.type === 'success' || modal?.type === 'info');
  }

  accept(): void {
    this.clearAutoCloseTimer();
    this.currentModalSignal.set(null);
    this.resolvePendingConfirm(true);
  }

  cancel(): void {
    this.clearAutoCloseTimer();
    this.currentModalSignal.set(null);
    this.resolvePendingConfirm(false);
  }

  private show(config: AppModalConfig): void {
    this.clearAutoCloseTimer();
    this.resolvePendingConfirm(false);

    const id = ++this.modalId;
    this.currentModalSignal.set({ ...config, id });

    if (config.autoCloseMs && config.autoCloseMs > 0) {
      this.autoCloseTimer = setTimeout(() => {
        if (this.currentModalSignal()?.id === id) {
          this.close();
        }
      }, config.autoCloseMs);
    }
  }

  private clearAutoCloseTimer(): void {
    if (!this.autoCloseTimer) return;

    clearTimeout(this.autoCloseTimer);
    this.autoCloseTimer = null;
  }

  private resolvePendingConfirm(confirmed: boolean): void {
    if (!this.confirmResolver) return;

    this.confirmResolver(confirmed);
    this.confirmResolver = null;
  }
}
