import { test, expect } from '@playwright/test';

test.describe('Filter Empty State Rendering', () => {
  test('empty state appears when filter matches no items', async ({ page }) => {
    await page.goto('/projects');
    const emptyState = page.locator('.filter-empty-state');
    
    // Check initial state
    const itemsCount = await page.locator('.filterable-item').count();
    
    // Remove all items from DOM to simulate an empty result set
    await page.evaluate(() => {
      document.querySelectorAll('.filterable-item').forEach(e => e.remove());
    });

    // Click 'all' which will trigger the filter logic
    await page.locator('.filter-btn', { hasText: 'All' }).click();
    
    // The empty state should now be visible since there are no items
    await expect(emptyState).toBeVisible();
  });

  test('DOM assertions for visually hidden screen-reader badges', async ({ page }) => {
    await page.goto('/projects');
    const announcer = page.locator('#filter-announcer');
    await expect(announcer).toHaveClass(/sr-only/);
    await expect(announcer).toHaveCSS('position', 'absolute');
    await expect(announcer).toHaveCSS('width', '1px');
  });
});
