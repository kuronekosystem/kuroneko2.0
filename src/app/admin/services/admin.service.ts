import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { KuronekoApiService } from '../../core/services/kuroneko-api.service';
import {
  AdminAccessKeyItem,
  AdminAccessKeysResponse,
  AdminAccessRequestItem,
  AdminAccessRequestsResponse,
  AdminApproveAccessResponse,
  AdminCredentials,
  AdminGalleryItem,
  AdminGalleryItemPayload,
  AdminGalleryItemResponse,
  AdminGalleryItemsResponse,
  AdminMutationResponse
} from '../models/admin.types';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly api = inject(KuronekoApiService);
  private readonly adminSessionKey = environment.storage.adminSession;

  getStoredCredentials(): AdminCredentials | null {
    const rawSession = sessionStorage.getItem(this.adminSessionKey);
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
    sessionStorage.setItem(this.adminSessionKey, JSON.stringify(credentials));
  }

  clearCredentials(): void {
    sessionStorage.removeItem(this.adminSessionKey);
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

  async adminGetGalleryItems(credentials: AdminCredentials): Promise<AdminGalleryItem[]> {
    const response = await this.api.post<AdminGalleryItemsResponse>({
      action: 'admin_get_gallery_items',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword
    });

    this.assertSuccess(response, 'ギャラリー項目を読み込めませんでした。');
    return response.items ?? [];
  }

  async adminAddGalleryItem(
    credentials: AdminCredentials,
    payload: AdminGalleryItemPayload
  ): Promise<AdminGalleryItem> {
    const response = await this.api.post<AdminGalleryItemResponse>({
      action: 'admin_add_gallery_item',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword,
      ...payload
    });

    this.assertSuccess(response, 'ギャラリー項目を追加できませんでした。');
    return this.readGalleryItem(response);
  }

  async adminUpdateGalleryItem(
    credentials: AdminCredentials,
    id: string,
    payload: AdminGalleryItemPayload
  ): Promise<AdminGalleryItem> {
    const response = await this.api.post<AdminGalleryItemResponse>({
      action: 'admin_update_gallery_item',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword,
      id,
      ...payload
    });

    this.assertSuccess(response, 'ギャラリー項目を更新できませんでした。');
    return this.readGalleryItem(response);
  }

  async adminDisableGalleryItem(credentials: AdminCredentials, id: string): Promise<void> {
    const response = await this.api.post<AdminMutationResponse>({
      action: 'admin_disable_gallery_item',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword,
      id
    });

    this.assertSuccess(response, 'ギャラリー項目を非公開にできませんでした。');
  }

  async adminDeleteGalleryItem(credentials: AdminCredentials, id: string): Promise<void> {
    const response = await this.api.post<AdminMutationResponse>({
      action: 'admin_delete_gallery_item',
      adminUsername: credentials.adminUsername,
      adminPassword: credentials.adminPassword,
      id
    });

    this.assertSuccess(response, 'ギャラリー項目を削除できませんでした。');
  }

  private assertSuccess(response: { success: boolean; message?: string }, fallbackMessage: string): void {
    if (!response.success) {
      throw new Error(response.message || fallbackMessage);
    }
  }

  private readGalleryItem(response: AdminGalleryItemResponse): AdminGalleryItem {
    if (response.item) return response.item;

    if (
      typeof response.id === 'string' &&
      typeof response.title === 'string' &&
      typeof response.description === 'string' &&
      typeof response.thumbnail === 'string' &&
      typeof response.fullSize === 'string' &&
      typeof response.category === 'string' &&
      (response.status === 'active' || response.status === 'disabled') &&
      typeof response.createdAt === 'string' &&
      typeof response.updatedAt === 'string'
    ) {
      return {
        id: response.id,
        title: response.title,
        description: response.description,
        thumbnail: response.thumbnail,
        fullSize: response.fullSize,
        category: response.category,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };
    }

    throw new Error('ギャラリー項目のレスポンスを確認できませんでした。');
  }
}
