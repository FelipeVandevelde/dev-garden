import { test, expect } from '@playwright/test';

test.describe('Badges and Curator Notes', () => {
  test('Garden cards have badges with aria-hidden icons', async ({ page }) => {
    await page.goto('/garden');
    
    const badges = page.locator('.badge');
    await expect(badges.first()).toBeVisible();
    
    // Verify at least the first badge has the aria-hidden span
    const ariaHiddenSpan = badges.first().locator('span[aria-hidden="true"]');
    await expect(ariaHiddenSpan).toBeAttached();
  });

  test('Curator notes render on project cards', async ({ page }) => {
    await page.goto('/projects');
    
    const curatorNotes = page.locator('.curator-notes');
    await expect(curatorNotes.first()).toBeVisible();
    
    // Check one of them has at least one note item inside it
    const firstNoteGroup = curatorNotes.first();
    await expect(firstNoteGroup.locator('.curator-note').first()).toBeVisible();
  });
});
