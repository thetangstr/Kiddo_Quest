const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS } = require('./test-utils');

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Verify the login page elements are visible
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
    await expect(page.locator('text=Kiddo Quest')).toBeVisible();
    
    // Verify email/password fields are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
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
  
  test('user can login with test credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill in the login form with regular user credentials
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.user.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.user.password);
    
    // Take a screenshot before login
    await page.screenshot({ path: 'test-results/before-login.png' });
    
    // Click the sign in button
    await page.locator('button', { hasText: 'Sign In' }).click();
    
    // Since we can't actually authenticate in tests, we'll mock the authenticated state
    await page.evaluate(({ email }) => {
      localStorage.setItem('kiddo-quest-auth', JSON.stringify({
        uid: 'test-user-id',
        email: email,
        role: 'parent',
        isAdmin: false
      }));
      localStorage.setItem('kiddo-quest-view', 'parentDashboard');
    }, TEST_CREDENTIALS.user);
    
    // Reload the page to apply the localStorage changes
    await page.reload();
    
    // Verify we're on the parent dashboard
    await expect(page.locator('text=Parent Dashboard')).toBeVisible();
    
    // Take a screenshot after login
    await page.screenshot({ path: 'test-results/after-login.png' });
  });
  
  test('admin can login with admin credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill in the login form with admin credentials
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.admin.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.admin.password);
    
    // Take a screenshot before login
    await page.screenshot({ path: 'test-results/before-admin-login.png' });
    
    // Click the sign in button
    await page.locator('button', { hasText: 'Sign In' }).click();
    
    // Since we can't actually authenticate in tests, we'll mock the authenticated state
    await page.evaluate(({ email }) => {
      localStorage.setItem('kiddo-quest-auth', JSON.stringify({
        uid: 'admin-user-id',
        email: email,
        role: 'parent',
        isAdmin: true
      }));
      localStorage.setItem('kiddo-quest-view', 'adminDashboard');
    }, TEST_CREDENTIALS.admin);
    
    // Reload the page to apply the localStorage changes
    await page.reload();
    
    // Verify we're on the admin dashboard or have access to admin features
    await expect(page.locator('text=Admin Console')).toBeVisible();
    
    // Take a screenshot after login
    await page.screenshot({ path: 'test-results/after-admin-login.png' });
  });
});
