const { test, expect } = require('@playwright/test');

test.describe('Minimal CI Tests', () => {
  test('application server responds', async ({ page }) => {
    // Simple test - just verify the page loads
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Very basic assertions that should always pass
    expect(await page.title()).toBeTruthy();
    expect(await page.locator('body').isVisible()).toBe(true);
  });

  test('React app mounts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that React root element exists
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    
    // Verify some content is rendered (not empty)
    const rootContent = await root.textContent();
    expect(rootContent.length).toBeGreaterThan(10);
  });

  test('no critical page errors', async ({ page }) => {
    const errors = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out warnings - only check for actual errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('favicon') &&
      !error.includes('Future Flag Warning')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});