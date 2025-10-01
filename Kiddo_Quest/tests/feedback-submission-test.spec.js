const { test, expect } = require('@playwright/test');

test.describe('Feedback Submission Flow', () => {
  test('Test feedback submission for authenticated and anonymous users', async ({ page }) => {
    console.log('🔍 Testing feedback submission on production site...\n');
    
    // Navigate to production site
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // --- TEST 1: Anonymous Feedback Submission ---
    console.log('📝 TEST 1: Anonymous Feedback Submission');
    console.log('=========================================');
    
    // Look for feedback button
    const feedbackButton = page.locator('button:has-text("Feedback")').first();
    const feedbackButtonVisible = await feedbackButton.isVisible().catch(() => false);
    
    if (feedbackButtonVisible) {
      console.log('✅ Feedback button found');
      
      // Click feedback button
      await feedbackButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal opened
      const modalTitle = page.locator('h2:has-text("Feedback / Bug Report")');
      const modalVisible = await modalTitle.isVisible().catch(() => false);
      
      if (modalVisible) {
        console.log('✅ Feedback modal opened successfully');
        
        // Fill out the feedback form
        // Look for textareas by index since placeholders might not be set
        const textareas = page.locator('textarea');
        const textareaCount = await textareas.count();
        console.log(`Found ${textareaCount} textarea(s) in the modal`);
        
        if (textareaCount >= 1) {
          await textareas.nth(0).fill('Test anonymous feedback submission');
          console.log('✅ Filled description field');
        }
        
        if (textareaCount >= 2) {
          await textareas.nth(1).fill('1. Open site\n2. Click feedback\n3. Submit form');
          console.log('✅ Filled steps field');
        }
        
        // Select severity if dropdown exists
        const severitySelect = page.locator('select').first();
        if (await severitySelect.isVisible().catch(() => false)) {
          await severitySelect.selectOption('low');
          console.log('✅ Selected severity: low');
        }
        
        // Take screenshot before submission
        await page.screenshot({ path: 'tests/screenshots/feedback-test-01-form-filled.png' });
        
        // Submit the form - look for Submit button text to avoid clicking Sign In button
        const submitButton = page.locator('button:has-text("Submit")').first();
        await submitButton.click();
        console.log('⏳ Submitting anonymous feedback...');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check for success or error message
        const successMessage = await page.locator('text=/Thank you|Success|submitted/i').isVisible().catch(() => false);
        const errorMessage = await page.locator('text=/Failed|Error|permissions/i').textContent().catch(() => null);
        
        if (successMessage) {
          console.log('✅ Anonymous feedback submitted successfully!');
          await page.screenshot({ path: 'tests/screenshots/feedback-test-02-anonymous-success.png' });
        } else if (errorMessage) {
          console.log(`❌ Anonymous feedback failed: ${errorMessage}`);
          await page.screenshot({ path: 'tests/screenshots/feedback-test-02-anonymous-error.png' });
        } else {
          console.log('⚠️ No clear success or error message');
          await page.screenshot({ path: 'tests/screenshots/feedback-test-02-anonymous-unclear.png' });
        }
        
        // Close modal if possible
        const closeButton = page.locator('button:has-text("×")').first();
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        console.log('❌ Feedback modal did not open');
      }
    } else {
      console.log('❌ Feedback button not found');
    }
    
    console.log('\n');
    
    // --- TEST 2: Authenticated User Feedback ---
    console.log('📝 TEST 2: Authenticated User Feedback');
    console.log('=====================================');
    
    // Login with test account
    const testEmail = 'test1756428303944@kiddoquest.com';
    const testPassword = 'TestKiddo123!';
    
    console.log('🔐 Logging in with test account...');
    
    // Fill login form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In with Email")');
    
    // Wait for login
    await page.waitForTimeout(3000);
    
    // Check if logged in
    const loggedIn = await page.locator('text=/Dashboard|Welcome|Profile/i').isVisible().catch(() => false);
    
    if (loggedIn) {
      console.log('✅ Successfully logged in');
      
      // Look for feedback button again
      const authFeedbackButton = page.locator('button:has-text("Feedback")').first();
      
      if (await authFeedbackButton.isVisible().catch(() => false)) {
        console.log('✅ Feedback button found for authenticated user');
        
        // Click feedback button
        await authFeedbackButton.click();
        await page.waitForTimeout(1000);
        
        // Fill and submit feedback
        const authModalVisible = await page.locator('h2:has-text("Feedback / Bug Report")').isVisible().catch(() => false);
        
        if (authModalVisible) {
          console.log('✅ Feedback modal opened for authenticated user');
          
          // Fill form
          const authTextareas = page.locator('textarea');
          const authTextareaCount = await authTextareas.count();
          
          if (authTextareaCount >= 1) {
            await authTextareas.nth(0).fill('Test authenticated user feedback');
          }
          
          if (authTextareaCount >= 2) {
            await authTextareas.nth(1).fill('1. Login\n2. Click feedback\n3. Submit');
          }
          
          // Select severity
          const authSeveritySelect = page.locator('select').first();
          if (await authSeveritySelect.isVisible().catch(() => false)) {
            await authSeveritySelect.selectOption('medium');
          }
          
          // Submit
          await page.locator('button:has-text("Submit")').first().click();
          console.log('⏳ Submitting authenticated feedback...');
          
          // Wait for response
          await page.waitForTimeout(3000);
          
          // Check result
          const authSuccess = await page.locator('text=/Thank you|Success|submitted/i').isVisible().catch(() => false);
          const authError = await page.locator('text=/Failed|Error|permissions/i').textContent().catch(() => null);
          
          if (authSuccess) {
            console.log('✅ Authenticated feedback submitted successfully!');
            await page.screenshot({ path: 'tests/screenshots/feedback-test-03-auth-success.png' });
          } else if (authError) {
            console.log(`❌ Authenticated feedback failed: ${authError}`);
            await page.screenshot({ path: 'tests/screenshots/feedback-test-03-auth-error.png' });
          } else {
            console.log('⚠️ No clear success or error message');
            await page.screenshot({ path: 'tests/screenshots/feedback-test-03-auth-unclear.png' });
          }
        } else {
          console.log('❌ Feedback modal did not open for authenticated user');
        }
      } else {
        console.log('❌ Feedback button not found after login');
      }
    } else {
      console.log('❌ Login failed - cannot test authenticated feedback');
      await page.screenshot({ path: 'tests/screenshots/feedback-test-login-failed.png' });
    }
    
    // --- TEST 3: Check Console for Errors ---
    console.log('\n📝 TEST 3: Console Error Check');
    console.log('==============================');
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to trigger any errors
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors detected:');
      consoleErrors.forEach(err => {
        if (err.includes('permission') || err.includes('feedback')) {
          console.log(`   - ${err}`);
        }
      });
    } else {
      console.log('✅ No console errors related to feedback');
    }
    
    // --- SUMMARY ---
    console.log('\n========================================');
    console.log('📊 FEEDBACK SUBMISSION TEST SUMMARY');
    console.log('========================================');
    console.log('Check the screenshots in tests/screenshots/ for visual confirmation');
    console.log('If any tests failed, review the error messages above');
  });
});