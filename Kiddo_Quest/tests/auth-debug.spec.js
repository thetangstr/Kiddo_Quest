// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Create a directory for screenshots if it doesn't exist
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir);
}

// Authentication Debug Test
test.describe('Authentication Debug', () => {
  test('Admin login and dashboard verification', async ({ page }) => {
    // Log the start of the test
    console.log('Starting admin login test...');
    
    // Capture console logs and errors
    const logs = [];
    const errors = [];
    page.on('console', msg => {
      const logText = `[${msg.type()}] ${msg.text()}`;
      logs.push(logText);
      console.log('Browser console:', logText);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Capture network requests
    const requests = [];
    page.on('request', request => {
      requests.push(`${request.method()} ${request.url()}`);
      console.log('Network request:', request.method(), request.url());
    });
    
    // Capture network responses
    page.on('response', response => {
      console.log('Network response:', response.status(), response.url());
    });
    
    // Navigate to the app
    await page.goto('http://localhost:3000/');
    console.log('Navigated to app');
    
    // Take screenshot of initial state
    await page.screenshot({ path: `${screenshotDir}/01-initial-load.png` });
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check if login form is visible
    const emailInput = await page.locator('input[type="email"]');
    const passwordInput = await page.locator('input[type="password"]');
    const signInButton = await page.locator('button:has-text("Sign In with Email")');
    
    console.log('Email input visible:', await emailInput.isVisible());
    console.log('Password input visible:', await passwordInput.isVisible());
    console.log('Sign In button visible:', await signInButton.isVisible());
    
    // Fill in admin email and password
    console.log('Filling email field...');
    await emailInput.click(); // Focus the field first
    await emailInput.fill('testadmin@example.com');
    
    console.log('Filling password field...');
    await passwordInput.click(); // Focus the field first  
    await passwordInput.fill('TestAdmin123!');
    
    // Verify the fields are filled correctly
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    console.log('Email field value:', emailValue);
    console.log('Password field value:', passwordValue);
    
    // Check if the form is valid before submitting
    const formElement = await page.locator('form').first();
    const isFormValid = await formElement.evaluate(form => form.checkValidity && form.checkValidity());
    console.log('Form is valid:', isFormValid);
    
    // Take screenshot before login
    await page.screenshot({ path: `${screenshotDir}/02-before-login.png` });
    
    // Click login button
    console.log('Clicking Sign In button');
    await signInButton.click();
    
    // Wait for any immediate changes
    await page.waitForTimeout(3000);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: `${screenshotDir}/03-after-login-attempt.png` });
    
    // Check for any error messages that might appear after login attempt
    await page.waitForTimeout(2000); // Give time for any error messages to appear
    
    // Look for specific error messages
    const errorMessages = await page.locator('.text-red-500, .text-red-600, [class*="error"], [class*="Error"]').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }
    
    // Check if we're still on the login form (which would indicate login failed)
    const stillOnLogin = await page.isVisible('button:has-text("Sign In with Email")');
    console.log('Still showing login form:', stillOnLogin);
    
    // Print current URL and page title for debugging
    console.log('Current URL:', page.url());
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any error messages on the page
    const errorElements = await page.locator('[class*="error"], [class*="Error"], .text-red-500, .text-red-600').all();
    if (errorElements.length > 0) {
      console.log('Found error elements on page:');
      for (const errorEl of errorElements) {
        const errorText = await errorEl.textContent();
        console.log('Error text:', errorText);
      }
    }
    
    // Log the page content for debugging
    const content = await page.content();
    console.log('Page content preview:', content.substring(0, 1000) + '...');
    
    console.log('Waiting for dashboard elements...');
    
    try {
      // First, check for the authentication success marker we added to App.js
      console.log('Waiting for authentication success marker...');
      await page.waitForSelector('[data-testid="auth-success-marker"]', { 
        timeout: 15000,
        state: 'attached' // Wait for element to exist, regardless of visibility
      });
      console.log('✅ Authentication success marker found!');
      
      // Get the content of the authentication marker to see current view and user email
      const authMarkerContent = await page.$eval('[data-testid="auth-success-marker"]', el => el.textContent);
      console.log('Auth marker content:', authMarkerContent);
      
      // Now wait for dashboard elements
      console.log('Checking for dashboard elements...');
      await Promise.race([
        page.waitForSelector('[data-testid="dashboard-title"]', { timeout: 10000 }),
        page.waitForSelector('[data-testid="parent-dashboard"]', { timeout: 10000 }),
        page.waitForSelector('text=Parent Dashboard', { timeout: 10000 }),
        page.waitForSelector('button:has-text("Manage Invitations")', { timeout: 10000 }),
      ]);
      
      console.log('✅ Dashboard element detected!');
      await page.screenshot({ path: `${screenshotDir}/04-dashboard-detected.png` });
      
      // Check if we can see the "Manage Invitations" button
      const hasManageInvitationsBtn = await page.isVisible('button:has-text("Manage Invitations")');
      console.log('Is "Manage Invitations" button visible?', hasManageInvitationsBtn);
      
      // Verify successful login by checking dashboard elements
      expect(hasManageInvitationsBtn).toBeTruthy();
      console.log('✅ Test passed: Admin login successful');
      
    } catch (error) {
      console.log('❌ Error: Failed to detect dashboard elements:', error.message);
      console.log('Console errors captured:', errors);
      console.log('Network requests made:', requests.slice(-10)); // Show last 10 requests
      console.log('All console logs:', logs.slice(-20)); // Show last 20 logs
      
      // Take a final screenshot to see what's on screen when the test fails
      await page.screenshot({ path: `${screenshotDir}/05-login-failure.png` });
      throw error;
    }
  });
});
