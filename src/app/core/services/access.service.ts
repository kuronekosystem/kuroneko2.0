import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { KuronekoApiService } from './kuroneko-api.service';
import {
  AccessRequestPayload,
  AccessRequestResponse,
  AccessStatusResponse,
  ValidateAccessResponse,
  VipAccessSession,
  VipCredentials
} from '../models/access.models';

@Injectable({
  providedIn: 'root'
})
export class AccessService {
  private readonly api = inject(KuronekoApiService);
  private readonly vipSessionKey = environment.storage.vipSession;

  async validateAccess(userCode: string, accessKey: string): Promise<ValidateAccessResponse> {
    return this.api.post<ValidateAccessResponse>({
      action: 'validate_access_key',
      userCode: userCode.trim(),
      accessKey: accessKey.trim()
    });
  }

  async requestAccess(payload: AccessRequestPayload): Promise<AccessRequestResponse> {
    return this.api.post<AccessRequestResponse>({
      action: 'request_access',
      displayName: payload.displayName.trim(),
      source: payload.source,
      fanboxName: payload.fanboxName?.trim() || '',
      paypalTransactionId: payload.paypalTransactionId?.trim() || '',
      contact: payload.contact?.trim() || '',
      proofText: payload.proofText?.trim() || ''
    });
  }

  async checkRequestStatus(requestCode: string): Promise<AccessStatusResponse> {
    return this.api.post<AccessStatusResponse>({
      action: 'check_request_status',
      requestCode: requestCode.trim()
    });
  }

  getStoredSession(): VipAccessSession | null {
    const rawSession = sessionStorage.getItem(this.vipSessionKey);
    if (!rawSession) return null;

    try {
      const parsed = JSON.parse(rawSession) as Partial<VipAccessSession>;
      if (
        typeof parsed.userCode === 'string' &&
        typeof parsed.accessKey === 'string' &&
        typeof parsed.displayName === 'string' &&
        (parsed.source === 'fanbox' || parsed.source === 'paypal') &&
        typeof parsed.status === 'string' &&
        typeof parsed.startDate === 'string' &&
        typeof parsed.endDate === 'string'
      ) {
        return {
          userCode: parsed.userCode,
          accessKey: parsed.accessKey,
          displayName: parsed.displayName,
          source: parsed.source,
          status: parsed.status,
          startDate: parsed.startDate,
          endDate: parsed.endDate
        };
      }
    } catch {
      this.clearSession();
    }

    return null;
  }

  saveSession(session: VipAccessSession): void {
    sessionStorage.setItem(this.vipSessionKey, JSON.stringify(session));
  }

  clearSession(): void {
    sessionStorage.removeItem(this.vipSessionKey);
  }

  hasValidSession(): boolean {
    const session = this.getStoredSession();
    return !!session && session.status === 'active';
  }

  getSessionCredentials(): VipCredentials | null {
    const session = this.getStoredSession();
    if (!session) return null;

    return {
      userCode: session.userCode,
      accessKey: session.accessKey
    };
  }
}

export const vipSessionGuard: CanActivateFn = () => {
  const accessService = inject(AccessService);
  const router = inject(Router);

  return accessService.hasValidSession() ? true : router.createUrlTree(['/access/login']);
};
