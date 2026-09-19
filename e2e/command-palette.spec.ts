import { test, expect } from '@playwright/test';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and opens via keyboard shortcut', async ({ page }) => {
    const dialog = page.locator('#command-palette');
    await expect(dialog).toBeHidden();

    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);

    await expect(dialog).toBeVisible();
  });

  test('can be dismissed by clicking the backdrop', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);
    const dialog = page.locator('#command-palette');
    await expect(dialog).toBeVisible();

    // Click outside the dialog to dismiss it.
    await page.mouse.click(1, 1);
    await expect(dialog).toBeHidden();
  });

  test('shows async loading state while searching', async ({ page }) => {
    // Intercept pagefind to delay its load, ensuring the loading state is visible
    await page.route('**/pagefind.js', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);
    
    const input = page.locator('#palette-input');
    await input.fill('something');

    // It should show a searching text
    const searchingItem = page.locator('.palette-item[aria-disabled="true"]');
    await expect(searchingItem).toBeVisible();
  });
});
