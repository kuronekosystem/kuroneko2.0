import { expect, test } from '@playwright/test';
import { waitForAppReady } from './helpers/app-ready';
import { mockKuronekoApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await mockKuronekoApi(page);
});

test('loads the public LinkTree with primary actions', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await expect(page.getByRole('heading', { name: 'クロネコエンジン 2.0' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Pixiv/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /FANBOX/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^X\s/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /クロネコエンジンへ/ })).toBeVisible();
  await expect(page.getByLabel('アクセス数')).toBeVisible();
  await expect(page.getByText('クロネコ BGM')).toBeVisible();
});
