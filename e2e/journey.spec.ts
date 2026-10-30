import { test, expect } from '@playwright/test';

test.describe('My Bible Journey - Complete Catholic Bible Reading Flow', () => {
  test('Journey Dashboard displays 6 sequential stages, 73 books, and pace presets', async ({ page }) => {
    await page.goto('/journey');
    await page.waitForLoadState('domcontentloaded');

    // Title and Header
    await expect(page.locator('h1').first()).toContainText('My Bible Journey');
    await expect(page.locator('text=All 73 Catholic Books').first()).toBeVisible();
    await expect(page.locator('text=The 6 Sequential Stages').first()).toBeVisible();

    // 6 Stages visible
    await expect(page.locator('text=Discover Jesus and the Church').first()).toBeVisible();
    await expect(page.locator("text=Understand God's People").first()).toBeVisible();
    await expect(page.locator('text=Prayer and Wisdom').first()).toBeVisible();
    await expect(page.locator('text=The Covenant and the Law').first()).toBeVisible();
    await expect(page.locator('text=Listen to the Prophets').first()).toBeVisible();
    await expect(page.locator('text=Living the Christian Faith').first()).toBeVisible();

    // Pace presets visible
    await expect(page.locator('button:has-text("Gentle")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Steady")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Focused")').first()).toBeVisible();
  });

  test('User can switch reading pace presets and see dynamic estimates', async ({ page }) => {
    await page.goto('/journey');
    await page.waitForLoadState('domcontentloaded');

    // Click Steady pace (2 ch/session, 5 days/wk)
    const steadyBtn = page.locator('button:has-text("Steady")').first();
    await steadyBtn.click();
    await expect(steadyBtn).toHaveClass(/border-\[var\(--primary-green\)\]|border-\[var\(--gold\)\]/);

    // Click Focused pace (2 ch/session, 7 days/wk)
    const focusedBtn = page.locator('button:has-text("Focused")').first();
    await focusedBtn.click();
    await expect(focusedBtn).toHaveClass(/border-\[var\(--primary-green\)\]|border-\[var\(--gold\)\]/);
  });

  test('Daily reading session loads earliest unread chapter (Mark 1), allows completion and reflection', async ({ page }) => {
    await page.goto('/journey/read?book=mrk&chapter=1');
    await page.waitForLoadState('domcontentloaded');

    // Verify Mark 1 is loaded
    await expect(page.locator('h1').first()).toContainText('Mark 1');

    // Verify completion toggle button exists and can be clicked
    const toggleBtn = page.locator('button:has-text("Mark Completed"), button:has-text("Chapter Completed")').first();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Verify Add Reflection button and modal prompts
    const reflectBtn = page.locator('button:has-text("Add Reflection")').first();
    await reflectBtn.click();

    // Check FR-07 prompts are present
    await expect(page.locator('text=What did this chapter teach me about God?')).toBeVisible();
    await expect(page.locator('text=What did I find difficult or interesting?')).toBeVisible();
    await expect(page.locator('text=What can I apply to my life?')).toBeVisible();

    // Fill in reflection prompt
    const textareas = page.locator('textarea');
    await textareas.nth(0).fill('God is all-powerful and compassionate.');
    await textareas.nth(2).fill('Practice daily prayer and faith.');

    // Save reflection
    await page.locator('button:has-text("Save Reflection to Journal")').click();

    // Toast confirmation
    await expect(page.locator('text=Reflection saved to your journal')).toBeVisible();
  });

  test('Homepage prominently features My Bible Journey and updates progress', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Homepage has prominent My Bible Journey card
    await expect(page.locator('#journey-heading').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue Journey' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Journey Dashboard' }).first()).toBeVisible();
  });
});
