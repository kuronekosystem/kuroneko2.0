import { Injectable } from '@angular/core';
import { KURONEKO_API_CONFIG } from '../constants/api.config';

@Injectable({
  providedIn: 'root'
})
export class KuronekoApiService {
  private readonly baseUrl = KURONEKO_API_CONFIG.baseUrl;

  async get<T>(params: Record<string, string>): Promise<T> {
    const query = new URLSearchParams(params);
    const url = `${this.baseUrl}?${query.toString()}`;

    return this.request<T>(url);
  }

  async post<T>(payload: Record<string, unknown>): Promise<T> {
    return this.request<T>(
      this.baseUrl,
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
    init?: RequestInit
  ): Promise<T> {
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

      return parsed as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido al conectar con la API.';
      throw new Error(message);
    }
  }
}
