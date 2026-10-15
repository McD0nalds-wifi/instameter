import { expect, test } from '@playwright/test';

test('приложение открывается без сети после первой загрузки', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/catalog');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
