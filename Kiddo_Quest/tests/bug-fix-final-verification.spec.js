const { test, expect } = require('@playwright/test');

test.describe('Bug Fix Final Verification', () => {
  test('Comprehensive verification of both bug fixes', async ({ page }) => {
    const errors = [];
    
    // Listen for console errors, especially indexOf errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Verify no indexOf errors occur during normal app usage
    await page.waitForTimeout(2000);
    
    // Test 2: Test feedback modal behavior
    await page.click('text=Feedback');
    await page.waitForSelector('text=Feedback / Bug Report');
    
    // Fill out form
    await page.fill('textarea[required]', 'Test feedback for verification');
    
    // Submit without authentication
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(2000);
    
    // Should see the proper authentication error, not permissions error
    const authError = page.locator('text=Please sign in to submit feedback');
    await expect(authError).toBeVisible();
    
    // Should NOT see the old permissions error
    const oldPermissionsError = page.locator('text=Missing or insufficient permissions');
    await expect(oldPermissionsError).not.toBeVisible();
    
    // Test 3: Check that no indexOf errors occurred
    const indexOfErrors = errors.filter(error => 
      error.includes('indexOf') || 
      error.includes('Cannot read properties of undefined')
    );
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/bug-fix-final-verification.png' });
    
    // Assertions
    expect(indexOfErrors).toEqual([]);
    console.log('✅ Bug Fix Verification Complete');
    console.log('✅ No indexOf errors detected');
    console.log('✅ Feedback modal shows proper authentication error');
    console.log('✅ No Firestore permissions errors shown to user');
  });
});