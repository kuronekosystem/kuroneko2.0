import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { getUserFriendlyApiErrorMessage } from '../../../core/errors/api-error-message';
import { LanguageService } from '../../../core/i18n/language.service';
import { AccessService } from '../../../core/services/access.service';
import { VipAccessSession } from '../../../core/models/access.models';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { LoadingMessageComponent } from '../../../shared/components/loading-message/loading-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-access-login',
  standalone: true,
  imports: [FormsModule, RouterLink, BackButtonComponent, LoadingMessageComponent, LoadingSpinnerComponent],
  templateUrl: './access-login.component.html',
  styleUrls: ['./access.component.scss']
})
export class AccessLoginComponent {
  private readonly accessService = inject(AccessService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  readonly texts = this.languageService.texts;

  userCode = '';
  accessKey = '';
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.userCode.trim() || !this.accessKey.trim()) {
      this.errorMessage = this.texts().accessLogin.validateInput;
      return;
    }

    this.isSubmitting = true;

    try {
      const response = await this.accessService.validateAccess(this.userCode, this.accessKey);
      if (
        response.success &&
        response.userCode &&
        response.accessKey &&
        response.displayName &&
        response.source &&
        response.status &&
        response.startDate &&
        response.endDate
      ) {
        const session: VipAccessSession = {
          userCode: response.userCode,
          accessKey: response.accessKey,
          displayName: response.displayName,
          source: response.source,
          status: response.status,
          startDate: response.startDate,
          endDate: response.endDate
        };

        this.accessService.saveSession(session);
        this.successMessage = `${this.texts().accessLogin.accessApproved} ${this.texts().accessLogin.movingToGallery}`;
        await new Promise(resolve => setTimeout(resolve, 450));
        await this.router.navigate(['/gallery']);
        return;
      }

      this.errorMessage = getUserFriendlyApiErrorMessage(response.message, 'access');
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      this.errorMessage = getUserFriendlyApiErrorMessage(message, 'access');
    } finally {
      this.isSubmitting = false;
    }
  }
}
