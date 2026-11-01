import { test, expect } from '@playwright/test';

test.describe('Nested Vault Notes & Folder Filtering', () => {
  test('Folders appear with trailing "/" in garden, clicking filters to show only folder notes', async ({ page }) => {
    await page.goto('/pt-br/garden');

    // Folder item "pasta teste/" is visible on root garden view
    const folderCard = page.locator('.folder-card[data-folder-item="pasta teste/"]');
    await expect(folderCard).toBeVisible();
    await expect(folderCard).toContainText('[[pasta teste/]]');

    // Note inside the folder is hidden on the root garden view before clicking the folder
    const nestedNoteCard = page.locator('.garden-card:not(.folder-card)', { hasText: 'pasta teste/nota da pasta' });
    await expect(nestedNoteCard).toBeHidden();

    // Clicking on "pasta teste/" filters the garden path to show only the note inside that folder
    await folderCard.click();
    await expect(page).toHaveURL(/\/pt-br\/garden\?folder=pasta(\+|%20)teste%2F/);
    await expect(nestedNoteCard).toBeVisible();
    await expect(folderCard).toBeHidden();

    // Clicking the nested note opens its page
    await nestedNoteCard.click();
    await expect(page.locator('.note-title')).toContainText('[[pt-br/pasta teste/nota da pasta]]');
  });
});
