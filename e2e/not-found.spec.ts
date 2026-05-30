import { expect, test } from '@playwright/test';
import { waitForAppReady } from './helpers/app-ready';
import { mockKuronekoApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await mockKuronekoApi(page);
});

test('shows 404 and navigates with fixed destination buttons', async ({ page }) => {
  await page.goto('/ruta-inexistente');
  await waitForAppReady(page);

  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible();

  await page.getByRole('button', { name: 'LinkTreeへ戻る' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/gallery/no-existe');
  await waitForAppReady(page);
  await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible();

  await page.getByRole('button', { name: 'VIPアクセスセンターへ' }).click();
  await expect(page).toHaveURL(/\/access$/);
});
