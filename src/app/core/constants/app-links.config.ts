import { environment } from '../../../environments/environment';

export const APP_LINKS = {
  ...environment.links
} as const;
