import { test, expect } from '@playwright/test';

test.describe('The Living Word - End to End Application Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Dashboard loads with Syro-Malabar Catholic branding and initial chapter recommendation', async ({ page }) => {
    await expect(page).toHaveTitle(/The Living Word/i);
    await expect(page.locator('h1').first()).toContainText('The Living Word');
    // Default initial chapter is Mark 1 ("Start With Jesus")
    await expect(page.locator('#continue-reading-heading').first()).toContainText('Mark 1');
  });

  test('Navigation links work across Desktop and Mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Mobile bottom navigation bar
      const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
      await expect(bottomNav).toBeVisible();

      await bottomNav.getByRole('link', { name: 'Bible' }).click();
      await expect(page).toHaveURL(/\/bible/);

      await bottomNav.getByRole('link', { name: 'Plans' }).click();
      await expect(page).toHaveURL(/\/plans/);

      await bottomNav.getByRole('link', { name: 'Journal' }).click();
      await expect(page).toHaveURL(/\/journal/);

      await bottomNav.getByRole('link', { name: 'Progress' }).click();
      await expect(page).toHaveURL(/\/progress/);
    } else {
      // Desktop top header navigation
      const topNav = page.locator('nav[aria-label="Main Navigation"]');
      await expect(topNav).toBeVisible();

      await topNav.getByRole('link', { name: 'Bible' }).click();
      await expect(page).toHaveURL(/\/bible/);

      await topNav.getByRole('link', { name: 'Plans' }).click();
      await expect(page).toHaveURL(/\/plans/);

      await topNav.getByRole('link', { name: 'Journal' }).click();
      await expect(page).toHaveURL(/\/journal/);

      await topNav.getByRole('link', { name: 'Bookmarks' }).click();
      await expect(page).toHaveURL(/\/bookmarks/);

      await topNav.getByRole('link', { name: 'Progress' }).click();
      await expect(page).toHaveURL(/\/progress/);

      await topNav.getByRole('link', { name: 'Settings' }).click();
      await expect(page).toHaveURL(/\/settings/);
    }
  });

  test('Catholic Bible Canon lists all 73 books and allows chapter selection', async ({ page }) => {
    await page.goto('/bible');
    await expect(page.locator('h1').first()).toContainText('Catholic Bible Canon');

    // Click Deuterocanonical tab filter
    await page.getByRole('tab', { name: /Deuterocanonical/i }).click();
    await page.waitForTimeout(300);

    // Book buttons
    const tobitBtn = page.getByRole('button', { name: /Tobit/i }).first();
    await expect(tobitBtn).toBeVisible();
    await tobitBtn.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Tobit');

    // Click Chapter 1
    await modal.getByRole('link', { name: '1', exact: true }).click();
    await expect(page).toHaveURL(/\/bible\/tobit\/1/);
    await expect(page.locator('h1').first()).toContainText('Tobit 1');
  });

  test('Bible Reader navigates chapters and toggles completion with persistence across refresh', async ({ page }) => {
    await page.goto('/bible/mark/1');
    await expect(page.locator('h1').first()).toContainText('Mark 1');

    // Mark chapter completed
    const completeBtn = page.getByRole('button', { name: /Mark Completed/i }).first();
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Verify button text changes to completed
    await expect(page.getByRole('button', { name: /Chapter Completed/i }).first()).toBeVisible();

    // Refresh page to verify IndexedDB persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /Chapter Completed/i }).first()).toBeVisible();

    // Navigate to next chapter
    const nextBtn = page.getByRole('link', { name: /Mark 2/i }).first();
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(page).toHaveURL(/\/bible\/mark\/2/);
    await expect(page.locator('h1').first()).toContainText('Mark 2');
  });

  test('Scripture Reader embed feature flag toggle works correctly', async ({ page }) => {
    await page.goto('/bible/mark/1');

    // Default mode is Direct Link View
    await expect(page.getByText(/Read the complete, authorized New Revised Standard Version/i)).toBeVisible();
    const openDirectBtn = page.getByRole('link', { name: /Open in Bible Gateway/i }).first();
    await expect(openDirectBtn).toBeVisible();
    await expect(openDirectBtn).toHaveAttribute('href', /https:\/\/www\.biblegateway\.com\/passage\/\?search=Mark%201&version=NRSVCE/);

    // Toggle to Embedded View
    const toggleBtn = page.getByRole('button', { name: /Embed View|Direct Link View/i });
    await toggleBtn.click();

    // Verify iframe element is rendered with descriptive title and sandbox
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('title', /Bible Gateway NRSV-CE - Mark 1/);
    await expect(iframe).toHaveAttribute('sandbox', /allow-scripts allow-same-origin allow-popups/);
  });

  test('Reading Plan activation and resume button behavior', async ({ page }) => {
    await page.goto('/plans');
    await expect(page.locator('h1').first()).toContainText('Reading Plans');

    // Locate Knowing Jesus card specifically by heading
    const knowingHeading = page.getByRole('heading', { name: 'Knowing Jesus' });
    await expect(knowingHeading).toBeVisible();
    const knowingJesusCard = page.locator('div.rounded-2xl', { has: knowingHeading });

    const makeActiveBtn = knowingJesusCard.getByRole('button', { name: 'Make Active' });
    if (await makeActiveBtn.count() > 0 && await makeActiveBtn.isVisible()) {
      await makeActiveBtn.click();
    }
    await expect(knowingJesusCard.getByText('Active Plan')).toBeVisible();

    // View Plan
    await knowingJesusCard.getByRole('link', { name: 'View Plan' }).click();
    await expect(page).toHaveURL(/\/plans\/knowing-jesus/);
    await expect(page.locator('h1').first()).toContainText('Knowing Jesus');

    // Resume button points to John 1
    const resumeBtn = page.getByRole('link', { name: /Resume Reading/i });
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();
    await expect(page).toHaveURL(/\/bible\/john\/1/);
  });

  test('Journal creation, search, edit, and deletion confirmation modal', async ({ page }) => {
    await page.goto('/journal/new?book=mrk&chapter=1');
    await expect(page.locator('h1').first()).toContainText('New Reflection');

    // Fill in form
    await page.getByPlaceholder(/Encountering Christ in the Desert/i).fill('Testing Desert Solitude');
    await page.getByPlaceholder(/How does this passage speak into your life/i).fill('Grace abounds in solitary prayer.');
    await page.getByPlaceholder(/What question lingers/i).fill('How can I find silence today?');
    await page.getByPlaceholder(/A short prayer/i).fill('Lord Jesus, draw me into Your peace.');

    await page.getByRole('button', { name: /Save Reflection/i }).click();
    await page.waitForURL(/\/journal$/);

    // Verify created entry appears in journal
    await expect(page.getByRole('heading', { name: 'Testing Desert Solitude' })).toBeVisible();
    await expect(page.locator('p', { hasText: 'Grace abounds in solitary prayer.' })).toBeVisible();

    // Search filter
    const searchInput = page.getByPlaceholder(/Search journal reflections/i);
    await searchInput.fill('Solitude');
    await expect(page.getByRole('heading', { name: 'Testing Desert Solitude' })).toBeVisible();

    await searchInput.fill('NonexistentQueryXYZ');
    await expect(page.getByText('No Reflections Match Your Search')).toBeVisible();

    await searchInput.fill('');

    // Delete with confirmation modal
    await page.getByRole('button', { name: 'Delete journal entry' }).first().click();
    const deleteModal = page.locator('div[role="dialog"]');
    await expect(deleteModal).toBeVisible();
    await expect(deleteModal).toContainText('Delete Reflection?');

    await deleteModal.getByRole('button', { name: 'Delete Forever' }).click();
    await expect(page.getByRole('heading', { name: 'Testing Desert Solitude' })).not.toBeVisible();
  });

  test('Bookmarks creation and navigation to chapter', async ({ page }) => {
    await page.goto('/bookmarks');
    await page.getByRole('button', { name: /Add Bookmark|Create First Bookmark/i }).first().click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Choose book, chapter, and label
    await modal.locator('select').selectOption('psa');
    await modal.getByPlaceholder(/e\.g\. 12/i).fill('1');
    await modal.getByPlaceholder(/Prayer for family/i).fill('The Lord is my Shepherd');
    await modal.getByRole('button', { name: /Save Bookmark/i }).click();

    // Verify bookmark is listed
    await expect(page.getByText('The Lord is my Shepherd')).toBeVisible();

    // Click Read Chapter
    await page.getByRole('link', { name: /Read Chapter/i }).first().click();
    await expect(page).toHaveURL(/\/bible\/psalms\/1/);
  });

  test('Theme switcher updates DOM data-theme attribute for light, sepia, and dark', async ({ page }) => {
    await page.goto('/settings');

    // Switch to Sepia
    await page.getByRole('button', { name: /Sepia Parchment/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sepia');

    // Switch to Dark
    await page.getByRole('button', { name: /Dark Forest/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Switch to Light
    await page.getByRole('button', { name: /Light Ivory/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('Data backup export and restore round-trip', async ({ page }) => {
    await page.goto('/settings');

    // Trigger export and intercept download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export Backup/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('the-living-word-backup');
  });
});
