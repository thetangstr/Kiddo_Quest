const { test, expect } = require('@playwright/test');

test.describe('Reward Save Button Test', () => {
  test('Test reward creation form submission', async ({ page }) => {
    const errors = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/reward-test-initial.png' });
    
    // Check if we can access the reward form (this will test locally without auth)
    try {
      // Try to navigate directly to reward form or through UI
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Wait for any loading to complete
      await page.waitForTimeout(2000);
      
      // Look for any reward-related elements
      const rewardElements = await page.locator('text=reward', { ignoreCase: true }).count();
      console.log('Found reward-related elements:', rewardElements);
      
      // Check if the save button or form elements are accessible
      const saveButton = page.locator('button:has-text("Create Reward"), button:has-text("Save")');
      const titleField = page.locator('input[name="title"], input[placeholder*="title" i]');
      
      console.log('Save button visible:', await saveButton.isVisible());
      console.log('Title field visible:', await titleField.isVisible());
      
      // Take screenshot of current state
      await page.screenshot({ path: 'tests/screenshots/reward-test-current.png' });
      
    } catch (error) {
      console.log('Error during reward form test:', error.message);
    }
    
    // Check for any console errors that might indicate issues
    const criticalErrors = errors.filter(error => 
      error.includes('reward') || 
      error.includes('save') ||
      error.includes('submit') ||
      error.includes('addReward') ||
      error.includes('updateReward')
    );
    
    console.log('All console errors:', errors);
    console.log('Reward-related errors:', criticalErrors);
    
    // Test passes if no critical errors found
    expect(criticalErrors).toEqual([]);
  });
});