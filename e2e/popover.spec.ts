import { test, expect } from '@playwright/test';

test.describe('Popover Debounce & Hide Animation Cancellation', () => {
  test('rapid re-hovering over target cancels hide animation', async ({ page }) => {
    // Inject a wikilink manually since we can't guarantee content
    await page.goto('/');

    await page.evaluate(() => {
      const link = document.createElement('a');
      link.className = 'wikilink';
      link.href = '#';
      link.textContent = 'Test Wikilink';
      link.setAttribute('data-preview-title', 'Test Title');
      link.setAttribute('data-preview-excerpt', 'Test Excerpt');
      
      const container = document.querySelector('main') || document.body;
      container.insertBefore(link, container.firstChild);
    });

    const link = page.locator('a.wikilink', { hasText: 'Test Wikilink' });
    const popover = page.locator('#hover-popover');
    
    // Hover to show
    await link.hover();
    // Wait for the showPopover timeout (200ms)
    await page.waitForTimeout(250);
    
    await expect(popover).toBeVisible();
    await expect(popover).toHaveCSS('opacity', '1');

    // Move away to start hide (150ms timeout)
    await page.mouse.move(0, 0);
    
    // Rapidly hover back before the 150ms delay completes
    await page.waitForTimeout(50);
    await link.hover();

    // Wait past the original hide timers
    await page.waitForTimeout(400);

    // Assert the popover is still visible because the hide was cancelled
    await expect(popover).toBeVisible();
    await expect(popover).toHaveCSS('opacity', '1');
  });
  
  test('Z-Index Layering Verification', async ({ page }) => {
    await page.goto('/graph');
    
    // In graph page, inject a popover trigger on top of canvas to check layering
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.className = 'wikilink';
      link.href = '#';
      link.textContent = 'Hover me on canvas';
      link.setAttribute('data-preview-title', 'Layer Title');
      link.style.position = 'absolute';
      link.style.top = '50%';
      link.style.left = '50%';
      link.style.zIndex = '1000'; // Just to be clickable
      document.body.appendChild(link);
    });

    const link = page.locator('a.wikilink', { hasText: 'Hover me on canvas' });
    await link.hover();
    
    // Wait for popover
    await page.waitForTimeout(250);
    const popover = page.locator('#hover-popover');
    await expect(popover).toBeVisible();

    // Check z-index
    // Force-graph canvas has z-index 1 usually (or var(--z-base))
    // We expect popover to be higher
    // Take a screenshot
    await expect(page).toHaveScreenshot('z-index-layering.png', { maxDiffPixelRatio: 0.05 });
  });
});
