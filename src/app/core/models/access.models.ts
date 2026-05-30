export type AccessSource = 'fanbox' | 'paypal';

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'need_more_info';

export interface VipAccessSession {
  userCode: string;
  accessKey: string;
  displayName: string;
  source: AccessSource;
  status: string;
  startDate: string;
  endDate: string;
}

export interface AccessRequestPayload {
  displayName: string;
  source: AccessSource;
  fanboxName?: string;
  paypalTransactionId?: string;
  contact?: string;
  proofText?: string;
}

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
} & T;

export type AccessRequestResponse = ApiResponse<{
  requestCode?: string;
  status?: AccessRequestStatus;
}>;

export type AccessStatusResponse = ApiResponse<{
  requestCode?: string;
  displayName?: string;
  source?: AccessSource;
  status?: AccessRequestStatus;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  userCode?: string;
  accessKey?: string;
  accessStatus?: string;
  startDate?: string;
  endDate?: string;
}>;

export type ValidateAccessResponse = ApiResponse<{
  userCode?: string;
  accessKey?: string;
  displayName?: string;
  source?: AccessSource;
  status?: string;
  startDate?: string;
  endDate?: string;
}>;

export interface VipCredentials {
  userCode: string;
  accessKey: string;
}
