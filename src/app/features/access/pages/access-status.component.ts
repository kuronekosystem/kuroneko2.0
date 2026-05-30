import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { getUserFriendlyApiErrorMessage } from '../../../core/errors/api-error-message';
import { LanguageService } from '../../../core/i18n/language.service';
import { AccessService } from '../../../core/services/access.service';
import { AccessRequestStatus, AccessStatusResponse } from '../../../core/models/access.models';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { LoadingMessageComponent } from '../../../shared/components/loading-message/loading-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-access-status',
  standalone: true,
  imports: [FormsModule, RouterLink, BackButtonComponent, LoadingMessageComponent, LoadingSpinnerComponent],
  templateUrl: './access-status.component.html',
  styleUrls: ['./access.component.scss']
})
export class AccessStatusComponent {
  private readonly accessService = inject(AccessService);
  private readonly languageService = inject(LanguageService);
  readonly texts = this.languageService.texts;

  requestCode = '';
  isSubmitting = false;
  errorMessage = '';
  result: AccessStatusResponse | null = null;

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.result = null;

    if (!this.requestCode.trim()) {
      this.errorMessage = this.texts().accessStatus.enterRequestCode;
      return;
    }

    this.isSubmitting = true;

    try {
      const response = await this.accessService.checkRequestStatus(this.requestCode);
      if (!response.success) {
        this.errorMessage = getUserFriendlyApiErrorMessage(response.message, 'status');
        return;
      }

      this.result = response;
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      this.errorMessage = getUserFriendlyApiErrorMessage(message, 'status');
    } finally {
      this.isSubmitting = false;
    }
  }

  statusLabel(status?: AccessRequestStatus): string {
    return status ? this.texts().statuses[status] : this.texts().statuses.unknown;
  }
}
