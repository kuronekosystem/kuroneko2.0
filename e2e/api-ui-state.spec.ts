import { expect, test } from '@playwright/test';
import { waitForAppReady } from './helpers/app-ready';
import { mockKuronekoApi } from './helpers/mock-api';

const vipSession = {
  userCode: 'KNK-0000-TEST',
  accessKey: 'KURO-TEST-KEY-0001',
  displayName: 'Test VIP User',
  source: 'fanbox',
  status: 'active',
  startDate: '2026-01-01',
  endDate: '2026-12-31'
};

test('access request shows generated request code and clears loading', async ({ page }) => {
  await mockKuronekoApi(page);

  await page.goto('/access/request');
  await waitForAppReady(page);

  await page.locator('#displayName').fill('Test VIP User');
  await page.locator('#fanboxName').fill('test_fanbox_user');
  await page.locator('#proofText').fill('Test proof');
  await page.locator('form.access-form button[type="submit"]').click();

  await expect(page.getByText('REQ-TEST-000001')).toBeVisible();
  await expect(page.locator('app-loading-message')).toHaveCount(0);
  await expect(page.locator('form.access-form button[type="submit"]')).toBeEnabled();
});

test('access status approved response shows VIP credentials and clears loading', async ({ page }) => {
  await mockKuronekoApi(page, action => {
    if (action !== 'check_request_status') return undefined;

    return {
      success: true,
      requestCode: 'REQ-APPROVED-000001',
      displayName: 'Test VIP User',
      source: 'fanbox',
      status: 'approved',
      adminNotes: '',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      userCode: vipSession.userCode,
      accessKey: vipSession.accessKey,
      accessStatus: 'active',
      startDate: vipSession.startDate,
      endDate: vipSession.endDate
    };
  });

  await page.goto('/access/status');
  await waitForAppReady(page);

  await page.locator('#requestCode').fill('REQ-APPROVED-000001');
  await page.locator('form.access-form button[type="submit"]').click();

  await expect(page.getByText(vipSession.userCode)).toBeVisible();
  await expect(page.getByText(vipSession.accessKey)).toBeVisible();
  await expect(page.locator('app-loading-message')).toHaveCount(0);
});

test('access login saves VIP session and navigates to gallery', async ({ page }) => {
  await mockKuronekoApi(page, action => {
    if (action === 'validate_access_key') {
      return {
        success: true,
        message: 'Access granted',
        userCode: vipSession.userCode,
        displayName: vipSession.displayName,
        source: vipSession.source,
        status: vipSession.status,
        startDate: vipSession.startDate,
        endDate: vipSession.endDate
      };
    }

    if (action === 'get_exclusive_gallery') {
      return { success: true, items: [] };
    }

    return undefined;
  });

  await page.goto('/access/login');
  await waitForAppReady(page);

  await page.locator('#userCode').fill(vipSession.userCode);
  await page.locator('#accessKey').fill(vipSession.accessKey);
  await page.locator('form.access-form button[type="submit"]').click();

  await expect(page).toHaveURL(/\/gallery$/);
  const storedSession = await page.evaluate(() => sessionStorage.getItem('kuronekoVipSession'));
  expect(storedSession).toContain(vipSession.userCode);
  await expect(page.locator('.gallery__loader')).toHaveCount(0);
});

test('gallery with valid empty response shows empty state instead of infinite loading', async ({ page }) => {
  await mockKuronekoApi(page, action => {
    if (action === 'get_exclusive_gallery') {
      return { success: true, items: [] };
    }

    return undefined;
  });
  await page.addInitScript(session => {
    sessionStorage.setItem('kuronekoVipSession', JSON.stringify(session));
  }, vipSession);

  await page.goto('/gallery');
  await waitForAppReady(page);

  await expect(page).toHaveURL(/\/gallery$/);
  await expect(page.locator('.gallery__loader')).toHaveCount(0);
  await expect(page.locator('.gallery__empty')).toBeVisible();
});

test('slideshow zoom controls adjust gradually and reset cleanly', async ({ page }) => {
  const imageUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  await mockKuronekoApi(page, action => {
    if (action === 'get_exclusive_gallery') {
      return {
        success: true,
        items: [{
          id: 'zoom-test-1',
          title: 'Zoom test image',
          description: 'Test image for zoom controls',
          thumbnail: imageUrl,
          fullSize: imageUrl,
          category: 'Test',
          status: 'active',
          createdAt: '2026-01-01'
        }]
      };
    }

    return undefined;
  });
  await page.addInitScript(session => {
    sessionStorage.setItem('kuronekoVipSession', JSON.stringify(session));
  }, vipSession);

  await page.goto('/gallery');
  await waitForAppReady(page);

  await page.locator('.gallery__item').first().click();
  await expect(page.locator('.slideshow')).toBeVisible();
  await expect(page.locator('.slideshow__zoom-indicator strong')).toHaveText('100%');

  await page.locator('.slideshow__zoom-btn').last().click();
  await expect(page.locator('.slideshow__zoom-indicator strong')).toHaveText('125%');
  await expect(page.locator('.slideshow__image')).toHaveCSS('transform', /matrix\(1\.25/);

  await page.locator('.slideshow__zoom-reset').click();
  await expect(page.locator('.slideshow__zoom-indicator strong')).toHaveText('100%');
  await expect(page.locator('.slideshow__image')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
});

test('vip board loads, sends suggestion, and clears loading states', async ({ page }) => {
  let saved = false;
  await mockKuronekoApi(page, action => {
    if (action === 'get_vip_illustration_requests') {
      return {
        success: true,
        items: saved
          ? [{
              id: 1,
              userCode: vipSession.userCode,
              displayName: vipSession.displayName,
              title: 'Test idea',
              message: 'A neon city illustration',
              status: 'pending',
              adminReply: '',
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01'
            }]
          : []
      };
    }

    if (action === 'save_vip_illustration_request') {
      saved = true;
      return { success: true, message: 'VIP illustration request saved' };
    }

    return undefined;
  });
  await page.addInitScript(session => {
    sessionStorage.setItem('kuronekoVipSession', JSON.stringify(session));
  }, vipSession);

  await page.goto('/vip-board');
  await waitForAppReady(page);
  await expect(page.locator('app-loading-message')).toHaveCount(0);

  await page.locator('input[name="title"]').fill('Test idea');
  await page.locator('textarea[name="message"]').fill('A neon city illustration');
  await page.locator('.vip-board__submit').click();

  await expect(page.getByText('A neon city illustration')).toBeVisible();
  await expect(page.locator('app-loading-message')).toHaveCount(0);
  await expect(page.locator('.vip-board__submit')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.vip-board__submit')).toBeDisabled();
});

test('admin approve action releases row loading and shows issued credentials', async ({ page }) => {
  let approved = false;
  await mockKuronekoApi(page, action => {
    if (action === 'admin_get_access_requests') {
      return {
        success: true,
        items: [{
          id: 1,
          requestCode: 'REQ-ADMIN-1',
          displayName: 'Admin Test User',
          source: 'fanbox',
          fanboxName: 'fanbox_user',
          paypalTransactionId: '',
          contact: '@test',
          proofText: 'proof',
          status: approved ? 'approved' : 'pending',
          adminNotes: '',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01'
        }]
      };
    }

    if (action === 'admin_get_access_keys') {
      return { success: true, items: [] };
    }

    if (action === 'admin_get_gallery_items') {
      return { success: true, items: [] };
    }

    if (action === 'admin_get_vip_illustration_requests') {
      return { success: true, items: [] };
    }

    if (action === 'approve_access_request') {
      approved = true;
      return {
        success: true,
        message: 'Access request approved',
        requestCode: 'REQ-ADMIN-1',
        userCode: vipSession.userCode,
        accessKey: vipSession.accessKey,
        startDate: vipSession.startDate,
        endDate: vipSession.endDate
      };
    }

    return undefined;
  });

  await page.goto('/admin');
  await waitForAppReady(page);

  await page.locator('#adminUsername').fill('test-admin');
  await page.locator('#adminPassword').fill('test-password');
  await page.locator('form.admin-login button[type="submit"]').click();

  await expect(page.locator('.admin-tab')).toHaveCount(4);

  const requestCard = page.locator('.admin-request').filter({ hasText: 'REQ-ADMIN-1' });
  await expect(requestCard).toBeVisible();
  await requestCard.locator('.admin-actions button').first().click();

  await expect(page.getByText(vipSession.userCode)).toBeVisible();
  await expect(page.getByText(vipSession.accessKey)).toBeVisible();
  await expect(requestCard.locator('button[aria-busy="true"]')).toHaveCount(0);
});
