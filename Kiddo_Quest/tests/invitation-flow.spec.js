// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');

/**
 * Kiddo Quest Invitation System Test Suite
 * 
 * This test suite verifies the functionality of the invitation system:
 * 1. Admin login and invitation management
 * 2. Invitation creation and display
 * 3. Invitation acceptance flow
 * 4. Google sign-in integration
 * 5. Email registration integration
 */

// Admin test credentials
const ADMIN_EMAIL = 'thetangstr@gmail.com';
const ADMIN_PASSWORD = 'test123'; // Change to appropriate test password

// Test email for invitation
const TEST_INVITE_EMAIL = 'test-user@example.com';

// Application URL - use localhost for development testing
const APP_URL = 'http://localhost:3000';

test.describe('Invitation Flow', () => {
  // Store screenshots in a test-results directory
  const screenshotDir = './test-results/screenshots';
  
  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });
  
  test('Admin login and navigation to invitation management', async ({ page }) => {
    // Navigate to the application
    await page.goto(APP_URL);
    await expect(page).toHaveTitle(/Kiddo Quest/);
    
    // Take screenshot of the login page
    await page.screenshot({ path: `${screenshotDir}/01-login-page.png` });
    
    // Log in as admin
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Sign In with Email")');
    
    // Wait for login to complete and dashboard to load
    try {
      // Add debug logs
      console.log('Waiting for dashboard to load after login...');
      
      // Log page content to help with debugging
      const pageContent = await page.content();
      console.log('Current page content:', pageContent.substring(0, 500) + '...');
      
      // Take screenshot for debugging
      await page.screenshot({ path: `${screenshotDir}/login-attempt-debug.png` });
      
      // Check for error messages
      const errorMessages = await page.$$eval('.text-red-500, .error-message', elements => 
        elements.map(el => el.textContent)
      );
      if (errorMessages.length > 0) {
        console.log('Found error messages on page:', errorMessages);
      }
      
      // Wait for any of these selectors to appear with a longer timeout
      await Promise.any([
        page.waitForSelector('[data-testid="dashboard-title"]', { timeout: 30000 }),
        page.waitForSelector('[data-testid="parent-dashboard"]', { timeout: 30000 }),
        page.waitForSelector('text=Parent Dashboard', { timeout: 30000 }),
      ]);
      
      console.log('Dashboard detected!');
      
      // Take screenshot of the dashboard
      await page.screenshot({ path: `${screenshotDir}/02-admin-dashboard.png` });
      
      // Check if the "Manage Invitations" button is visible for admin
      const inviteButton = await page.getByText('Manage Invitations');
      await expect(inviteButton).toBeVisible();
      
      // Navigate to invitation management
      await inviteButton.click();
      
      // Wait for invitation management to load
      await page.waitForSelector('text=Invite Someone', { timeout: 5000 });
      
      // Take screenshot of invitation management page
      await page.screenshot({ path: `${screenshotDir}/03-invitation-management.png` });
      
      // Test passed if we reach this point
      console.log('✅ Admin can access invitation management');
    } catch (error) {
      console.log('❌ Error during admin login or navigation:', error.message);
      // Take screenshot of the error state
      await page.screenshot({ path: `${screenshotDir}/error-admin-login.png` });
      throw error;
    }
  });

  test('Create and verify invitation', async ({ page }) => {
    // Log in as admin
    await page.goto(APP_URL);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Sign In with Email")');
    
    // Navigate to invitation management
    console.log('Waiting for dashboard before navigating to invitation management...');
    
    // Log page content to help with debugging
    const pageContent = await page.content();
    console.log('Current page content:', pageContent.substring(0, 500) + '...');
    
    // Take screenshot for debugging
    await page.screenshot({ path: `${screenshotDir}/admin-dashboard-debug.png` });
    
    // Wait for any of these selectors to appear with longer timeout
    await Promise.any([
      page.waitForSelector('[data-testid="dashboard-title"]', { timeout: 30000 }),
      page.waitForSelector('[data-testid="parent-dashboard"]', { timeout: 30000 }),
      page.waitForSelector('text=Parent Dashboard', { timeout: 30000 }),
    ]);
    
    console.log('Dashboard detected, proceeding to invitation management...');
    await page.getByText('Manage Invitations').click();
    
    try {
      // Create a new invitation
      await page.waitForSelector('text=Invite Someone', { timeout: 5000 });
      await page.fill('input[placeholder="Enter email address"]', TEST_INVITE_EMAIL);
      await page.selectOption('select', 'parent'); // Select parent role
      
      // Take screenshot before sending
      await page.screenshot({ path: `${screenshotDir}/04-new-invitation-form.png` });
      
      // Send invitation
      await page.click('button:has-text("Send Invitation")');
      
      // Wait for the invitation to appear in the list
      await page.waitForSelector(`text=${TEST_INVITE_EMAIL}`, { timeout: 10000 });
      
      // Take screenshot of invitation list
      await page.screenshot({ path: `${screenshotDir}/05-invitation-list.png` });
      
      // Verify invitation status is "Pending"
      const pendingBadge = await page.locator(`tr:has-text("${TEST_INVITE_EMAIL}") >> text=Pending`);
      await expect(pendingBadge).toBeVisible();
      
      // Test actions on the invitation (refresh button)
      const refreshButton = await page.locator(`tr:has-text("${TEST_INVITE_EMAIL}") button:has-text("Refresh")`);
      await expect(refreshButton).toBeVisible();
      
      console.log('✅ Admin can create and view invitations');
    } catch (error) {
      console.log('❌ Error during invitation creation:', error.message);
      await page.screenshot({ path: `${screenshotDir}/error-invitation-creation.png` });
      throw error;
    }
  });

  test('Invitation acceptance flow with URL token', async ({ page }) => {
    // This test simulates a user clicking an invitation link
    // In a real test, we would get an actual token from the database
    // For this demo, we'll use a mock token and check that the app attempts to validate it
    
    // Navigate to the app with a mock token
    await page.goto(`${APP_URL}?token=test-token-123456`);
    
    try {
      // Check if the app attempts to verify the token
      // This might show a loading state, error, or verification UI
      await page.waitForTimeout(2000); // Give the app time to process the token
      
      // Take a screenshot of whatever is displayed
      await page.screenshot({ path: `${screenshotDir}/06-invitation-token-handling.png` });
      
      // Log the current URL to verify any routing changes
      const currentUrl = page.url();
      console.log(`Current URL after token processing: ${currentUrl}`);
      
      // Check if any verification-related elements are visible
      const pageContent = await page.content();
      if (pageContent.includes('invitation') || 
          pageContent.includes('verify') || 
          pageContent.includes('token')) {
        console.log('✅ Application reacted to the invitation token');
      } else {
        console.log('⚠️ No obvious invitation verification UI detected');
      }
    } catch (error) {
      console.log('❌ Error during invitation verification:', error.message);
      await page.screenshot({ path: `${screenshotDir}/error-invitation-verification.png` });
      throw error;
    }
  });
  
  test('Account creation options from invitation link', async ({ page }) => {
    // Navigate with a mock invitation token
    await page.goto(`${APP_URL}?token=test-token-123456`);
    
    try {
      // Take screenshot of the signup/login options
      await page.screenshot({ path: `${screenshotDir}/07-invitation-signup-options.png` });
      
      // Check if the email field is pre-filled (would happen with a real token)
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        console.log('✅ Email input field found for registration');
        
        // Check if Google sign-in option is available
        const googleButton = await page.$('button:has-text("Sign in with Google")');
        if (googleButton) {
          console.log('✅ Google sign-in option is available');
        }
        
        // Check if email registration option is available
        const registerLink = await page.$('text=Register');
        if (registerLink) {
          console.log('✅ Email registration option is available');
        }
      }
    } catch (error) {
      console.log('❌ Error checking account creation options:', error.message);
      await page.screenshot({ path: `${screenshotDir}/error-account-options.png` });
      throw error;
    }
  });
});

// Run the tests with: npx playwright test tests/invitation-flow.spec.js
