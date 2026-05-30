import { environment } from '../../../environments/environment';

export const KURONEKO_API_CONFIG = {
  baseUrl: environment.api.baseUrl
} as const;
