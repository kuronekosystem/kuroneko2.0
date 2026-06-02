import { expect, test } from '@playwright/test';
import { waitForAppReady } from './helpers/app-ready';
import { mockKuronekoApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await mockKuronekoApi(page);
});

test('loads the public LinkTree with primary actions', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await expect(page.locator('.linktree__title')).toBeVisible();
  await expect(page.getByRole('link', { name: /Pixiv/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /FANBOX/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^X\s/ })).toBeVisible();
  await expect(page.locator('.linktree__button--system')).toBeVisible();
  await expect(page.locator('.linktree__counter')).toBeVisible();
  await expect(page.locator('.linktree__music')).toBeVisible();
});

test('VIP session card opens gallery and sidebar logout clears the session', async ({ page }) => {
  await mockKuronekoApi(page, action => {
    if (action === 'get_exclusive_gallery') {
      return { success: true, items: [] };
    }

    return undefined;
  });
  await page.goto('/');
  await page.evaluate(() => {
    sessionStorage.setItem('kuronekoVipSession', JSON.stringify({
      userCode: 'KNK-5018-DZ24',
      accessKey: 'KURO-TEST-KEY-DZ24',
      displayName: 'Test VIP',
      source: 'fanbox',
      status: 'active',
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    }));
  });
  await page.reload();
  await waitForAppReady(page);

  await expect(page.locator('.vip-session')).toBeVisible();
  await expect(page.locator('.vip-session')).toContainText('KNK-****-DZ24');
  await page.locator('.vip-session').click();
  await expect(page).toHaveURL(/\/gallery$/);

  await page.locator('.sidebar-toggle').click();
  await page.locator('.sidebar__logout').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();

  await expect(page).toHaveURL(/\/$/);
  const storedSession = await page.evaluate(() => sessionStorage.getItem('kuronekoVipSession'));
  expect(storedSession).toBeNull();
  await expect(page.locator('.vip-session')).toHaveCount(0);
});
