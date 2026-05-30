import { AccessRequestStatus, AccessSource, ApiResponse } from '../../core/models/access.models';

export interface AdminCredentials {
  adminUsername: string;
  adminPassword: string;
}

export interface AdminAccessRequestItem {
  id: number;
  requestCode: string;
  displayName: string;
  source: AccessSource;
  fanboxName: string;
  paypalTransactionId: string;
  contact: string;
  proofText: string;
  status: AccessRequestStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminAccessKeyStatus = 'active' | 'expired' | 'disabled';

export interface AdminAccessKeyItem {
  id: number;
  userCode: string;
  accessKey: string;
  requestCode: string;
  displayName: string;
  source: AccessSource;
  status: AdminAccessKeyStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  notes: string;
}

export type AdminAccessRequestsResponse = ApiResponse<{
  items?: AdminAccessRequestItem[];
}>;

export type AdminAccessKeysResponse = ApiResponse<{
  items?: AdminAccessKeyItem[];
}>;

export type AdminApproveAccessResponse = ApiResponse<{
  requestCode?: string;
  userCode?: string;
  accessKey?: string;
  startDate?: string;
  endDate?: string;
}>;

export type AdminMutationResponse = ApiResponse<{
  requestCode?: string;
  userCode?: string;
}>;

export interface AdminRequestDraft {
  durationDays: number;
  notes: string;
}

export interface AdminKeyDraft {
  notes: string;
}

export type AdminRequestFilter = 'all' | AccessRequestStatus;

export type GalleryItemStatus = 'active' | 'disabled';

export type AdminGalleryFilter = 'all' | GalleryItemStatus;

export interface AdminGalleryItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly thumbnail: string;
  readonly fullSize: string;
  readonly category: string;
  readonly status: GalleryItemStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminGalleryItemPayload {
  readonly title: string;
  readonly description: string;
  readonly thumbnail: string;
  readonly fullSize: string;
  readonly category: string;
  readonly status: GalleryItemStatus;
}

export type AdminGalleryItemsResponse = ApiResponse<{
  items?: AdminGalleryItem[];
}>;

export type AdminGalleryItemResponse = ApiResponse<{
  item?: AdminGalleryItem;
} & Partial<AdminGalleryItem>>;
