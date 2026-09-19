import { test, expect } from '@playwright/test';

test.describe('GitHub Stream and Localization', () => {
  test('GitHub activity stream renders', async ({ page }) => {
    await page.goto('/');
    
    // The component might take a moment to fetch or load mock data
    const activityItems = page.locator('.activity-item');
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });
  });

  test.use({ locale: 'en-US' });

  test('Portuguese localization toggle navigates correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find the PT link in the header
    const ptLink = page.locator('header.terminal-nav a', { hasText: /^PT$/ });
    await expect(ptLink).toBeVisible();
    await ptLink.click();
    
    // The URL should update to include /pt-br
    await expect(page).toHaveURL(/.*\/pt-br\/?/);
    
    // Verify the nav links are translated, e.g. "PROJETOS"
    const navLinks = page.locator('nav.nav-links a');
    await expect(navLinks.filter({ hasText: 'PROJETOS' })).toBeVisible();
  });
});
