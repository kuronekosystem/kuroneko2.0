import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '../../../core/models/access.models';
import { KuronekoApiService } from '../../../core/services/kuroneko-api.service';

const VISIT_COUNTED_SESSION_KEY = 'kuronekoVisitCounted';

type VisitCounterResponse = ApiResponse<{
  count?: number;
}>;

@Injectable({
  providedIn: 'root'
})
export class VisitCounterService {
  private readonly api = inject(KuronekoApiService);

  async loadVisitCount(): Promise<number | null> {
    const shouldIncrement = sessionStorage.getItem(VISIT_COUNTED_SESSION_KEY) !== 'true';

    try {
      if (shouldIncrement) {
        sessionStorage.setItem(VISIT_COUNTED_SESSION_KEY, 'true');
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
