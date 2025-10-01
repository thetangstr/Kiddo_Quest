const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Verify the login page elements are visible
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
    await expect(page.locator('text=Kiddo Quest')).toBeVisible();
  });

  test('login page has Google sign-in button', async ({ page }) => {
    // This test verifies that the login page has Google sign-in functionality
    // which is part of our authentication flow with allowlist validation
    
    await page.goto('/');
    
    // Check that we're showing the login screen with Google sign-in button
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
    
    // Verify that the app has authentication elements
    const content = await page.evaluate(() => {
      return document.documentElement.outerHTML;
    });
    
    // Check for elements that definitely exist on the login page
    expect(content).toContain('Sign in');
  });
});
