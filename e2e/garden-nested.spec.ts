import { test, expect } from '@playwright/test';

// Runs against a build of the bundled sample vault:
// LOCAL_VAULT_PATH=sample-vault USE_REMOTE_VAULT=false npm run build
test.describe('Nested Vault Notes & Folder Filtering', () => {
  test('Folders appear with trailing "/" in garden, clicking filters to show only folder notes', async ({ page }) => {
    await page.goto('/pt-br/garden');

    // Folder item "guias/" is visible on root garden view
    const folderCard = page.locator('.folder-card[data-folder-item="guias/"]');
    await expect(folderCard).toBeVisible();
    await expect(folderCard).toContainText('[[guias/]]');

    // Note inside the folder is hidden on the root garden view before clicking the folder
    const nestedNoteCard = page.locator('.garden-card:not(.folder-card)', { hasText: 'guias/escrevendo-notas' });
    await expect(nestedNoteCard).toBeHidden();

    // Clicking on "guias/" filters the garden path to show only the note inside that folder
    await folderCard.click();
    await expect(page).toHaveURL(/\/pt-br\/garden\?folder=guias%2F/);
    await expect(nestedNoteCard).toBeVisible();
    await expect(folderCard).toBeHidden();

    // Clicking the nested note opens its page
    await nestedNoteCard.click();
    await expect(page.locator('.note-title')).toContainText('[[pt-br/guias/escrevendo-notas]]');
  });
});
