import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { getUserFriendlyApiErrorMessage } from '../../../../core/errors/api-error-message';
import { LanguageService } from '../../../../core/i18n/language.service';
import { AccessService } from '../../../../core/services/access.service';
import { VipIllustrationRequest, VipIllustrationRequestStatus } from '../../../../core/models/vip-board.models';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { LoadingMessageComponent } from '../../../../shared/components/loading-message/loading-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { VipBoardService } from '../../services/vip-board.service';

@Component({
  selector: 'app-vip-board',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BackButtonComponent, LoadingMessageComponent, LoadingSpinnerComponent],
  templateUrl: './vip-board.component.html',
  styleUrls: ['./vip-board.component.scss']
})
export class VipBoardComponent implements OnInit {
  private readonly accessService = inject(AccessService);
  private readonly languageService = inject(LanguageService);
  private readonly vipBoardService = inject(VipBoardService);
  private readonly router = inject(Router);

  readonly session = this.accessService.getStoredSession();
  readonly texts = this.languageService.texts;

  title = '';
  message = '';
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  suggestions: VipIllustrationRequest[] = [];

  async ngOnInit(): Promise<void> {
    if (!this.accessService.hasValidSession()) {
      await this.router.navigate(['/access/login']);
      return;
    }

    await this.loadSuggestions();
  }

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.message.trim()) {
      this.errorMessage = this.texts().vipBoard.messageRequired;
      return;
    }

    this.isSubmitting = true;

    try {
      const response = await this.vipBoardService.saveSuggestion(this.title, this.message);
      if (!response.success) {
        this.errorMessage = getUserFriendlyApiErrorMessage(response.message, 'vipBoard');
        return;
      }

      this.title = '';
      this.message = '';
      this.successMessage = response.message || this.texts().vipBoard.sent;
      await this.loadSuggestions();
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      this.errorMessage = getUserFriendlyApiErrorMessage(message, 'vipBoard');
    } finally {
      this.isSubmitting = false;
    }
  }

  private async loadSuggestions(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.suggestions = await this.vipBoardService.getSuggestions();
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      this.errorMessage = message || this.texts().vipBoard.loadFailed;
    } finally {
      this.isLoading = false;
    }
  }

  statusLabel(status: VipIllustrationRequestStatus): string {
    return this.texts().statuses[status];
  }
}
