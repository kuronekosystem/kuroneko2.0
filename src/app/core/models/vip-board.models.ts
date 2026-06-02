export type VipIllustrationRequestStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'done' | 'disabled';

export interface VipIllustrationRequest {
  id: number;
  userCode: string;
  displayName: string;
  title: string;
  message: string;
  status: VipIllustrationRequestStatus;
  adminReply: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveVipIllustrationRequestResponse {
  success: boolean;
  message?: string;
}

export interface VipIllustrationRequestsResponse {
  success: boolean;
  message?: string;
  items?: VipIllustrationRequest[];
}
