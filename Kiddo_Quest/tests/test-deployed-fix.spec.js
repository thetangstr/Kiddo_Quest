const { test, expect } = require('@playwright/test');

test.describe('Deployed Site Fix Test', () => {
  test('should load the deployed site without infinite loops', async ({ page }) => {
    const consoleMessages = [];
    
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Navigate to deployed site with shorter timeout
    console.log('Testing fixed deployed site...');
    await page.goto('https://kiddo-quest-de7b0.web.app/', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // Wait for the app to stabilize
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/deployed-site-fixed.png', fullPage: true });

    // Check if content is visible
    const bodyContent = await page.locator('body').textContent();
    console.log('Body content length:', bodyContent?.length || 0);

    // Check for login form or dashboard
    const hasLoginForm = await page.locator('input[type="email"], input[placeholder*="email" i]').count() > 0;
    const hasLoginButton = await page.locator('button:has-text("Login"), button:has-text("Sign in")').count() > 0;
    
    console.log('Has login form:', hasLoginForm);
    console.log('Has login button:', hasLoginButton);

    // Count auth check messages to verify no infinite loop
    const authCheckCount = consoleMessages.filter(msg => msg.includes('Starting auth check')).length;
    console.log('Auth check messages count:', authCheckCount);

    // Verify the page loads properly
    expect(bodyContent?.length).toBeGreaterThan(50);
    expect(authCheckCount).toBeLessThan(5); // Should not have excessive auth checks
    expect(hasLoginForm || hasLoginButton).toBe(true); // Should show login interface

    console.log('✅ Site loads successfully without infinite loops!');
  });
});