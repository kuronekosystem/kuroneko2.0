import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getUserFriendlyApiErrorMessage } from '../../../core/errors/api-error-message';
import { LanguageService } from '../../../core/i18n/language.service';
import { LanguageSelectorComponent } from '../../../shared/components/language-selector/language-selector.component';
import { LoadingMessageComponent } from '../../../shared/components/loading-message/loading-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalService } from '../../../shared/services/modal.service';
import { AdminGalleryManagerComponent } from '../../components/admin-gallery-manager/admin-gallery-manager.component';
import { AdminService } from '../../services/admin.service';
import {
  AdminAccessKeyItem,
  AdminAccessKeyStatus,
  AdminAccessRequestItem,
  AdminAccessRequestStatus,
  AdminApproveAccessResponse,
  AdminCredentials,
  AdminKeyDraft,
  AdminPanelTab,
  AdminRequestDraft,
  AdminRequestFilter,
  AdminVipIllustrationRequest,
  AdminVipRequestFilter
} from '../../models/admin.types';

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
  private readonly modalService = inject(ModalService);

  readonly filters: readonly AdminRequestFilter[] = ['all', 'pending', 'approved', 'rejected', 'need_more_info', 'disabled'];
  readonly vipRequestFilters: readonly AdminVipRequestFilter[] = ['all', 'pending', 'reviewed', 'accepted', 'rejected', 'done', 'disabled'];
  readonly tabs: readonly AdminPanelTab[] = ['requests', 'keys', 'gallery', 'vipRequests'];
  readonly texts = this.languageService.texts;

  adminUsername = '';
  adminPassword = '';
  isAuthenticated = false;
  isAuthenticating = false;
  isFetching = false;
  errorMessage = '';
  successMessage = '';
  activeAdminTab: AdminPanelTab = 'requests';
  activeFilter: AdminRequestFilter = 'all';
  activeVipRequestFilter: AdminVipRequestFilter = 'all';
  processingRequestCode: string | null = null;
  processingRequestAction: 'approve' | 'reject' | 'needMoreInfo' | 'disable' | null = null;
  processingUserCode: string | null = null;
  processingKeyAction: 'disable' | 'extend' | null = null;
  processingVipRequestId: number | null = null;
  isRequestsRefreshing = false;
  isAccessKeysRefreshing = false;
  isVipRequestsFetching = false;
  vipRequestsErrorMessage = '';
  requestsLastUpdatedAt: Date | null = null;
  accessKeysLastUpdatedAt: Date | null = null;
  vipRequestsLastUpdatedAt: Date | null = null;

  requests: AdminAccessRequestItem[] = [];
  accessKeys: AdminAccessKeyItem[] = [];
  vipIllustrationRequests: AdminVipIllustrationRequest[] = [];
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
      this.processingUserCode !== null ||
      this.processingVipRequestId !== null
    );
  }

  isLoginInvalid(): boolean {
    return !this.adminUsername.trim() || !this.adminPassword.trim();
  }

  isApproveDraftInvalid(requestCode: string): boolean {
    const durationDays = this.requestDraft(requestCode).durationDays;
    return !Number.isFinite(durationDays) || durationDays <= 0 || !requestCode.trim();
  }

  isNotesDraftEmpty(requestCode: string): boolean {
    return !this.requestDraft(requestCode).notes.trim() || !requestCode.trim();
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
      this.markViewForUpdate();
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
    this.vipIllustrationRequests = [];
    this.isVipRequestsFetching = false;
    this.vipRequestsErrorMessage = '';
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

  filteredVipRequests(): AdminVipIllustrationRequest[] {
    if (this.activeVipRequestFilter === 'all') return this.vipIllustrationRequests;
    return this.vipIllustrationRequests.filter(request => request.status === this.activeVipRequestFilter);
  }

  setActiveAdminTab(tab: AdminPanelTab): void {
    this.activeAdminTab = tab;
    this.markViewForUpdate();
  }

  setActiveFilter(filter: AdminRequestFilter): void {
    this.activeFilter = filter;
    this.markViewForUpdate();
  }

  setActiveVipRequestFilter(filter: AdminVipRequestFilter): void {
    this.activeVipRequestFilter = filter;
    this.markViewForUpdate();
  }

  adminTabLabel(tab: AdminPanelTab): string {
    return this.texts().admin.tabs[tab];
  }

  requestFilterLabel(filter: AdminRequestFilter): string {
    const filters = this.texts().admin.requestFilters;

    switch (filter) {
      case 'all':
        return filters.all;
      case 'pending':
        return filters.pending;
      case 'approved':
        return filters.approved;
      case 'rejected':
        return filters.rejected;
      case 'need_more_info':
        return filters.needMoreInfo;
      case 'disabled':
        return filters.disabled;
    }
  }

  vipRequestFilterLabel(filter: AdminVipRequestFilter): string {
    if (filter === 'all') return this.texts().admin.requestFilters.all;
    return this.texts().statuses[filter];
  }

  requestCount(filter: AdminRequestFilter): number {
    if (filter === 'all') return this.requests.length;
    return this.requests.filter(request => request.status === filter).length;
  }

  vipRequestCount(filter: AdminVipRequestFilter): number {
    if (filter === 'all') return this.vipIllustrationRequests.length;
    return this.vipIllustrationRequests.filter(request => request.status === filter).length;
  }

  requestStatusLabel(status: AdminAccessRequestStatus): string {
    switch (status) {
      case 'pending':
        return this.texts().statuses.pending;
      case 'approved':
        return this.texts().statuses.approved;
      case 'rejected':
        return this.texts().statuses.rejected;
      case 'need_more_info':
        return this.texts().statuses.need_more_info;
      case 'disabled':
        return this.texts().statuses.disabled;
    }
  }

  vipRequestStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return this.texts().statuses.pending;
      case 'reviewed':
        return this.texts().statuses.reviewed;
      case 'accepted':
        return this.texts().statuses.accepted;
      case 'rejected':
        return this.texts().statuses.rejected;
      case 'done':
        return this.texts().statuses.done;
      case 'disabled':
        return this.texts().statuses.disabled;
      default:
        return status || this.texts().statuses.unknown;
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

  requestStateHelp(status: AdminAccessRequestStatus): string {
    const requestState = this.texts().admin.requestState;

    switch (status) {
      case 'pending':
        return requestState.pendingHelp;
      case 'need_more_info':
        return requestState.needMoreInfoHelp;
      case 'approved':
        return requestState.approvedHelp;
      case 'rejected':
        return requestState.rejectedHelp;
      case 'disabled':
        return requestState.disabledHelp;
    }
  }

  canShowDecisionActions(status: AdminAccessRequestStatus): boolean {
    return status === 'pending' || status === 'need_more_info';
  }

  processedRequestMessage(status: AdminAccessRequestStatus): string {
    if (status === 'approved') return this.texts().admin.requestActions.alreadyApproved;
    if (status === 'rejected') return this.texts().admin.requestActions.alreadyRejected;
    if (status === 'disabled') return this.texts().admin.requestActions.alreadyDisabled;

    return '';
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
    this.markViewForUpdate();
  }

  setRequestNotes(requestCode: string, value: string): void {
    this.ensureRequestDraft(requestCode);
    this.requestDraft(requestCode).notes = value;
    this.markViewForUpdate();
  }

  setKeyNotes(userCode: string, value: string): void {
    this.ensureKeyDraft(userCode);
    this.keyDraft(userCode).notes = value;
    this.markViewForUpdate();
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
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.panel.approveSuccess, 2000);
      await this.refreshData(credentials);
    }, this.texts().admin.panel.approveFailed);
  }

  async rejectRequest(request: AdminAccessRequestItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    const notes = this.requestDraft(request.requestCode).notes.trim();
    if (!notes) {
      this.errorMessage = this.texts().admin.panel.rejectNotesRequired;
      this.markViewForUpdate();
      return;
    }

    if (!(await this.confirmSensitiveAction())) return;

    await this.runRequestAction(request.requestCode, 'reject', async () => {
      await this.adminService.rejectRequest(credentials, request.requestCode, notes);
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.panel.rejectSuccess, 1500);
      await this.refreshData(credentials);
    }, this.texts().admin.panel.rejectFailed);
  }

  async needMoreInfo(request: AdminAccessRequestItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    const notes = this.requestDraft(request.requestCode).notes.trim();
    if (!notes) {
      this.errorMessage = this.texts().admin.panel.needMoreInfoNotesRequired;
      this.markViewForUpdate();
      return;
    }

    if (!(await this.confirmSensitiveAction())) return;

    await this.runRequestAction(request.requestCode, 'needMoreInfo', async () => {
      await this.adminService.needMoreInfo(credentials, request.requestCode, notes);
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.panel.needMoreInfoSuccess, 1500);
      await this.refreshData(credentials);
    }, this.texts().admin.panel.updateFailed);
  }

  async disableAccessRequest(request: AdminAccessRequestItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials || !request.requestCode.trim()) return;
    const confirmed = await this.modalService.confirm(
      this.texts().modal.confirm,
      this.texts().admin.requestActions.confirmDisableRequest,
      this.texts().modal.ok,
      this.texts().modal.cancel
    );
    if (!confirmed) return;

    const notes = this.requestDraft(request.requestCode).notes.trim();

    await this.runRequestAction(request.requestCode, 'disable', async () => {
      await this.adminService.disableAccessRequest(credentials, request.requestCode, notes);
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.panel.disableRequestSuccess, 1500);
      await this.refreshData(credentials);
    }, this.texts().admin.panel.disableRequestFailed);
  }

  async disableAccessKey(item: AdminAccessKeyItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;
    if (!(await this.confirmSensitiveAction())) return;

    await this.runKeyAction(item.userCode, 'disable', async () => {
      await this.adminService.disableAccessKey(credentials, item.userCode, this.keyDraft(item.userCode).notes.trim());
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.panel.disableSuccess, 1500);
      await this.refreshData(credentials);
    }, this.texts().admin.panel.disableFailed);
  }

  async extendAccessKey(item: AdminAccessKeyItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    await this.runKeyAction(item.userCode, 'extend', async () => {
      await this.adminService.extendAccessKey(credentials, item.userCode, 30, this.keyDraft(item.userCode).notes.trim());
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.panel.extendSuccess, 1500);
      await this.refreshData(credentials);
    }, this.texts().admin.panel.extendFailed);
  }

  async completeVipRequest(request: AdminVipIllustrationRequest): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials || request.status !== 'pending') return;
    const confirmed = await this.modalService.confirm(
      this.texts().modal.confirm,
      this.texts().admin.vipRequests.confirmComplete,
      this.texts().modal.ok,
      this.texts().modal.cancel
    );
    if (!confirmed) return;

    this.processingVipRequestId = request.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.markViewForUpdate();

    try {
      const updatedRequest = await this.adminService.adminUpdateVipIllustrationRequestStatus(
        credentials,
        request.id,
        'done',
        request.adminReply.trim()
      );
      this.replaceVipIllustrationRequest(updatedRequest);
      this.modalService.showSuccess(this.texts().modal.success, this.texts().admin.vipRequests.completeSuccess, 1500);
    } catch (error) {
      const message = this.toAdminError(error, this.texts().admin.vipRequests.updateFailed);
      this.errorMessage = '';
      this.modalService.showError(this.texts().modal.error, message);
    } finally {
      this.processingVipRequestId = null;
      this.markViewForUpdate();
    }
  }

  toggleKey(userCode: string): void {
    if (this.revealedKeys.has(userCode)) {
      this.revealedKeys.delete(userCode);
      this.markViewForUpdate();
      return;
    }

    this.revealedKeys.add(userCode);
    this.markViewForUpdate();
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

  maskUserCode(userCode: string | undefined): string {
    if (!userCode) return '';
    const [prefix] = userCode.split('-');
    return `${prefix || 'KNK'}-****-${userCode.slice(-4)}`;
  }

  async copyText(value: string | undefined, label: string): Promise<void> {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      this.modalService.showSuccess(
        this.texts().modal.success,
        this.texts().admin.panel.copySuccess.replace('{label}', label),
        1500
      );
      this.errorMessage = '';
    } catch {
      this.errorMessage = this.texts().admin.panel.copyFailed;
      this.modalService.showError(this.texts().modal.error, this.errorMessage);
    } finally {
      this.markViewForUpdate();
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

  trackVipRequest(_: number, item: AdminVipIllustrationRequest): number {
    return item.id;
  }

  isRequestProcessing(requestCode: string, action?: 'approve' | 'reject' | 'needMoreInfo' | 'disable'): boolean {
    return this.processingRequestCode === requestCode && (!action || this.processingRequestAction === action);
  }

  isKeyProcessing(userCode: string, action?: 'disable' | 'extend'): boolean {
    return this.processingUserCode === userCode && (!action || this.processingKeyAction === action);
  }

  isVipRequestProcessing(id: number): boolean {
    return this.processingVipRequestId === id;
  }

  async refreshActiveAdminTab(): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    switch (this.activeAdminTab) {
      case 'requests':
        await this.refreshAccessRequests(credentials, true);
        return;
      case 'keys':
        await this.refreshAccessKeys(credentials, true);
        return;
      case 'vipRequests':
        await this.loadVipIllustrationRequests(credentials, true);
        return;
      case 'gallery':
        return;
    }
  }

  lastUpdatedLabel(date: Date | null): string {
    if (!date) return '';
    return `${this.texts().refresh.lastUpdated}: ${this.formatTime(date)}`;
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
      const message = this.toAdminError(error, this.texts().admin.panel.dataLoadFailed);
      this.modalService.showError(this.texts().modal.error, message);
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
    const now = new Date();
    this.requestsLastUpdatedAt = now;
    this.accessKeysLastUpdatedAt = now;
    this.ensureDrafts();
    this.markViewForUpdate();
    await this.loadVipIllustrationRequests(credentials);
  }

  private async refreshAccessRequests(credentials: AdminCredentials, showSuccessMessage = false): Promise<void> {
    this.isRequestsRefreshing = true;
    this.errorMessage = '';
    if (showSuccessMessage) {
      this.successMessage = '';
    }
    this.markViewForUpdate();

    try {
      this.requests = await this.adminService.getAccessRequests(credentials);
      this.requests.forEach(request => this.ensureRequestDraft(request.requestCode));
      this.requestsLastUpdatedAt = new Date();
      if (showSuccessMessage) {
        this.modalService.showSuccess(this.texts().modal.success, this.texts().refresh.success, 1500);
      }
    } catch (error) {
      const message = this.toAdminError(error, this.texts().admin.panel.dataLoadFailed);
      this.modalService.showError(this.texts().modal.error, message);
    } finally {
      this.isRequestsRefreshing = false;
      this.markViewForUpdate();
    }
  }

  private async refreshAccessKeys(credentials: AdminCredentials, showSuccessMessage = false): Promise<void> {
    this.isAccessKeysRefreshing = true;
    this.errorMessage = '';
    if (showSuccessMessage) {
      this.successMessage = '';
    }
    this.markViewForUpdate();

    try {
      this.accessKeys = await this.adminService.getAccessKeys(credentials);
      this.accessKeys.forEach(item => this.ensureKeyDraft(item.userCode));
      this.accessKeysLastUpdatedAt = new Date();
      if (showSuccessMessage) {
        this.modalService.showSuccess(this.texts().modal.success, this.texts().refresh.success, 1500);
      }
    } catch (error) {
      const message = this.toAdminError(error, this.texts().admin.panel.dataLoadFailed);
      this.modalService.showError(this.texts().modal.error, message);
    } finally {
      this.isAccessKeysRefreshing = false;
      this.markViewForUpdate();
    }
  }

  private async loadVipIllustrationRequests(credentials: AdminCredentials, showSuccessMessage = false): Promise<void> {
    this.isVipRequestsFetching = true;
    this.vipRequestsErrorMessage = '';
    if (showSuccessMessage) {
      this.successMessage = '';
    }
    this.markViewForUpdate();

    try {
      this.vipIllustrationRequests = await this.adminService.adminGetVipIllustrationRequests(credentials);
      this.vipRequestsLastUpdatedAt = new Date();
      if (showSuccessMessage) {
        this.modalService.showSuccess(this.texts().modal.success, this.texts().refresh.success, 1500);
      }
    } catch {
      this.vipIllustrationRequests = [];
      this.vipRequestsErrorMessage = this.texts().admin.vipRequests.error;
      if (showSuccessMessage) {
        this.modalService.showError(this.texts().modal.error, this.vipRequestsErrorMessage);
      }
    } finally {
      this.isVipRequestsFetching = false;
      this.markViewForUpdate();
    }
  }

  private replaceVipIllustrationRequest(updatedRequest: AdminVipIllustrationRequest): void {
    const existingIndex = this.vipIllustrationRequests.findIndex(request => request.id === updatedRequest.id);
    if (existingIndex === -1) {
      this.vipIllustrationRequests = [updatedRequest, ...this.vipIllustrationRequests];
      return;
    }

    this.vipIllustrationRequests = this.vipIllustrationRequests.map(request =>
      request.id === updatedRequest.id ? updatedRequest : request
    );
  }

  private async runRequestAction(
    requestCode: string,
    actionName: 'approve' | 'reject' | 'needMoreInfo' | 'disable',
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
      const message = this.toAdminError(error, fallbackMessage);
      this.errorMessage = '';
      this.successMessage = '';
      this.modalService.showError(this.texts().modal.error, message);
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
      const message = this.toAdminError(error, fallbackMessage);
      this.errorMessage = '';
      this.successMessage = '';
      this.modalService.showError(this.texts().modal.error, message);
    } finally {
      this.processingUserCode = null;
      this.processingKeyAction = null;
      this.markViewForUpdate();
    }
  }

  private requireCredentials(): AdminCredentials | null {
    if (this.credentials) return this.credentials;

    this.errorMessage = this.texts().admin.panel.authenticationRequired;
    this.markViewForUpdate();
    return null;
  }

  private toAdminError(error: unknown, fallbackMessage: string): string {
    const message = error instanceof Error ? error.message : undefined;
    const friendly = getUserFriendlyApiErrorMessage(message, 'admin', this.texts().apiErrors);

    return friendly === this.texts().apiErrors.adminSystem ? fallbackMessage : friendly;
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

  private confirmSensitiveAction(): Promise<boolean> {
    return this.modalService.confirm(
      this.texts().modal.confirm,
      this.texts().admin.requestActions.confirmAction,
      this.texts().modal.ok,
      this.texts().modal.cancel
    );
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
