import { Injectable, inject } from '@angular/core';
import { LanguageService } from '../../../core/i18n/language.service';
import { AccessService } from '../../../core/services/access.service';
import { KuronekoApiService } from '../../../core/services/kuroneko-api.service';
import {
  SaveVipIllustrationRequestResponse,
  VipIllustrationRequest,
  VipIllustrationRequestsResponse
} from '../../../core/models/vip-board.models';

@Injectable({
  providedIn: 'root'
})
export class VipBoardService {
  private readonly accessService = inject(AccessService);
  private readonly api = inject(KuronekoApiService);
  private readonly languageService = inject(LanguageService);
  private readonly texts = this.languageService.texts;

  async saveSuggestion(title: string, message: string): Promise<SaveVipIllustrationRequestResponse> {
    const credentials = this.accessService.getSessionCredentials();
    if (!credentials) {
      throw new Error(this.texts().vipBoard.sessionMissing);
    }

    return this.api.post<SaveVipIllustrationRequestResponse>({
      action: 'save_vip_illustration_request',
      userCode: credentials.userCode,
      accessKey: credentials.accessKey,
      title: title.trim(),
      message: message.trim()
    });
  }

  async getSuggestions(): Promise<VipIllustrationRequest[]> {
    const credentials = this.accessService.getSessionCredentials();
    if (!credentials) {
      throw new Error(this.texts().vipBoard.sessionMissing);
    }

    const response = await this.api.post<VipIllustrationRequestsResponse>({
      action: 'get_vip_illustration_requests',
      userCode: credentials.userCode,
      accessKey: credentials.accessKey
    });

    if (!response.success) {
      throw new Error(response.message || this.texts().vipBoard.loadFailed);
    }

    return response.items ?? [];
  }
}
