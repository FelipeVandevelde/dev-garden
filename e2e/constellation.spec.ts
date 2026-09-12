import { test, expect } from '@playwright/test';

test.describe('Sequential Graph Interaction Testing', () => {
  test('clicking multiple nodes sequentially updates the visual state properly', async ({ page }) => {
    await page.goto('/');

    const nodes = page.locator('.constellation-node');
    await expect(nodes).not.toHaveCount(0);

    const firstNode = nodes.nth(0);
    const secondNode = nodes.nth(1);

    // Click first node
    await firstNode.click();
    await expect(firstNode).toHaveClass(/selected/);
    await expect(firstNode).toHaveAttribute('aria-pressed', 'true');

    // Click second node
    await secondNode.click();
    await expect(secondNode).toHaveClass(/selected/);
    await expect(secondNode).toHaveAttribute('aria-pressed', 'true');

    // First node should no longer be selected
    await expect(firstNode).not.toHaveClass(/selected/);
    await expect(firstNode).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking same node twice resets the graph', async ({ page }) => {
    await page.goto('/');

    const firstNode = page.locator('.constellation-node').nth(0);
    
    // Select
    await firstNode.click();
    await expect(firstNode).toHaveClass(/selected/);

    // Deselect
    await firstNode.click();
    await expect(firstNode).not.toHaveClass(/selected/);
  });
});
