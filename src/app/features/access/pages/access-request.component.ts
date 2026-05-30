import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { getUserFriendlyApiErrorMessage } from '../../../core/errors/api-error-message';
import { LanguageService } from '../../../core/i18n/language.service';
import { AccessService } from '../../../core/services/access.service';
import { AccessRequestPayload, AccessRequestResponse, AccessSource } from '../../../core/models/access.models';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { LoadingMessageComponent } from '../../../shared/components/loading-message/loading-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-access-request',
  standalone: true,
  imports: [FormsModule, RouterLink, BackButtonComponent, LoadingMessageComponent, LoadingSpinnerComponent],
  templateUrl: './access-request.component.html',
  styleUrls: ['./access.component.scss']
})
export class AccessRequestComponent {
  private readonly accessService = inject(AccessService);
  private readonly languageService = inject(LanguageService);
  readonly texts = this.languageService.texts;

  displayName = '';
  source: AccessSource = 'fanbox';
  fanboxName = '';
  paypalTransactionId = '';
  contact = '';
  proofText = '';
  isSubmitting = false;
  errorMessage = '';
  result: AccessRequestResponse | null = null;

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.result = null;

    const validationError = this.validateForm();
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    const payload: AccessRequestPayload = {
      displayName: this.displayName,
      source: this.source,
      fanboxName: this.source === 'fanbox' ? this.fanboxName : undefined,
      paypalTransactionId: this.source === 'paypal' ? this.paypalTransactionId : undefined,
      contact: this.contact,
      proofText: this.proofText
    };

    this.isSubmitting = true;

    try {
      const response = await this.accessService.requestAccess(payload);
      if (!response.success) {
        this.errorMessage = getUserFriendlyApiErrorMessage(response.message, 'request');
        return;
      }

      this.result = response;
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      this.errorMessage = getUserFriendlyApiErrorMessage(message, 'request');
    } finally {
      this.isSubmitting = false;
    }
  }

  private validateForm(): string | null {
    if (!this.displayName.trim()) return this.texts().accessRequest.validateInput;

    if (this.source === 'fanbox' && !this.fanboxName.trim() && !this.proofText.trim()) {
      return this.texts().accessRequest.fanboxValidation;
    }

    if (this.source === 'paypal' && !this.paypalTransactionId.trim() && !this.proofText.trim()) {
      return this.texts().accessRequest.paypalValidation;
    }

    return null;
  }
}
