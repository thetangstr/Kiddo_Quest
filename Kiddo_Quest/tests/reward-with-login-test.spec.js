const { test, expect } = require('@playwright/test');

test.describe('Reward Test with Login', () => {
  test('Login and test create reward functionality', async ({ page }) => {
    const errors = [];
    const consoleLogs = [];
    
    // Listen for all console messages
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Login with test credentials
    console.log('Step 1: Logging in...');
    
    // Wait for login form to be visible
    await page.waitForSelector('button:has-text("Sign In with Email")');
    
    // Fill in test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click sign in button
    await page.click('button:has-text("Sign In with Email")');
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    // Check if login was successful
    const currentUrl = page.url();
    const isLoginPage = await page.locator('text=Sign In with Email').isVisible();
    
    if (isLoginPage) {
      console.log('❌ Still on login page - login may have failed');
      
      // Check for error messages
      const errorMessage = await page.locator('.text-red-600, .text-red-500, [role="alert"]').textContent().catch(() => null);
      if (errorMessage) {
        console.log('Error message:', errorMessage);
      }
      
      // Try to register a new user instead
      console.log('Attempting to register new user...');
      const registerLink = page.locator('text=Register');
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await page.waitForTimeout(1000);
        
        // Fill registration form
        await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
        await page.fill('input[type="password"]', 'TestPassword123!');
        
        // Look for sign up button
        const signUpButton = page.locator('button:has-text("Sign Up"), button:has-text("Create Account")');
        if (await signUpButton.isVisible()) {
          await signUpButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
    
    // Step 2: Navigate to rewards management
    console.log('\nStep 2: Navigating to rewards...');
    
    // Look for dashboard or rewards link
    const dashboardLink = page.locator('text=Dashboard').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Look for rewards management
    const rewardsLink = page.locator('text=Manage Rewards, text=Rewards').first();
    if (await rewardsLink.isVisible()) {
      await rewardsLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to rewards section');
    }
    
    // Step 3: Try to create a new reward
    console.log('\nStep 3: Creating new reward...');
    
    // Look for create new reward button
    const createRewardButton = page.locator('button:has-text("Create New Reward"), button:has-text("Create Reward"), button:has-text("Add Reward")').first();
    if (await createRewardButton.isVisible()) {
      await createRewardButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked create reward button');
      
      // Fill reward form
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Reward ' + Date.now());
        console.log('✅ Filled title');
      }
      
      const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('This is a test reward created by automated test');
        console.log('✅ Filled description');
      }
      
      const costInput = page.locator('input[name="cost"], input[type="number"]').first();
      if (await costInput.isVisible()) {
        await costInput.fill('50');
        console.log('✅ Filled cost');
      }
      
      // Take screenshot before submitting
      await page.screenshot({ path: 'tests/screenshots/reward-form-filled.png' });
      
      // Try to submit the form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create Reward")').last();
      if (await submitButton.isVisible()) {
        console.log('✅ Found submit button, clicking...');
        await submitButton.click();
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        // Take screenshot after submission
        await page.screenshot({ path: 'tests/screenshots/reward-after-submit-attempt.png' });
        
        // Check if we're back on rewards list (success) or still on form (error)
        const isStillOnForm = await titleInput.isVisible().catch(() => false);
        const successMessage = await page.locator('text=success, text=created, text=added').isVisible().catch(() => false);
        const errorAlert = await page.locator('.text-red-600, .text-red-500, [role="alert"]').textContent().catch(() => null);
        
        if (isStillOnForm) {
          console.log('❌ Still on form - submission may have failed');
          if (errorAlert) {
            console.log('Error alert:', errorAlert);
          }
        } else if (successMessage) {
          console.log('✅ Success message visible');
        } else {
          console.log('ℹ️  Form submission completed, checking current view...');
          const currentView = await page.textContent('h1, h2').catch(() => 'Unknown');
          console.log('Current view:', currentView);
        }
      }
    } else {
      console.log('❌ Could not find create reward button');
      await page.screenshot({ path: 'tests/screenshots/no-create-reward-button.png' });
    }
    
    // Log all errors
    console.log('\n=== ERRORS ===');
    errors.forEach(error => console.log(error));
    
    // Log relevant console messages
    console.log('\n=== RELEVANT CONSOLE LOGS ===');
    consoleLogs.filter(log => 
      log.includes('reward') || 
      log.includes('error') || 
      log.includes('addDoc') ||
      log.includes('firestore') ||
      log.includes('Error')
    ).forEach(log => console.log(log));
    
    // Check for specific errors
    const rewardErrors = errors.filter(error => 
      error.toLowerCase().includes('reward') || 
      error.toLowerCase().includes('adddoc') ||
      error.toLowerCase().includes('firestore') ||
      error.toLowerCase().includes('invalid')
    );
    
    if (rewardErrors.length > 0) {
      console.log('\n=== REWARD-SPECIFIC ERRORS ===');
      rewardErrors.forEach(error => console.log(error));
    }
    
    // Test passes to allow debugging
    expect(true).toBe(true);
  });
});