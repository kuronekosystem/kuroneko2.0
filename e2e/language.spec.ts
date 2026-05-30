import { expect, test } from '@playwright/test';
import { waitForAppReady } from './helpers/app-ready';
import { mockKuronekoApi } from './helpers/mock-api';

test.beforeEach(async ({ page }) => {
  await mockKuronekoApi(page);
});

test('persists selected language across reloads and routes', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await page.getByLabel('言語を選択').selectOption({ label: 'Español' });
  await expect(page.getByText('Visitas')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('kuronekoLanguage')))
    .toBe('es');

  await page.reload();
  await waitForAppReady(page);
  await expect(page.getByText('Visitas')).toBeVisible();

  await page.goto('/admin');
  await waitForAppReady(page);
  const adminLanguageSelector = page.locator('app-language-selector select');
  await expect(adminLanguageSelector.locator('option:checked')).toHaveText('Español');
  await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();

  await adminLanguageSelector.selectOption({ label: 'English' });
  await expect(adminLanguageSelector.locator('option:checked')).toHaveText('English');
  await expect(page.getByRole('heading', { name: 'Admin panel' })).toBeVisible();

  await page.goto('/');
  await waitForAppReady(page);
  await expect(page.getByText('Visits')).toBeVisible();
});
