import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { KURONEKO_API_CONFIG } from '../constants/api.config';

@Injectable({
  providedIn: 'root'
})
export class KuronekoApiService {
  private readonly baseUrl = KURONEKO_API_CONFIG.baseUrl;
  private readonly debugApi = environment.debug.api;

  async get<T>(params: Record<string, string>): Promise<T> {
    const query = new URLSearchParams(params);
    const url = `${this.baseUrl}?${query.toString()}`;
    const action = params['action'] ?? (params['counter'] ? `counter:${params['counter']}` : 'GET');

    return this.request<T>(url, { method: 'GET', action, payload: params });
  }

  async post<T>(payload: Record<string, unknown>): Promise<T> {
    const action = typeof payload['action'] === 'string' ? payload['action'] : 'POST';

    return this.request<T>(
      this.baseUrl,
      { method: 'POST', action, payload },
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      },
    );
  }

  private async request<T>(
    url: string,
    logContext: { method: string; action: string; payload?: Record<string, unknown> },
    init?: RequestInit
  ): Promise<T> {
    this.debugLogRequest(url, logContext);

    try {
      const response = await fetch(url, init);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${text || response.statusText}`);
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        throw new Error('JSON parse error: La API devolvio una respuesta que no es JSON valido.');
      }

      this.debugLogResponse(logContext.action, parsed);

      if (this.debugApi && this.readSuccess(parsed) === false) {
        console.warn('[API SUCCESS FALSE]', {
          action: logContext.action,
          response: this.sanitizeValue(parsed)
        });
      }

      return parsed as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido al conectar con la API.';
      this.debugLogError(logContext.action, message);
      throw new Error(message);
    }
  }

  private debugLogRequest(
    url: string,
    context: { method: string; action: string; payload?: Record<string, unknown> }
  ): void {
    if (!this.debugApi) return;

    if (this.hasLegacySheetReference(url, context.payload)) {
      console.warn('[API LEGACY SHEET WARNING]', {
        action: context.action,
        url,
        payload: this.sanitizePayload(context.payload ?? {})
      });
    }

    console.log('[API REQUEST]', {
      method: context.method,
      action: context.action,
      url,
      payload: this.sanitizePayload(context.payload ?? {})
    });
  }

  private debugLogResponse(action: string, response: unknown): void {
    if (!this.debugApi) return;

    console.log('[API RESPONSE]', {
      action,
      success: this.readSuccess(response),
      itemCount: this.readItemCount(response),
      response: this.sanitizeValue(response)
    });
  }

  private debugLogError(action: string, message: string): void {
    if (!this.debugApi) return;

    console.error('[API ERROR]', {
      action,
      message
    });
  }

  private sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    return this.sanitizeValue(payload) as Record<string, unknown>;
  }

  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item));
    }

    if (!this.isRecord(value)) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const normalizedKey = key.toLowerCase();

        if (normalizedKey === 'adminpassword' || normalizedKey === 'password') {
          return [key, '***'];
        }

        if (normalizedKey === 'accesskey' && typeof entry === 'string') {
          return [key, this.maskKey(entry)];
        }

        return [key, this.sanitizeValue(entry)];
      })
    );
  }

  private maskKey(value: string): string {
    if (value.length <= 8) return '***';
    return `${value.slice(0, 5)}****${value.slice(-4)}`;
  }

  private readSuccess(response: unknown): boolean | undefined {
    if (!this.isRecord(response) || typeof response['success'] !== 'boolean') return undefined;
    return response['success'];
  }

  private readItemCount(response: unknown): number | undefined {
    if (!this.isRecord(response) || !Array.isArray(response['items'])) return undefined;
    return response['items'].length;
  }

  private hasLegacySheetReference(url: string, payload?: Record<string, unknown>): boolean {
    const serializedPayload = payload ? JSON.stringify(payload) : '';
    const sheetName = ['H', 'o', 'j', 'a'].join('');
    const sheetParam = ['h', 'o', 'j', 'a'].join('');
    const legacySheetPattern = new RegExp(
      `${sheetName}\\s*[1-7]|${sheetName}%20[1-7]|[?&]${sheetParam}=`,
      'i'
    );

    return legacySheetPattern.test(`${url} ${serializedPayload}`);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
