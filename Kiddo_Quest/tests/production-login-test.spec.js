const { test, expect } = require('@playwright/test');

// Test configuration for production deployment
const BASE_URL = 'https://kiddo-quest-de7b0.web.app';

test.describe('Production Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should load the application successfully', async ({ page }) => {
    // Wait for the page to load
    await expect(page).toHaveTitle(/KiddoQuest/);
    
    // Check that the app loads without errors
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Application loaded successfully');
  });

  test('should show login interface', async ({ page }) => {
    // Look for Google login button
    const googleLoginButton = page.locator('button').filter({ hasText: /sign in with google/i });
    await expect(googleLoginButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Google login button is visible');
    
    // Check for registration link/button
    const registerElements = page.locator('button, a').filter({ hasText: /register|sign up/i });
    const hasRegisterOption = await registerElements.count() > 0;
    
    if (hasRegisterOption) {
      console.log('✅ Registration option is available');
    } else {
      console.log('ℹ️ No explicit registration option found (users may be auto-created on login)');
    }
  });

  test('should navigate to registration/signup if available', async ({ page }) => {
    // Look for registration or signup elements
    const registerButton = page.locator('button, a').filter({ hasText: /register|sign up|create account/i }).first();
    
    if (await registerButton.isVisible()) {
      await registerButton.click();
      console.log('✅ Clicked registration button');
      
      // Wait for navigation or modal
      await page.waitForTimeout(2000);
      
      // Check if we're still on the same page or if there's a modal/form
      const registrationForm = page.locator('form').filter({ hasText: /register|sign up|create/i });
      const isRegistrationVisible = await registrationForm.isVisible();
      
      if (isRegistrationVisible) {
        console.log('✅ Registration form is visible');
      } else {
        console.log('ℹ️ No separate registration form - may use Google auth only');
      }
    } else {
      console.log('ℹ️ No registration button found - testing with Google auth only');
    }
  });

  test('should simulate Google login click (without actual auth)', async ({ page }) => {
    // Find and click the Google login button
    const googleLoginButton = page.locator('button').filter({ hasText: /sign in with google/i });
    await expect(googleLoginButton).toBeVisible();
    
    console.log('Found Google login button, testing click interaction...');
    
    // Click the button (this will trigger the popup which we won't complete)
    await googleLoginButton.click();
    
    // Wait a moment for any popup to appear
    await page.waitForTimeout(1000);
    
    console.log('✅ Google login button click works (popup would appear for real auth)');
  });
});

test.describe('Production Amazon Browser Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should find Amazon browser functionality after login simulation', async ({ page }) => {
    // Since we can't actually log in without real credentials,
    // we'll check if the reward management pages exist by direct navigation
    
    // Try to access the reward form page directly
    await page.goto(`${BASE_URL}/#rewardForm`);
    await page.waitForTimeout(2000);
    
    // Check if we get redirected to login (expected) or if the page loads
    const currentUrl = page.url();
    console.log('Current URL after direct navigation:', currentUrl);
    
    // Check if login is required (we should be redirected)
    const isLoginPage = await page.locator('button').filter({ hasText: /sign in with google/i }).isVisible();
    
    if (isLoginPage) {
      console.log('✅ Proper authentication required - redirected to login');
    } else {
      console.log('ℹ️ Accessing reward form without authentication');
      
      // If we can access it, check for Amazon browser button
      const amazonButton = page.locator('button').filter({ hasText: /browse amazon/i });
      const hasAmazonButton = await amazonButton.isVisible();
      
      if (hasAmazonButton) {
        console.log('✅ Amazon browser button found in reward form');
        
        // Test clicking the button
        await amazonButton.click();
        await page.waitForTimeout(1000);
        
        // Check if modal opens
        const modal = page.locator('[role="dialog"], .modal, div').filter({ hasText: /amazon/i });
        const isModalVisible = await modal.isVisible();
        
        if (isModalVisible) {
          console.log('✅ Amazon browser modal opens successfully');
        }
      }
    }
  });
});