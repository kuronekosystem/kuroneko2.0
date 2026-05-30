import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getUserFriendlyApiErrorMessage } from '../core/errors/api-error-message';
import { AccessRequestStatus } from '../core/models/access.models';
import { LoadingMessageComponent } from '../shared/components/loading-message/loading-message.component';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
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
  imports: [CommonModule, FormsModule, LoadingMessageComponent, LoadingSpinnerComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly filters: readonly AdminRequestFilter[] = ['all', 'pending', 'approved', 'rejected', 'need_more_info'];

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
      this.errorMessage = '管理者IDと管理者キーを入力してください。';
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
    if (filter === 'all') return 'すべて';
    return this.requestStatusLabel(filter);
  }

  requestStatusLabel(status: AccessRequestStatus): string {
    switch (status) {
      case 'pending':
        return '確認待ち';
      case 'approved':
        return '承認済み';
      case 'rejected':
        return '却下';
      case 'need_more_info':
        return '追加確認';
    }
  }

  keyStatusLabel(status: AdminAccessKeyStatus): string {
    switch (status) {
      case 'active':
        return '有効';
      case 'expired':
        return '期限切れ';
      case 'disabled':
        return '無効';
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
      this.successMessage = '承認しました。この情報をユーザーに共有してください。';
      await this.refreshData(credentials);
    }, '承認できませんでした。');
  }

  async rejectRequest(request: AdminAccessRequestItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    const notes = this.requestDraft(request.requestCode).notes.trim();
    if (!notes) {
      this.errorMessage = '却下理由を入力してください。';
      return;
    }

    await this.runRequestAction(request.requestCode, 'reject', async () => {
      await this.adminService.rejectRequest(credentials, request.requestCode, notes);
      this.successMessage = '却下しました。';
      await this.refreshData(credentials);
    }, '却下できませんでした。');
  }

  async needMoreInfo(request: AdminAccessRequestItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    const notes = this.requestDraft(request.requestCode).notes.trim();
    if (!notes) {
      this.errorMessage = '追加確認の内容を入力してください。';
      return;
    }

    await this.runRequestAction(request.requestCode, 'needMoreInfo', async () => {
      await this.adminService.needMoreInfo(credentials, request.requestCode, notes);
      this.successMessage = '追加確認に変更しました。';
      await this.refreshData(credentials);
    }, '更新できませんでした。');
  }

  async disableAccessKey(item: AdminAccessKeyItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    await this.runKeyAction(item.userCode, 'disable', async () => {
      await this.adminService.disableAccessKey(credentials, item.userCode, this.keyDraft(item.userCode).notes.trim());
      this.successMessage = 'アクセスキーを無効化しました。';
      await this.refreshData(credentials);
    }, '無効化できませんでした。');
  }

  async extendAccessKey(item: AdminAccessKeyItem): Promise<void> {
    const credentials = this.requireCredentials();
    if (!credentials) return;

    await this.runKeyAction(item.userCode, 'extend', async () => {
      await this.adminService.extendAccessKey(credentials, item.userCode, 30, this.keyDraft(item.userCode).notes.trim());
      this.successMessage = 'アクセス期限を延長しました。';
      await this.refreshData(credentials);
    }, '延長できませんでした。');
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
      this.successMessage = `${label}をコピーしました。`;
      this.errorMessage = '';
    } catch {
      this.errorMessage = 'コピーできませんでした。手動で選択してください。';
    }
  }

  async copyKeyPair(item: AdminAccessKeyItem): Promise<void> {
    await this.copyText(`userCode: ${item.userCode}\naccessKey: ${item.accessKey}`, 'アクセス情報');
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
      this.errorMessage = this.toAdminError(error, '管理データを読み込めませんでした。');
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
      this.errorMessage = this.toAdminError(error, '管理データを読み込めませんでした。');
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

    this.errorMessage = '管理者認証が必要です。';
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
