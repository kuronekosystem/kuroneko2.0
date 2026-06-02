import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { getUserFriendlyApiErrorMessage } from '../../../core/errors/api-error-message';
import { LanguageService } from '../../../core/i18n/language.service';
import { AccessService } from '../../../core/services/access.service';
import { AccessRequestStatus, AccessStatusResponse } from '../../../core/models/access.models';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { LoadingMessageComponent } from '../../../shared/components/loading-message/loading-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalService } from '../../../shared/services/modal.service';

@Component({
  selector: 'app-access-status',
  standalone: true,
  imports: [FormsModule, RouterLink, BackButtonComponent, LoadingMessageComponent, LoadingSpinnerComponent],
  templateUrl: './access-status.component.html',
  styleUrls: ['./access.component.scss']
})
export class AccessStatusComponent {
  private readonly accessService = inject(AccessService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly languageService = inject(LanguageService);
  private readonly modalService = inject(ModalService);
  readonly texts = this.languageService.texts;

  requestCode = '';
  isSubmitting = false;
  errorMessage = '';
  result: AccessStatusResponse | null = null;
  lastUpdatedAt: Date | null = null;

  isFormInvalid(): boolean {
    return !this.requestCode.trim();
  }

  async submit(showSuccessMessage = false): Promise<void> {
    this.errorMessage = '';
    this.result = null;
    this.markViewForUpdate();

    if (this.isFormInvalid()) {
      this.errorMessage = this.texts().accessStatus.enterRequestCode;
      this.markViewForUpdate();
      return;
    }

    this.isSubmitting = true;
    this.markViewForUpdate();

    try {
      const response = await this.accessService.checkRequestStatus(this.requestCode);
      if (!response.success) {
        const message = getUserFriendlyApiErrorMessage(response.message, 'status', this.texts().apiErrors);
        if (showSuccessMessage) {
          this.modalService.showError(this.texts().modal.error, message);
        } else {
          this.errorMessage = message;
        }
        return;
      }

      this.result = response;
      this.lastUpdatedAt = new Date();
      if (showSuccessMessage) {
        this.modalService.showSuccess(this.texts().modal.success, this.texts().refresh.success, 1500);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      const friendlyMessage = getUserFriendlyApiErrorMessage(message, 'status', this.texts().apiErrors);
      if (showSuccessMessage) {
        this.modalService.showError(this.texts().modal.error, friendlyMessage);
      } else {
        this.errorMessage = friendlyMessage;
      }
    } finally {
      this.isSubmitting = false;
      this.markViewForUpdate();
    }
  }

  statusLabel(status?: AccessRequestStatus): string {
    return status ? this.texts().statuses[status] : this.texts().statuses.unknown;
  }

  lastUpdatedLabel(): string {
    if (!this.lastUpdatedAt) return '';
    return `${this.texts().refresh.lastUpdated}: ${this.formatTime(this.lastUpdatedAt)}`;
  }

  private markViewForUpdate(): void {
    this.changeDetectorRef.markForCheck();
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
