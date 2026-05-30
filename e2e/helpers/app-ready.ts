import { expect, Page } from '@playwright/test';

export async function waitForAppReady(page: Page): Promise<void> {
  await expect(page.locator('.kuro-loader')).toBeHidden({ timeout: 15_000 });
}
