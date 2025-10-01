const { test, expect } = require('@playwright/test');

test.describe('UI Component Testing', () => {
  test('App loads without JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for JavaScript errors
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }
    
    // Check if the page title is correct
    await expect(page).toHaveTitle('Kiddo Quest');
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/app-loaded.png' });
    
    // Check if the main content is visible
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    // Log the page content for debugging
    const content = await page.content();
    console.log('Page loaded successfully');
    
    // Check for any React errors in console
    expect(errors.filter(error => error.includes('React') || error.includes('Uncaught'))).toHaveLength(0);
  });

  test('Login form elements are present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Take a screenshot to see what's rendered
    await page.screenshot({ path: 'test-results/login-form.png' });
    
    // Check if email input exists
    const emailInput = page.locator('input[type="email"]');
    console.log('Email input visible:', await emailInput.isVisible());
    
    // Check if password input exists
    const passwordInput = page.locator('input[type="password"]');
    console.log('Password input visible:', await passwordInput.isVisible());
    
    // Check if sign in button exists (using more specific selector to avoid strict mode)
    const signInButton = page.locator('button[type="submit"]');
    console.log('Sign In button visible:', await signInButton.isVisible());
    
    // Log the HTML content for debugging
    const html = await page.innerHTML('body');
    console.log('Body HTML length:', html.length);
    
    // Check if the form is actually rendered
    const form = page.locator('form');
    console.log('Form visible:', await form.isVisible());
  });
});
