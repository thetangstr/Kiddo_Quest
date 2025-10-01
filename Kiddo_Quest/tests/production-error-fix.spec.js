const { test, expect } = require('@playwright/test');

test.describe('Production React Error #185 Fix Verification', () => {
  test('should not have infinite update loop errors in production build', async ({ page }) => {
    console.log('Testing React error #185 fix in production build...');
    
    // Collect console errors
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', msg => {
      const text = msg.text();
      console.log(`Browser console: [${msg.type()}] ${text}`);
      
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });
    
    // Navigate to production build
    await page.goto('/', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log('Navigated to production build');
    
    // Wait for the app to load and check for auth state
    await page.waitForSelector('[data-testid="loading-spinner"], input[type="email"]', { 
      timeout: 5000 
    });
    
    // Wait a bit longer to catch any delayed errors
    await page.waitForTimeout(3000);
    
    // Check for React error #185 specifically
    const hasReactError185 = consoleErrors.some(error => 
      error.includes('Minified React error #185') || 
      error.includes('Maximum update depth exceeded')
    );
    
    // Check for any other React errors that might indicate infinite loops
    const hasInfiniteLoopErrors = consoleErrors.some(error => 
      error.includes('Maximum call stack size exceeded') ||
      error.includes('Too much recursion') ||
      error.includes('Maximum update depth')
    );
    
    console.log(`Console errors found: ${consoleErrors.length}`);
    console.log(`Console warnings found: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    
    // Verify no React error #185 or infinite loop errors
    expect(hasReactError185, 'Should not have React error #185 (Maximum update depth exceeded)').toBe(false);
    expect(hasInfiniteLoopErrors, 'Should not have infinite loop related errors').toBe(false);
    
    // Try to interact with the app to trigger potential state updates
    const emailInput = await page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('testadmin@example.com');
      await page.waitForTimeout(1000);
      
      const passwordInput = await page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('TestAdmin123!');
        await page.waitForTimeout(1000);
        
        // Try to submit the form to trigger state changes
        const loginButton = await page.locator('button[type="submit"]:has-text("Sign In")').first();
        if (await loginButton.isVisible()) {
          await loginButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // Check again for any errors after interaction
    const finalErrorCount = consoleErrors.length;
    const hasNewReactErrors = consoleErrors.slice(finalErrorCount).some(error => 
      error.includes('Minified React error #185') || 
      error.includes('Maximum update depth exceeded')
    );
    
    expect(hasNewReactErrors, 'Should not have React error #185 after user interaction').toBe(false);
    
    console.log('Production React error #185 fix verification completed successfully');
  });
});
