import { Component, HostListener, computed, inject, output } from '@angular/core';
import { LanguageService } from '../../../core/i18n/language.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './app-modal.component.html',
  styleUrl: './app-modal.component.scss'
})
export class AppModalComponent {
  private readonly languageService = inject(LanguageService);
  private readonly modalService = inject(ModalService);

  readonly modal = this.modalService.currentModal;
  readonly texts = this.languageService.texts;
  readonly confirmOutput = output<void>({ alias: 'confirm' });
  readonly cancelOutput = output<void>({ alias: 'cancel' });
  readonly closeOutput = output<void>({ alias: 'close' });
  readonly typeLabel = computed(() => {
    const modal = this.modal();
    if (!modal) return '';

    return this.texts().modal[modal.type];
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modal()) {
      this.close();
    }
  }

  confirm(): void {
    this.confirmOutput.emit();
    this.modalService.accept();
  }

  cancel(): void {
    this.cancelOutput.emit();
    this.modalService.cancel();
  }

  close(): void {
    this.closeOutput.emit();
    this.modalService.close();
  }
}
