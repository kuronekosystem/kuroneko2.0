import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getUserFriendlyApiErrorMessage } from '../core/errors/api-error-message';
import { LanguageService } from '../core/i18n/language.service';
import { AccessRequestStatus } from '../core/models/access.models';
import { LoadingMessageComponent } from '../shared/components/loading-message/loading-message.component';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
import { LanguageSelectorComponent } from '../shared/components/language-selector/language-selector.component';
import { AdminGalleryManagerComponent } from './admin-gallery-manager.component';
import { AdminService } from './admin.service';
import {
  AdminAccessKeyItem,
  AdminAccessKeyStatus,
  AdminAccessRequestItem,
  AdminApproveAccessResponse,
  AdminCredentials,
  AdminKeyDraft,
  AdminRequestDraft,
  AdminRequestFilter
} from './admin.types';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LanguageSelectorComponent,
    LoadingMessageComponent,
    LoadingSpinnerComponent,
    AdminGalleryManagerComponent
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly languageService = inject(LanguageService);

  readonly filters: readonly AdminRequestFilter[] = ['all', 'pending', 'approved', 'rejected', 'need_more_info'];
  readonly texts = this.languageService.texts;

  adminUsername = '';
  adminPassword = '';
  isAuthenticated = false;
  isAuthenticating = false;
  isFetching = false;
  errorMessage = '';
  successMessage = '';
  activeFilter: AdminRequestFilter = 'all';
  processingRequestCode: string | null = null;
  processingRequestAction: 'approve' | 'reject' | 'needMoreInfo' | null = null;
  processingUserCode: string | null = null;
  processingKeyAction: 'disable' | 'extend' | null = null;

  requests: AdminAccessRequestItem[] = [];
  accessKeys: AdminAccessKeyItem[] = [];
  approvedResults: Record<string, AdminApproveAccessResponse> = {};
  requestDrafts: Record<string, AdminRequestDraft> = {};
  keyDrafts: Record<string, AdminKeyDraft> = {};
  revealedKeys = new Set<string>();

  private credentials: AdminCredentials | null = null;

  get isBusy(): boolean {
    return (
      this.isAuthenticating ||
      this.isFetching ||
      this.processingRequestCode !== null ||
      this.processingUserCode !== null
    );
  }

  async ngOnInit(): Promise<void> {
    const storedCredentials = this.adminService.getStoredCredentials();
    if (!storedCredentials) return;

    this.credentials = storedCredentials;
    await this.loadAdminData();
  }

  async submitLogin(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.adminUsername.trim() || !this.adminPassword.trim()) {
      this.errorMessage = this.texts().admin.panel.inputCredentials;
      return;
    }

    this.credentials = {
      adminUsername: this.adminUsername.trim(),
      adminPassword: this.adminPassword
    };

    await this.loadAdminData(true);
  }

  logout(): void {
    this.credentials = null;
    this.adminUsername = '';
    this.adminPassword = '';
    this.isAuthenticated = false;
    this.requests = [];
    this.accessKeys = [];
    this.approvedResults = {};
    this.requestDrafts = {};
    this.keyDrafts = {};
    this.revealedKeys.clear();
    this.adminService.clearCredentials();
    this.markViewForUpdate();
  }

  filteredRequests(): AdminAccessRequestItem[] {
    if (this.activeFilter === 'all') return this.requests;
    return this.requests.filter(request => request.status === this.activeFilter);
  }

  filterLabel(filter: AdminRequestFilter): string {
    if (filter === 'all') return this.texts().admin.panel.filterAll;
    return this.requestStatusLabel(filter);
  }

  requestStatusLabel(status: AccessRequestStatus): string {
    switch (status) {
      case 'pending':
        return this.texts().statuses.pending;
      case 'approved':
        return this.texts().statuses.approved;
      case 'rejected':
        return this.texts().statuses.rejected;
      case 'need_more_info':
        return this.texts().statuses.need_more_info;
    }
  }

  keyStatusLabel(status: AdminAccessKeyStatus): string {
    switch (status) {
      case 'active':
        return this.texts().statuses.active;
      case 'expired':
        return this.texts().statuses.expired;
      case 'disabled':
        return this.texts().statuses.disabled;
    }
  }

  requestDraft(requestCode: string): AdminRequestDraft {
    return this.requestDrafts[requestCode] ?? { durationDays: 30, notes: '' };
  }

  keyDraft(userCode: string): AdminKeyDraft {
    return this.keyDrafts[userCode] ?? { notes: '' };
  }

  setRequestDuration(requestCode: string, value: string | number): void {
    const duration = Number(value);
    this.ensureRequestDraft(requestCode);
    this.requestDraft(requestCode).durationDays = Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : 30;
  }

  setRequestNotes(requestCode: string, value: string): void {
    this.ensureRequestDraft(requestCode);
    this.requestDraft(requestCode).notes = value;
  }

  setKeyNotes(userCode: string, value: string): void {
    this.ensureKeyDraft(userCode);
    this.keyDraft(userCode).notes = value;
  }

  async approveRequest(request: AdminAccessRequestItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    const draft = this.requestDraft(request.requestCode);
    await this.runRequestAction(request.requestCode, 'approve', async () => {
      const result = await this.adminService.approveRequest(
        credentials,
        request.requestCode,
        draft.durationDays,
        draft.notes.trim()
      );

      this.approvedResults[request.requestCode] = result;
      this.successMessage = this.texts().admin.panel.approveSuccess;
      await this.refreshData(credentials);
    }, this.texts().admin.panel.approveFailed);
  }

  async rejectRequest(request: AdminAccessRequestItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    const notes = this.requestDraft(request.requestCode).notes.trim();
    if (!notes) {
      this.errorMessage = this.texts().admin.panel.rejectNotesRequired;
      return;
    }

    await this.runRequestAction(request.requestCode, 'reject', async () => {
      await this.adminService.rejectRequest(credentials, request.requestCode, notes);
      this.successMessage = this.texts().admin.panel.rejectSuccess;
      await this.refreshData(credentials);
    }, this.texts().admin.panel.rejectFailed);
  }

  async needMoreInfo(request: AdminAccessRequestItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    const notes = this.requestDraft(request.requestCode).notes.trim();
    if (!notes) {
      this.errorMessage = this.texts().admin.panel.needMoreInfoNotesRequired;
      return;
    }

    await this.runRequestAction(request.requestCode, 'needMoreInfo', async () => {
      await this.adminService.needMoreInfo(credentials, request.requestCode, notes);
      this.successMessage = this.texts().admin.panel.needMoreInfoSuccess;
      await this.refreshData(credentials);
    }, this.texts().admin.panel.updateFailed);
  }

  async disableAccessKey(item: AdminAccessKeyItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    await this.runKeyAction(item.userCode, 'disable', async () => {
      await this.adminService.disableAccessKey(credentials, item.userCode, this.keyDraft(item.userCode).notes.trim());
      this.successMessage = this.texts().admin.panel.disableSuccess;
      await this.refreshData(credentials);
    }, this.texts().admin.panel.disableFailed);
  }

  async extendAccessKey(item: AdminAccessKeyItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    await this.runKeyAction(item.userCode, 'extend', async () => {
      await this.adminService.extendAccessKey(credentials, item.userCode, 30, this.keyDraft(item.userCode).notes.trim());
      this.successMessage = this.texts().admin.panel.extendSuccess;
      await this.refreshData(credentials);
    }, this.texts().admin.panel.extendFailed);
  }

  toggleKey(userCode: string): void {
    if (this.revealedKeys.has(userCode)) {
      this.revealedKeys.delete(userCode);
      return;
    }

    this.revealedKeys.add(userCode);
  }

  isKeyRevealed(userCode: string): boolean {
    return this.revealedKeys.has(userCode);
  }

  displayAccessKey(item: AdminAccessKeyItem): string {
    return this.isKeyRevealed(item.userCode) ? item.accessKey : this.maskAccessKey(item.accessKey);
  }

  maskAccessKey(accessKey: string | undefined): string {
    if (!accessKey) return '';
    if (accessKey.length <= 8) return '****';

    return `${accessKey.slice(0, 5)}****-****-${accessKey.slice(-4)}`;
  }

  async copyText(value: string | undefined, label: string): Promise<void> {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      this.successMessage = this.texts().admin.panel.copySuccess.replace('{label}', label);
      this.errorMessage = '';
    } catch {
      this.errorMessage = this.texts().admin.panel.copyFailed;
    }
  }

  async copyKeyPair(item: AdminAccessKeyItem): Promise<void> {
    await this.copyText(`userCode: ${item.userCode}\naccessKey: ${item.accessKey}`, this.texts().admin.panel.copyAccessInfoLabel);
  }

  trackRequest(_: number, item: AdminAccessRequestItem): string {
    return item.requestCode;
  }

  trackKey(_: number, item: AdminAccessKeyItem): string {
    return item.userCode;
  }

  isRequestProcessing(requestCode: string, action?: 'approve' | 'reject' | 'needMoreInfo'): boolean {
    return this.processingRequestCode === requestCode && (!action || this.processingRequestAction === action);
  }

  isKeyProcessing(userCode: string, action?: 'disable' | 'extend'): boolean {
    return this.processingUserCode === userCode && (!action || this.processingKeyAction === action);
  }

  async refreshAdminData(): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    this.isFetching = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.markViewForUpdate();

    try {
      await this.refreshData(credentials);
    } catch (error) {
      this.errorMessage = this.toAdminError(error, this.texts().admin.panel.dataLoadFailed);
    } finally {
      this.isFetching = false;
      this.markViewForUpdate();
    }
  }

  private async loadAdminData(shouldSaveCredentials = false): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    this.isAuthenticating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.markViewForUpdate();

    try {
      await this.refreshData(credentials);
      this.isAuthenticated = true;
      this.adminPassword = '';
      if (shouldSaveCredentials) {
        this.adminService.saveCredentials(credentials);
      }
    } catch (error) {
      this.errorMessage = this.toAdminError(error, this.texts().admin.panel.dataLoadFailed);
      this.logout();
    } finally {
      this.isAuthenticating = false;
      this.markViewForUpdate();
    }
  }

  private async refreshData(credentials: AdminCredentials): Promise<void> {
    const [requests, accessKeys] = await Promise.all([
      this.adminService.getAccessRequests(credentials),
      this.adminService.getAccessKeys(credentials)
    ]);
    this.requests = requests;
    this.accessKeys = accessKeys;
    this.ensureDrafts();
    this.markViewForUpdate();
  }

  private async runRequestAction(
    requestCode: string,
    actionName: 'approve' | 'reject' | 'needMoreInfo',
    action: () => Promise<void>,
    fallbackMessage: string
  ): Promise<void> {
    this.processingRequestCode = requestCode;
    this.processingRequestAction = actionName;
    this.errorMessage = '';
    this.markViewForUpdate();

    try {
      await action();
    } catch (error) {
      this.errorMessage = this.toAdminError(error, fallbackMessage);
      this.successMessage = '';
    } finally {
      this.processingRequestCode = null;
      this.processingRequestAction = null;
      this.markViewForUpdate();
    }
  }

  private async runKeyAction(
    userCode: string,
    actionName: 'disable' | 'extend',
    action: () => Promise<void>,
    fallbackMessage: string
  ): Promise<void> {
    this.processingUserCode = userCode;
    this.processingKeyAction = actionName;
    this.errorMessage = '';
    this.markViewForUpdate();

    try {
      await action();
    } catch (error) {
      this.errorMessage = this.toAdminError(error, fallbackMessage);
      this.successMessage = '';
    } finally {
      this.processingUserCode = null;
      this.processingKeyAction = null;
      this.markViewForUpdate();
    }
  }

  private requireCredentials(): AdminCredentials | null {
    if (this.credentials) return this.credentials;

    this.errorMessage = this.texts().admin.panel.authenticationRequired;
    return null;
  }

  private toAdminError(error: unknown, fallbackMessage: string): string {
    const message = error instanceof Error ? error.message : undefined;
    const friendly = getUserFriendlyApiErrorMessage(message, 'admin');

    return friendly === '管理パネルに接続できませんでした。' ? fallbackMessage : friendly;
  }

  private ensureDrafts(): void {
    this.requests.forEach(request => this.ensureRequestDraft(request.requestCode));
    this.accessKeys.forEach(item => this.ensureKeyDraft(item.userCode));
  }

  private ensureRequestDraft(requestCode: string): void {
    this.requestDrafts[requestCode] ??= { durationDays: 30, notes: '' };
  }

  private ensureKeyDraft(userCode: string): void {
    this.keyDrafts[userCode] ??= { notes: '' };
  }

  private markViewForUpdate(): void {
    this.changeDetectorRef.markForCheck();
  }
}
