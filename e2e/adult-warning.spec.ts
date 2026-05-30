import { expect, test } from '@playwright/test';
import { waitForAppReady } from './helpers/app-ready';
import { mockKuronekoApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await mockKuronekoApi(page);
});

test('shows the adult warning before entering the VIP access center', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await page.getByRole('button', { name: /クロネコエンジンへ/ }).click();

  const dialog = page.getByRole('dialog', { name: /年齢確認/ });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: '戻る' }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: /クロネコエンジンへ/ }).click();
  await dialog.getByRole('button', { name: '同意して進む' }).click();
  await expect(page).toHaveURL(/\/access$/);

  await page.goto('/');
  await waitForAppReady(page);
  await page.getByRole('button', { name: /クロネコエンジンへ/ }).click();
  await expect(page).toHaveURL(/\/access$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
