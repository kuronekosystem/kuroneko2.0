import { Page, Route } from '@playwright/test';

type ApiPayload = Record<string, unknown>;

const apiPattern = 'https://script.google.com/**';

export async function mockKuronekoApi(page: Page): Promise<void> {
  await page.route(apiPattern, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const payload = await readPayload(route);
    const action = readAction(url, payload);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseFor(action, url, payload))
    });
  });
}

async function readPayload(route: Route): Promise<ApiPayload> {
  if (route.request().method() !== 'POST') return {};

  try {
    const parsed = JSON.parse(route.request().postData() ?? '{}') as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function readAction(url: URL, payload: ApiPayload): string {
  if (typeof payload['action'] === 'string') return payload['action'];
  if (url.searchParams.has('counter')) return `counter:${url.searchParams.get('counter') ?? ''}`;
  if (url.searchParams.has('action')) return url.searchParams.get('action') ?? '';

  return 'unknown';
}

function responseFor(action: string, _url: URL, payload: ApiPayload): ApiPayload {
  switch (action) {
    case 'counter:get':
    case 'counter:increment':
      return { success: true, count: 123 };

    case 'validate_access_key':
      return { success: false, message: 'Invalid user code or access key' };

    case 'request_access':
      return {
        success: true,
        message: 'Access request created',
        requestCode: 'REQ-TEST-000001',
        status: 'pending'
      };

    case 'check_request_status':
      return {
        success: false,
        message: `Request not found: ${String(payload['requestCode'] ?? '')}`
      };

    case 'admin_get_access_requests':
    case 'admin_get_access_keys':
    case 'admin_get_gallery_items':
      return { success: false, message: 'Invalid admin credentials' };

    case 'get_exclusive_gallery':
    case 'get_vip_illustration_requests':
    case 'save_vip_illustration_request':
      return { success: false, message: 'Invalid access' };

    case 'health':
      return {
        success: true,
        message: 'Kuroneko Gallery System API is running',
        version: '2.0'
      };

    default:
      return { success: true };
  }
}

function isRecord(value: unknown): value is ApiPayload {
  return typeof value === 'object' && value !== null;
}
