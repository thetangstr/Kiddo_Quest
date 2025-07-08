const { test, expect } = require('@playwright/test');

test.describe('Basic Smoke Tests', () => {
  test('application loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page has loaded some content
    // Looking for common elements that should be present
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if the page has loaded React content
    const reactRoot = page.locator('#root');
    await expect(reactRoot).toBeVisible();
  });

  test('no critical JavaScript errors', async ({ page }) => {
    const errors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known warnings that are not critical
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('page has expected title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that the page has some title (not just empty)
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});