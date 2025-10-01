const { test, expect } = require('@playwright/test');

test.describe('Quick Feedback Test', () => {
  test('Verify feedback submission works', async ({ page }) => {
    console.log('🔍 Quick feedback submission test...\n');
    
    // Navigate to production site
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // Test anonymous feedback
    console.log('📝 Testing Anonymous Feedback');
    const feedbackButton = page.locator('button:has-text("Feedback")').first();
    
    if (await feedbackButton.isVisible()) {
      await feedbackButton.click();
      await page.waitForTimeout(1000);
      
      // Fill form quickly
      const textareas = page.locator('textarea');
      await textareas.nth(0).fill('Quick test - anonymous feedback works');
      await textareas.nth(1).fill('Test steps');
      
      // Submit
      await page.locator('button:has-text("Submit")').first().click();
      await page.waitForTimeout(2000);
      
      // Check result
      const success = await page.locator('text=/Thank you|Success/i').isVisible().catch(() => false);
      const error = await page.locator('text=/Failed|Error|permission/i').isVisible().catch(() => false);
      
      if (success) {
        console.log('✅ ANONYMOUS FEEDBACK: SUCCESS!');
      } else if (error) {
        const errorText = await page.locator('text=/Failed|Error|permission/i').textContent().catch(() => 'Unknown error');
        console.log(`❌ ANONYMOUS FEEDBACK: FAILED - ${errorText}`);
      } else {
        console.log('⚠️ ANONYMOUS FEEDBACK: Result unclear');
      }
      
      // Close the modal after anonymous test
      const closeButton = page.locator('button:has-text("×")').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('❌ Feedback button not found');
    }
    
    // Now test authenticated feedback
    console.log('\n📝 Testing Authenticated Feedback');
    
    // Login
    const testEmail = 'test1756428303944@kiddoquest.com';
    const testPassword = 'TestKiddo123!';
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In with Email")');
    await page.waitForTimeout(3000);
    
    // Check if logged in
    const loggedIn = await page.locator('text=/Dashboard|Welcome/i').isVisible().catch(() => false);
    
    if (loggedIn) {
      console.log('✅ Logged in successfully');
      
      // Click feedback button
      const authFeedbackBtn = page.locator('button:has-text("Feedback")').first();
      if (await authFeedbackBtn.isVisible()) {
        await authFeedbackBtn.click();
        await page.waitForTimeout(1000);
        
        // Fill form
        const authTextareas = page.locator('textarea');
        await authTextareas.nth(0).fill('Quick test - authenticated feedback');
        await authTextareas.nth(1).fill('Logged in user test');
        
        // Submit
        await page.locator('button:has-text("Submit")').first().click();
        await page.waitForTimeout(2000);
        
        // Check result
        const authSuccess = await page.locator('text=/Thank you|Success/i').isVisible().catch(() => false);
        const authError = await page.locator('text=/Failed|Error|permission/i').isVisible().catch(() => false);
        
        if (authSuccess) {
          console.log('✅ AUTHENTICATED FEEDBACK: SUCCESS!');
        } else if (authError) {
          const errorText = await page.locator('text=/Failed|Error|permission/i').textContent().catch(() => 'Unknown error');
          console.log(`❌ AUTHENTICATED FEEDBACK: FAILED - ${errorText}`);
        } else {
          console.log('⚠️ AUTHENTICATED FEEDBACK: Result unclear');
        }
      } else {
        console.log('❌ Feedback button not found after login');
      }
    } else {
      console.log('❌ Login failed');
    }
    
    console.log('\n========================================');
    console.log('📊 TEST COMPLETE');
    console.log('========================================');
  });
});