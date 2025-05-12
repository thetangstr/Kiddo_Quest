const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, mockAuthentication } = require('./test-utils');

test.describe('PIN Protection System', () => {
  // Test PIN setup in parent dashboard
  test('parent can set up a PIN', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/');
    
    // Fill in the login form with regular user credentials
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.user.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.user.password);
    
    // Click the sign in button
    await page.locator('button', { hasText: 'Sign In' }).click();
    
    // Since we can't actually log in during tests, we'll mock the authenticated state
    // by setting localStorage values that would normally be set after login
    await page.evaluate(({ email }) => {
      // Mock a logged-in user
      localStorage.setItem('kiddo-quest-auth', JSON.stringify({
        uid: 'test-user-id',
        email: email,
        role: 'parent',
        isAdmin: false
      }));
      
      // Set the current view to parent dashboard
      localStorage.setItem('kiddo-quest-view', 'parentDashboard');
    }, TEST_CREDENTIALS.user);
    
    // Reload the page to apply the localStorage changes
    await page.reload();
    
    // Wait for the parent dashboard to load
    await expect(page.locator('text=Parent Dashboard')).toBeVisible();
    
    // Look for the PIN setup button
    const pinSetupButton = page.locator('button', { hasText: /Set Up PIN|Change PIN/ });
    await expect(pinSetupButton).toBeVisible();
    
    // Click the PIN setup button
    await pinSetupButton.click();
    
    // Verify the PIN setup form is displayed
    await expect(page.locator('text=Parent PIN Setup')).toBeVisible();
    
    // Fill in the PIN form
    await page.locator('input[placeholder="Enter 4-digit PIN"]').fill('1234');
    await page.locator('input[placeholder="Confirm PIN"]').fill('1234');
    
    // Submit the form
    await page.locator('button', { hasText: 'Set PIN' }).click();
    
    // Verify success message appears
    await expect(page.locator('text=PIN successfully set')).toBeVisible();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/pin-setup-success.png' });
  });
  
  // Test PIN verification when accessing parent dashboard from child view
  test('PIN verification is required when accessing parent dashboard from child view', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/');
    
    // Fill in the login form with regular user credentials
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.user.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.user.password);
    
    // Click the sign in button
    await page.locator('button', { hasText: 'Sign In' }).click();
    
    // Mock a logged-in user with a child selected
    await page.evaluate(({ email }) => {
      // Mock a logged-in user
      localStorage.setItem('kiddo-quest-auth', JSON.stringify({
        uid: 'test-user-id',
        email: email,
        role: 'parent',
        isAdmin: false
      }));
      
      // Set the current view to child dashboard
      localStorage.setItem('kiddo-quest-view', 'childDashboard');
      
      // Set a selected child ID
      localStorage.setItem('kiddo-quest-selected-child', 'test-child-id');
      
      // Mock that a PIN has been set
      localStorage.setItem('kiddo-quest-has-pin', 'true');
    }, TEST_CREDENTIALS.user);
    
    // Reload the page to apply the localStorage changes
    await page.reload();
    
    // Wait for the child dashboard to load
    await expect(page.locator('text=Child Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Look for the parent access button (lock icon)
    const parentAccessButton = page.locator('button[aria-label="Parent Access"]');
    await expect(parentAccessButton).toBeVisible();
    
    // Click the parent access button
    await parentAccessButton.click();
    
    // Verify the PIN verification modal is displayed
    await expect(page.locator('text=Parent Access Required')).toBeVisible();
    await expect(page.locator('text=Please enter your 4-digit PIN')).toBeVisible();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/pin-verification-modal.png' });
    
    // Enter the PIN
    await page.locator('input[placeholder="Enter 4-digit PIN"]').fill('1234');
    
    // Click the verify button
    await page.locator('button', { hasText: 'Verify PIN' }).click();
    
    // This would normally transition to the parent dashboard, but in our test
    // we can just verify the PIN verification process
  });
});
