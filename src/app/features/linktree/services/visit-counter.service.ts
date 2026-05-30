import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/access.models';
import { KuronekoApiService } from '../../../core/services/kuroneko-api.service';

type VisitCounterResponse = ApiResponse<{
  count?: number;
}>;

@Injectable({
  providedIn: 'root'
})
export class VisitCounterService {
  private readonly api = inject(KuronekoApiService);
  private readonly visitCountedSessionKey = environment.storage.visitCounted;

  async loadVisitCount(): Promise<number | null> {
    const shouldIncrement = sessionStorage.getItem(this.visitCountedSessionKey) !== 'true';

    try {
      if (shouldIncrement) {
        sessionStorage.setItem(this.visitCountedSessionKey, 'true');
      }

      const response = shouldIncrement
        ? await this.api.get<VisitCounterResponse>({ counter: 'increment' })
        : await this.api.get<VisitCounterResponse>({ counter: 'get' });

      if (!response.success || typeof response.count !== 'number') {
        return null;
      }

      return response.count;
    } catch {
      return null;
    }
  }
}
