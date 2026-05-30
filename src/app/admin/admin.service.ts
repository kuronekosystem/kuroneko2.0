import { Injectable, inject } from '@angular/core';
import { KuronekoApiService } from '../core/services/kuroneko-api.service';
import {
  AdminAccessKeyItem,
  AdminAccessKeysResponse,
  AdminAccessRequestItem,
  AdminAccessRequestsResponse,
  AdminApproveAccessResponse,
  AdminCredentials,
  AdminMutationResponse
} from './admin.types';

const ADMIN_SESSION_KEY = 'kuronekoAdminSession';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly api = inject(KuronekoApiService);

  getStoredCredentials(): AdminCredentials | null {
    const rawSession = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!rawSession) return null;

    try {
      const parsed = JSON.parse(rawSession) as Partial<AdminCredentials>;
      if (typeof parsed.adminUsername === 'string' && typeof parsed.adminPassword === 'string') {
        return {
          adminUsername: parsed.adminUsername,
          adminPassword: parsed.adminPassword
        };
      }
    } catch {
      this.clearCredentials();
    }

    return null;
  }

  saveCredentials(credentials: AdminCredentials): void {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(credentials));
  }

  clearCredentials(): void {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }

  async getAccessRequests(credentials: AdminCredentials): Promise<AdminAccessRequestItem[]> {
    const response = await this.api.post<AdminAccessRequestsResponse>({
      action: 'admin_get_access_requests',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword
    });

    this.assertSuccess(response, 'アクセス申請を読み込めませんでした。');
    return response.items ?? [];
  }

  async getAccessKeys(credentials: AdminCredentials): Promise<AdminAccessKeyItem[]> {
    const response = await this.api.post<AdminAccessKeysResponse>({
      action: 'admin_get_access_keys',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword
    });

    this.assertSuccess(response, '発行済みアクセスキーを読み込めませんでした。');
    return response.items ?? [];
  }

  async approveRequest(
    credentials: AdminCredentials,
    requestCode: string,
    durationDays: number,
    notes: string
  ): Promise<AdminApproveAccessResponse> {
    const response = await this.api.post<AdminApproveAccessResponse>({
      action: 'approve_access_request',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword,
      requestCode,
      durationDays,
      notes
    });

    this.assertSuccess(response, '申請を承認できませんでした。');
    return response;
  }

  async rejectRequest(credentials: AdminCredentials, requestCode: string, notes: string): Promise<AdminMutationResponse> {
    const response = await this.api.post<AdminMutationResponse>({
      action: 'reject_access_request',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword,
      requestCode,
      notes
    });

    this.assertSuccess(response, '申請を却下できませんでした。');
    return response;
  }

  async needMoreInfo(credentials: AdminCredentials, requestCode: string, notes: string): Promise<AdminMutationResponse> {
    const response = await this.api.post<AdminMutationResponse>({
      action: 'need_more_info_request',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword,
      requestCode,
      notes
    });

    this.assertSuccess(response, '追加確認に変更できませんでした。');
    return response;
  }

  async disableAccessKey(credentials: AdminCredentials, userCode: string, notes: string): Promise<AdminMutationResponse> {
    const response = await this.api.post<AdminMutationResponse>({
      action: 'disable_access_key',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword,
      userCode,
      notes
    });

    this.assertSuccess(response, 'アクセスキーを無効化できませんでした。');
    return response;
  }

  async extendAccessKey(
    credentials: AdminCredentials,
    userCode: string,
    durationDays: number,
    notes: string
  ): Promise<AdminMutationResponse> {
    const response = await this.api.post<AdminMutationResponse>({
      action: 'extend_access_key',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword,
      userCode,
      durationDays,
      notes
    });

    this.assertSuccess(response, 'アクセスキーを延長できませんでした。');
    return response;
  }

  private assertSuccess(response: { success: boolean; message?: string }, fallbackMessage: string): void {
    if (!response.success) {
      throw new Error(response.message || fallbackMessage);
    }
  }
}
