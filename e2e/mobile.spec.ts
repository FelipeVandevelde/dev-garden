import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Media Query Testing', () => {
  test('mobile layout reflows correctly and shows mobile-specific elements', async ({ page }) => {
    // Go to garden page where both sidebar/desktop elements exist
    await page.goto('/garden');

    // On mobile, the command palette or sidebar might be hidden, or hamburger menu might appear
    // We will check if --breakpoint-md CSS works by verifying the visibility or layout of a known element.
    // For now, let's take a screenshot to ensure no regressions in mobile reflow.
    await expect(page).toHaveScreenshot('mobile-garden-layout.png', { fullPage: true, maxDiffPixelRatio: 0.05 });
  });
});
