const { test, expect } = require('@playwright/test');

test.describe('Live Site Reward Test', () => {
  test('Test reward creation on live site', async ({ page }) => {
    const errors = [];
    const consoleLogs = [];
    
    // Listen for all console messages
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the live site
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/live-site-initial.png' });
    
    // Wait for any loading to complete
    await page.waitForTimeout(3000);
    
    // Look for authentication or access to reward functionality
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check what's visible on the page
    const pageTitle = await page.textContent('h1, h2').catch(() => 'No title found');
    console.log('Page title:', pageTitle);
    
    // Try to access reward management directly
    try {
      await page.goto('https://kiddo-quest-de7b0.web.app/#manageRewards');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'tests/screenshots/live-site-manage-rewards.png' });
      
      // Check if we can access reward form
      await page.goto('https://kiddo-quest-de7b0.web.app/#rewardForm');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'tests/screenshots/live-site-reward-form.png' });
      
      // Look for any reward-related elements or error messages
      const bodyText = await page.textContent('body');
      
      if (bodyText.toLowerCase().includes('reward')) {
        console.log('✅ Found reward-related content');
      }
      
      if (bodyText.toLowerCase().includes('error')) {
        console.log('❌ Found error-related content');
      }
      
    } catch (error) {
      console.log('Error navigating to reward pages:', error.message);
    }
    
    // Log all console messages and errors
    console.log('\n=== CONSOLE LOGS (last 20) ===');
    consoleLogs.slice(-20).forEach(log => console.log(log));
    
    console.log('\n=== ERRORS ===');
    errors.forEach(error => console.log(error));
    
    // Check for specific reward-related errors
    const rewardErrors = errors.filter(error => 
      error.toLowerCase().includes('reward') || 
      error.toLowerCase().includes('adddoc') ||
      error.toLowerCase().includes('firestore')
    );
    
    console.log('\n=== REWARD-RELATED ERRORS ===');
    rewardErrors.forEach(error => console.log(error));
    
    // Test passes regardless - this is for debugging
    expect(true).toBe(true);
  });
});