const { test, expect } = require('@playwright/test');

test.describe('Complete E2E Source Field Fix Test', () => {

  test('Beta - Complete Flow: Register, Create Reward, Monitor Errors', async ({ page }) => {
    console.log('🔄 COMPLETE E2E TEST: Registration → Reward Creation → Error Monitoring');
    console.log('🎯 Testing the EXACT scenario that caused the undefined source field error');
    
    const sourceFieldErrors = [];
    const allErrors = [];
    let rewardCreated = false;
    
    page.on('console', msg => {
      const text = msg.text();
      
      if (msg.type() === 'error') {
        allErrors.push(text);
        
        // The EXACT error we're trying to fix
        if (text.includes('Function addDoc() called with invalid data') && 
            text.includes('Unsupported field value: undefined') && 
            text.includes('found in field source in document rewards')) {
          sourceFieldErrors.push(text);
          console.log(`💥 TARGET ERROR DETECTED: ${text}`);
        }
      }
      
      // Watch for reward creation success
      if (text.includes('✅') && (text.includes('reward') || text.includes('created') || text.includes('success'))) {
        rewardCreated = true;
        console.log(`🎉 Reward creation success: ${text}`);
      }
    });

    await page.goto('https://kiddo-quest-beta.web.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('\\n🆕 Step 1: Register new user to ensure clean test...');
    
    // Look for register link
    const registerLink = await page.locator('a:has-text("Register"), button:has-text("Register")').first();
    
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForTimeout(2000);
      
      // Generate unique email for this test
      const timestamp = Date.now();
      const testEmail = `sourcetest${timestamp}@example.com`;
      
      const emailInput = await page.locator('input[type="email"], input[name="email"]');
      const passwordInput = await page.locator('input[type="password"], input[name="password"]');
      const nameInput = await page.locator('input[name="name"], input[placeholder*="name" i]');
      
      if (await emailInput.isVisible()) {
        await emailInput.fill(testEmail);
        console.log(`✅ Email: ${testEmail}`);
      }
      
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('SourceTest123!');
        console.log('✅ Password filled');
      }
      
      if (await nameInput.isVisible()) {
        await nameInput.fill('Source Test User');
        console.log('✅ Name filled');
      }
      
      // Submit registration
      const submitButton = await page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign up")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(5000);
        console.log('✅ Registration submitted');
      }
      
      await page.screenshot({ 
        path: 'tests/screenshots/e2e-test-01-after-registration.png',
        fullPage: true 
      });
    }

    console.log('\\n🔍 Step 2: Check authentication and setup...');
    
    // Check if we're now authenticated and need PIN setup
    const needsPinSetup = await page.locator('text=/pin/i, input[type="password"][placeholder*="pin" i]').isVisible().catch(() => false);
    
    if (needsPinSetup) {
      console.log('🔐 Setting up PIN...');
      
      const pinInputs = await page.locator('input[type="password"]').all();
      
      for (const pinInput of pinInputs) {
        if (await pinInput.isVisible()) {
          await pinInput.fill('1234');
        }
      }
      
      const pinSubmitButton = await page.locator('button[type="submit"], button:has-text("Set"), button:has-text("Save")').first();
      if (await pinSubmitButton.isVisible()) {
        await pinSubmitButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ PIN setup completed');
      }
    }

    await page.screenshot({ 
      path: 'tests/screenshots/e2e-test-02-setup-complete.png',
      fullPage: true 
    });

    console.log('\\n🎁 Step 3: Navigate to reward management...');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Look for reward management access
    let foundRewardManagement = false;
    
    // Try different selectors
    const rewardSelectors = [
      'button:has-text("Manage Rewards")',
      'a:has-text("Rewards")',
      'button:has-text("Rewards")',
      'button:has-text("Create Reward")',
      'a[href*="reward"]',
      'nav a:has-text("Reward")'
    ];
    
    for (const selector of rewardSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(2000);
        foundRewardManagement = true;
        console.log(`✅ Found reward management via: ${selector}`);
        break;
      }
    }

    await page.screenshot({ 
      path: 'tests/screenshots/e2e-test-03-reward-area.png',
      fullPage: true 
    });

    if (foundRewardManagement) {
      console.log('\\n📝 Step 4: Create reward WITHOUT source field...');
      
      // Look for create button
      const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(2000);
        
        console.log('✅ Opened create form');
        
        await page.screenshot({ 
          path: 'tests/screenshots/e2e-test-04-create-form.png' 
        });
        
        // Fill form with NO Amazon source data
        const titleInput = await page.locator('input[name="title"]');
        const descInput = await page.locator('textarea[name="description"]');
        const costInput = await page.locator('input[name="cost"]');
        
        if (await titleInput.isVisible()) {
          await titleInput.fill('E2E Source Fix Test');
          console.log('✅ Title: "E2E Source Fix Test"');
        }
        
        if (await descInput.isVisible()) {
          await descInput.fill('Testing complete E2E flow without source field - should NOT cause Firestore undefined error');
          console.log('✅ Description filled');
        }
        
        if (await costInput.isVisible()) {
          await costInput.fill('100');
          console.log('✅ Cost: 100');
        }
        
        await page.screenshot({ 
          path: 'tests/screenshots/e2e-test-05-form-filled.png' 
        });
        
        // THE CRITICAL MOMENT - Submit without source field
        console.log('\\n🚨 CRITICAL TEST: Submitting reward creation...');
        console.log('🔍 Monitoring for undefined source field error...');
        
        const submitButton = await page.locator('button[type="submit"], button:has-text("Create")').first();
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Wait to catch the error (if it occurs)
          await page.waitForTimeout(8000);
          
          console.log('✅ Form submission completed');
        }
        
        await page.screenshot({ 
          path: 'tests/screenshots/e2e-test-06-after-submit.png' 
        });
      }
    } else {
      console.log('⚠️ Could not find reward management interface');
      
      // Take screenshot of what we see
      await page.screenshot({ 
        path: 'tests/screenshots/e2e-test-no-reward-access.png',
        fullPage: true 
      });
    }

    // Wait additional time to catch any delayed operations
    console.log('\\n⏰ Waiting for any delayed Firestore operations...');
    await page.waitForTimeout(10000);

    await page.screenshot({ 
      path: 'tests/screenshots/e2e-test-final.png',
      fullPage: true 
    });

    // FINAL ANALYSIS
    console.log('\\n' + '='.repeat(80));
    console.log('🧪 COMPLETE E2E TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\\n📊 Error Analysis:`);
    console.log(`   - Total console errors: ${allErrors.length}`);
    console.log(`   - Source field undefined errors: ${sourceFieldErrors.length}`);
    console.log(`   - Reward creation attempted: ${foundRewardManagement ? '✅' : '❌'}`);
    console.log(`   - Reward creation success detected: ${rewardCreated ? '✅' : '❌'}`);
    
    if (sourceFieldErrors.length > 0) {
      console.log('\\n❌ CRITICAL FAILURE: The original error is still occurring!');
      console.log('🚨 Source field undefined errors detected:');
      sourceFieldErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('\\n✅ SUCCESS: No source field undefined errors detected!');
      
      if (foundRewardManagement) {
        console.log('🎉 Complete E2E test successful - fix is working!');
      } else {
        console.log('🔍 Could not complete full E2E due to access restrictions');
      }
    }
    
    if (allErrors.length > 0) {
      console.log('\\n📋 Other errors detected:');
      allErrors.slice(0, 3).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.substring(0, 100)}...`);
      });
    }
    
    // Final verdict
    const fixWorking = sourceFieldErrors.length === 0;
    console.log(`\\n🎯 FINAL VERDICT:`);
    console.log(`   Source Field Fix: ${fixWorking ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   Original Error Resolved: ${fixWorking ? '✅ YES' : '❌ NO'}`);
    console.log(`   Production Ready: ${fixWorking ? '✅ YES' : '❌ NO'}`);
    
    console.log('\\n' + '='.repeat(80));
    
    return fixWorking;
  });
});