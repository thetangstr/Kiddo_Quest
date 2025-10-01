const { test, expect } = require('@playwright/test');

test.describe('Reward Save Debug Test', () => {
  test('Debug reward save functionality with detailed logging', async ({ page }) => {
    const errors = [];
    const consoleLogs = [];
    
    // Listen for all console messages
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Listen for network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    // Listen for network responses
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`HTTP Error: ${response.status()} ${response.url()}`);
      }
    });

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/reward-debug-initial.png' });
    
    // Check if we can find a way to access the reward form
    // This might require authentication, so let's check what's available
    await page.waitForTimeout(2000);
    
    // Look for any buttons or links related to rewards
    const rewardButtons = await page.locator('text=reward', { ignoreCase: true }).all();
    console.log(`Found ${rewardButtons.length} reward-related elements`);
    
    // Look for login or sign up options
    const loginButton = page.locator('button:has-text("Sign In with Email")').first();
    const signupButton = page.locator('text=Register').first();
    
    console.log(`Login button visible: ${await loginButton.isVisible()}`);
    console.log(`Signup button visible: ${await signupButton.isVisible()}`);
    
    // Check if we can access any internal URLs directly
    const urlsToTry = [
      '/rewardForm',
      '/#rewardForm',
      '/manageRewards',
      '/#manageRewards'
    ];
    
    for (const url of urlsToTry) {
      try {
        await page.goto(`http://localhost:3000${url}`);
        await page.waitForTimeout(1000);
        
        const rewardForm = page.locator('text=Create New Reward, text=Reward Title');
        const saveButton = page.locator('button:has-text("Create Reward"), button:has-text("Save")');
        
        if (await rewardForm.isVisible() || await saveButton.isVisible()) {
          console.log(`✅ Found reward form at ${url}`);
          
          // Take screenshot of the form
          await page.screenshot({ path: `tests/screenshots/reward-form-found-${url.replace(/[/#]/g, '_')}.png` });
          
          // Try to fill and submit the form
          const titleField = page.locator('input[name="title"], input[placeholder*="title" i]');
          if (await titleField.isVisible()) {
            await titleField.fill('Test Reward Debug');
            
            const costField = page.locator('input[name="cost"], input[type="number"]');
            if (await costField.isVisible()) {
              await costField.fill('25');
            }
            
            // Try to submit
            const submitButton = page.locator('button[type="submit"], button:has-text("Create Reward")');
            if (await submitButton.isVisible()) {
              console.log('Attempting to submit form...');
              await submitButton.click();
              await page.waitForTimeout(3000);
              
              // Take screenshot after submission attempt
              await page.screenshot({ path: 'tests/screenshots/reward-after-submit.png' });
            }
          }
          break;
        }
      } catch (error) {
        console.log(`Could not access ${url}: ${error.message}`);
      }
    }
    
    // Log all console messages and network requests
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    
    console.log('\n=== NETWORK REQUESTS (Firebase/Firestore) ===');
    networkRequests
      .filter(req => req.url.includes('firebase') || req.url.includes('firestore'))
      .forEach(req => console.log(`${req.method} ${req.url}`));
    
    console.log('\n=== ERRORS ===');
    errors.forEach(error => console.log(error));
    
    // Test passes regardless - this is for debugging
    expect(true).toBe(true);
  });
});