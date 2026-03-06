import { test, expect } from '@playwright/test';

test('main menu renders', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page.getByText('Arithmetic Arena')).toBeVisible();
});
