import { expect, test } from '@playwright/test';
import { waitForAppReady } from './helpers/app-ready';
import { mockKuronekoApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await mockKuronekoApi(page);
});

test('loads admin login and handles invalid credentials without real secrets', async ({ page }) => {
  await page.goto('/admin');
  await waitForAppReady(page);

  await expect(page.getByRole('heading', { name: '管理パネル' })).toBeVisible();
  await expect(page.getByLabel('言語を選択')).toBeVisible();
  await expect(page.getByRole('heading', { name: '管理者ログイン' })).toBeVisible();

  await page.getByLabel('管理者ID').fill('invalid-admin');
  await page.getByLabel('管理者キー').fill('invalid-password');
  await page.getByRole('button', { name: '管理者として入る' }).click();

  await expect(page.getByRole('alert')).toContainText('管理者IDまたはキーが正しくありません。');
});
