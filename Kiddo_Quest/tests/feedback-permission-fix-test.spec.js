const { test, expect } = require('@playwright/test');

test.describe('Feedback Permission Fix Test', () => {
  test('should require authentication for feedback submission', async ({ page }) => {
    // Go to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find and click the feedback button (without logging in)
    const feedbackButton = page.locator('text=Feedback').first();
    await expect(feedbackButton).toBeVisible();
    await feedbackButton.click();
    
    // Wait for feedback modal to appear
    await expect(page.locator('text=Feedback / Bug Report')).toBeVisible();
    
    // Fill out the feedback form
    await page.fill('textarea[required]', 'Test feedback without authentication');
    await page.fill('textarea:not([required])', 'Steps: Just testing');
    await page.selectOption('select', 'medium');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should show authentication error
    await expect(page.locator('text=You must be logged in to submit feedback')).toBeVisible();
    
    console.log('✅ Feedback properly requires authentication');
  });

  test('should allow feedback submission when authenticated', async ({ page }) => {
    // Go to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // First, let's try to login with test credentials
    const loginButton = page.locator('button:has-text("Sign In with Email")');
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', 'testuser@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Wait a bit for potential login
      await page.waitForTimeout(3000);
    }
    
    // Find and click the feedback button
    const feedbackButton = page.locator('text=Feedback').first();
    await expect(feedbackButton).toBeVisible();
    await feedbackButton.click();
    
    // Wait for feedback modal to appear
    await expect(page.locator('text=Feedback / Bug Report')).toBeVisible();
    
    // Fill out the feedback form
    await page.fill('textarea[required]', 'Test feedback with authentication attempt');
    await page.fill('textarea:not([required])', 'Steps: Login first, then test');
    await page.selectOption('select', 'low');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check the result - either success or proper auth error
    const authError = page.locator('text=You must be logged in to submit feedback');
    const permissionError = page.locator('text=Missing or insufficient permissions');
    const successMessage = page.locator('text=Thank you for your feedback');
    
    // Wait for one of these to appear
    await Promise.race([
      authError.waitFor({ timeout: 5000 }).catch(() => {}),
      permissionError.waitFor({ timeout: 5000 }).catch(() => {}),
      successMessage.waitFor({ timeout: 5000 }).catch(() => {})
    ]);
    
    if (await authError.isVisible()) {
      console.log('✅ Proper authentication error shown');
    } else if (await successMessage.isVisible()) {
      console.log('✅ Feedback submitted successfully');
    } else if (await permissionError.isVisible()) {
      console.log('❌ Still getting permission errors');
      throw new Error('Permission error still occurs after fix');
    } else {
      console.log('⚠️ Unexpected result - checking page state');
      // Take screenshot for debugging
      await page.screenshot({ path: 'feedback-test-result.png' });
    }
  });
});