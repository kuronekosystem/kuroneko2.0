import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
import { VipSessionStatusComponent } from '../../../../shared/components/vip-session-status/vip-session-status.component';
import { ModalService } from '../../../../shared/services/modal.service';
import { VipBoardService } from '../../services/vip-board.service';

@Component({
  selector: 'app-vip-board',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BackButtonComponent, LoadingMessageComponent, LoadingSpinnerComponent, VipSessionStatusComponent],
  templateUrl: './vip-board.component.html',
  styleUrls: ['./vip-board.component.scss']
})
export class VipBoardComponent implements OnInit {
  private readonly accessService = inject(AccessService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly languageService = inject(LanguageService);
  private readonly modalService = inject(ModalService);
  private readonly vipBoardService = inject(VipBoardService);
  private readonly router = inject(Router);

  readonly session = this.accessService.getStoredSession();
  readonly texts = this.languageService.texts;

  title = '';
  message = '';
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  suggestions: VipIllustrationRequest[] = [];
  lastUpdatedAt: Date | null = null;

  isFormInvalid(): boolean {
    return !this.message.trim();
  }

  async ngOnInit(): Promise<void> {
    if (!this.accessService.hasValidSession()) {
      await this.router.navigate(['/access/login']);
      return;
    }

    await this.loadSuggestions();
  }

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.markViewForUpdate();

    if (this.isFormInvalid()) {
      this.errorMessage = this.texts().vipBoard.messageRequired;
      this.markViewForUpdate();
      return;
    }

    this.isSubmitting = true;
    this.markViewForUpdate();

    try {
      const response = await this.vipBoardService.saveSuggestion(this.title, this.message);
      if (!response.success) {
        this.errorMessage = getUserFriendlyApiErrorMessage(response.message, 'vipBoard', this.texts().apiErrors);
        this.modalService.showError(this.texts().modal.error, this.errorMessage);
        return;
      }

      this.title = '';
      this.message = '';
      this.modalService.showSuccess(
        this.texts().modal.success,
        `${this.texts().vipBoard.requestReceived}\n${this.texts().vipBoard.requestReceivedDescription}`,
        2000
      );
      await this.loadSuggestions();
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      this.errorMessage = getUserFriendlyApiErrorMessage(message, 'vipBoard', this.texts().apiErrors);
      this.modalService.showError(this.texts().modal.error, this.errorMessage);
    } finally {
      this.isSubmitting = false;
      this.markViewForUpdate();
    }
  }

  async refreshSuggestions(): Promise<void> {
    await this.loadSuggestions(true);
  }

  lastUpdatedLabel(): string {
    if (!this.lastUpdatedAt) return '';
    return `${this.texts().refresh.lastUpdated}: ${this.formatTime(this.lastUpdatedAt)}`;
  }

  private async loadSuggestions(showSuccessMessage = false): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.markViewForUpdate();

    try {
      this.suggestions = await this.vipBoardService.getSuggestions();
      this.lastUpdatedAt = new Date();
      if (showSuccessMessage) {
        this.modalService.showSuccess(this.texts().modal.success, this.texts().refresh.success, 1500);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      const friendlyMessage = message || this.texts().vipBoard.loadFailed;
      if (showSuccessMessage) {
        this.modalService.showError(this.texts().modal.error, friendlyMessage);
      } else {
        this.errorMessage = friendlyMessage;
      }
    } finally {
      this.isLoading = false;
      this.markViewForUpdate();
    }
  }

  statusLabel(status: VipIllustrationRequestStatus): string {
    return this.texts().vipBoard.status[status];
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
