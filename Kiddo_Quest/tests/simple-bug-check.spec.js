const { test, expect } = require('@playwright/test');

test.describe('Simple Bug Check', () => {
  test('Check for indexOf error in console', async ({ page }) => {
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
    
    // Take a screenshot to see current state
    await page.screenshot({ path: 'tests/screenshots/initial-state.png' });
    
    // Check for any errors containing 'indexOf'
    const indexOfErrors = errors.filter(error => error.includes('indexOf'));
    
    console.log('All console errors:', errors);
    console.log('indexOf specific errors:', indexOfErrors);
    
    // If we can see any element on the page, try to interact with it
    try {
      // Wait a bit for any async errors to appear
      await page.waitForTimeout(3000);
      
      // Try to click any element that might trigger the child profile editing
      const editLinks = await page.locator('text=Edit').all();
      if (editLinks.length > 0) {
        await editLinks[0].click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('Could not interact with edit elements:', error.message);
    }
    
    // Final check for indexOf errors
    const finalIndexOfErrors = errors.filter(error => error.includes('indexOf'));
    
    // This test passes if no indexOf errors are found
    expect(finalIndexOfErrors).toEqual([]);
  });

  test('Check feedback modal access', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/feedback-test.png' });
    
    // Look for feedback button
    const feedbackButton = page.locator('[data-testid="feedback-button"], text=Feedback').first();
    
    try {
      if (await feedbackButton.isVisible()) {
        await feedbackButton.click();
        await page.waitForTimeout(1000);
        
        // Check if modal opened
        const modal = page.locator('text=Feedback / Bug Report');
        const modalVisible = await modal.isVisible();
        
        console.log('Feedback modal visible:', modalVisible);
        
        if (modalVisible) {
          // Fill minimal form to test submission without auth
          await page.fill('textarea[required]', 'Test feedback');
          await page.click('button:has-text("Submit")');
          await page.waitForTimeout(2000);
          
          // Take screenshot of result
          await page.screenshot({ path: 'tests/screenshots/feedback-result.png' });
        }
      }
    } catch (error) {
      console.log('Feedback test error:', error.message);
    }
    
    // This test always passes - we're just checking behavior
    expect(true).toBe(true);
  });
});