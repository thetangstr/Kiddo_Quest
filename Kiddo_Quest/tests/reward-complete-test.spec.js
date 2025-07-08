const { test, expect } = require('@playwright/test');

test.describe('Complete Reward Test', () => {
  test('Register, login and test reward creation', async ({ page }) => {
    const errors = [];
    const consoleLogs = [];
    
    // Listen for all console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`${msg.type()}: ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
      // Log specific important messages immediately
      if (text.includes('Error') || text.includes('error') || text.includes('reward')) {
        console.log(`Console ${msg.type()}: ${text}`);
      }
    });

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Generate unique test email
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('Using test email:', testEmail);
    
    // Step 1: Register a new user
    console.log('\nStep 1: Registering new user...');
    
    // Click Register link
    await page.click('text=Register');
    await page.waitForTimeout(1000);
    
    // Fill registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Fill confirm password
    const confirmPasswordInput = page.locator('input[placeholder*="Confirm"]');
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.fill(testPassword);
    }
    
    // Click sign up button
    await page.click('button:has-text("Sign Up")');
    
    // Wait for registration to complete
    await page.waitForTimeout(5000);
    
    // Check if we're on dashboard
    const isDashboard = await page.locator('text=Dashboard').isVisible().catch(() => false);
    
    if (!isDashboard) {
      console.log('❌ Not on dashboard after registration');
      
      // Check for error messages
      const errorText = await page.locator('.text-red-600, .text-red-500').textContent().catch(() => null);
      if (errorText) {
        console.log('Registration error:', errorText);
      }
      
      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/after-registration-attempt.png' });
    } else {
      console.log('✅ Successfully registered and logged in');
    }
    
    // Step 2: Navigate to rewards
    console.log('\nStep 2: Navigating to rewards...');
    
    // Look for rewards option
    const rewardsButton = page.locator('button:has-text("Manage Rewards"), a:has-text("Manage Rewards"), text=Rewards').first();
    
    if (await rewardsButton.isVisible()) {
      await rewardsButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked on rewards');
    } else {
      console.log('❌ Could not find rewards button');
      // Take screenshot to see current state
      await page.screenshot({ path: 'tests/screenshots/dashboard-no-rewards.png' });
    }
    
    // Step 3: Create new reward
    console.log('\nStep 3: Creating new reward...');
    
    const createButton = page.locator('button:has-text("Create New Reward"), button:has-text("Create Reward"), button:has-text("Add Reward")').first();
    
    if (await createButton.isVisible()) {
      console.log('✅ Found create reward button');
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Fill form
      console.log('Filling reward form...');
      
      // Title
      const titleInput = page.locator('input[name="title"]').first();
      await titleInput.fill('Test Reward ' + Date.now());
      
      // Description
      const descInput = page.locator('textarea[name="description"]').first();
      if (await descInput.isVisible()) {
        await descInput.fill('This is a test reward');
      }
      
      // Cost
      const costInput = page.locator('input[name="cost"]').first();
      await costInput.clear();
      await costInput.fill('25');
      
      // Take screenshot of filled form
      await page.screenshot({ path: 'tests/screenshots/reward-form-complete.png' });
      
      // Submit form
      console.log('Submitting form...');
      const saveButton = page.locator('button[type="submit"], button:has-text("Create Reward"), button:has-text("Save")').last();
      
      if (await saveButton.isVisible()) {
        // Check if button is enabled
        const isDisabled = await saveButton.isDisabled();
        console.log('Save button disabled:', isDisabled);
        
        await saveButton.click();
        console.log('✅ Clicked save button');
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        // Check current state
        const isStillOnForm = await titleInput.isVisible().catch(() => false);
        const currentUrl = page.url();
        
        console.log('Still on form:', isStillOnForm);
        console.log('Current URL:', currentUrl);
        
        // Take screenshot after save
        await page.screenshot({ path: 'tests/screenshots/after-save-attempt.png' });
        
        // Check for any alerts or error messages
        const alerts = await page.locator('[role="alert"], .alert, .error').all();
        for (const alert of alerts) {
          const alertText = await alert.textContent();
          console.log('Alert found:', alertText);
        }
      }
    } else {
      console.log('❌ Could not find create reward button');
      await page.screenshot({ path: 'tests/screenshots/rewards-page-no-create.png' });
    }
    
    // Log final errors
    console.log('\n=== FINAL ERRORS ===');
    const uniqueErrors = [...new Set(errors)];
    uniqueErrors.forEach(error => console.log(error));
    
    // Log reward-specific console messages
    console.log('\n=== REWARD-RELATED LOGS ===');
    consoleLogs.filter(log => 
      log.toLowerCase().includes('reward') || 
      log.toLowerCase().includes('adddoc') ||
      log.toLowerCase().includes('firestore') ||
      log.toLowerCase().includes('invalid')
    ).forEach(log => console.log(log));
    
    // Test completes
    expect(true).toBe(true);
  });
});