import { expect, test } from '@playwright/test';
import { waitForAppReady } from './helpers/app-ready';
import { mockKuronekoApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await mockKuronekoApi(page);
});

test('loads VIP access pages and protects private routes without a VIP session', async ({ page }) => {
  await page.goto('/access');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: 'クロネコエンジン' })).toBeVisible();

  await page.goto('/access/login');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: 'IDとキーで入場する' })).toBeVisible();

  await page.goto('/access/request');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: 'VIPアクセス申請' })).toBeVisible();

  await page.goto('/access/status');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: '申請状況を確認する' })).toBeVisible();

  await page.goto('/gallery');
  await waitForAppReady(page);
  await expect(page).toHaveURL(/\/access\/login$/);

  await page.goto('/vip-board');
  await waitForAppReady(page);
  await expect(page).toHaveURL(/\/access\/login$/);
});
