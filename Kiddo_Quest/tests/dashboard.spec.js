const { test, expect } = require('@playwright/test');

test.describe('Dashboard and App Structure', () => {
  // We'll test basic app structure without relying on authentication or localStorage
  
  test('app has proper title and structure', async ({ page }) => {
    await page.goto('/');
    
    // Check that the app has loaded with the proper title
    await expect(page.locator('text=Kiddo Quest')).toBeVisible();
    
    // Verify basic structure elements that should be present regardless of auth state
    const signInButton = await page.locator('text=Sign in').count() > 0;
    expect(signInButton).toBeTruthy();
  });

  test('feedback button is properly positioned', async ({ page }) => {
    await page.goto('/');
    
    // Check that the feedback button is positioned at the bottom right
    const feedbackButton = page.locator('button', { hasText: 'Feedback' });
    await expect(feedbackButton).toBeVisible();
    
    // Check that it has the correct positioning classes
    const classes = await feedbackButton.getAttribute('class');
    expect(classes).toContain('fixed');
    expect(classes).toContain('bottom-');
    expect(classes).toContain('right-');
  });

  test('app has responsive design', async ({ page }) => {
    // Test at mobile viewport size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Verify the app renders at mobile size
    await expect(page.locator('text=Kiddo Quest')).toBeVisible();
    
    // Test at desktop viewport size
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    
    // Verify the app renders at desktop size
    await expect(page.locator('text=Kiddo Quest')).toBeVisible();
  });
});
