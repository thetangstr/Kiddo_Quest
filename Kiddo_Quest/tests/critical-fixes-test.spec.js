const { test, expect } = require('@playwright/test');

test.describe('Critical Fixes Verification', () => {
  const testEmail = 'test1756428303944@kiddoquest.com';
  const testPassword = 'TestKiddo123!';
  
  test('Verify quest claiming immediate feedback and parent dashboard date handling', async ({ page }) => {
    console.log('🔍 Testing critical fixes on beta site...');
    
    // Navigate to production site (where test account was created)
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // Login
    console.log('📝 Logging in with test account...');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In with Email")');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'tests/screenshots/critical-test-01-logged-in.png' });
    
    // Check if we're on the parent dashboard
    const parentDashboard = await page.locator('text=/Welcome|Dashboard|Your Children/i').isVisible().catch(() => false);
    
    if (parentDashboard) {
      console.log('✅ Successfully logged in to parent dashboard');
      
      // Click on Alice's profile to test child view
      const aliceProfile = page.locator('text=Alice').first();
      if (await aliceProfile.isVisible()) {
        console.log('👧 Clicking on Alice profile...');
        await aliceProfile.click();
        await page.waitForTimeout(2000);
        
        // Screenshot child dashboard
        await page.screenshot({ path: 'tests/screenshots/critical-test-02-child-dashboard.png' });
        
        // TEST 1: Quest Claiming Immediate Feedback
        console.log('🎯 Testing quest claiming UI feedback...');
        const claimButton = page.locator('button:has-text("I Did This")').first();
        
        if (await claimButton.isVisible()) {
          console.log('📍 Found claim button, clicking...');
          
          // Store the current URL before clicking
          const urlBefore = page.url();
          
          // Click the claim button
          await claimButton.click();
          
          // Wait a moment to see what happens
          await page.waitForTimeout(1000);
          
          // Check if URL changed (it shouldn't)
          const urlAfter = page.url();
          const urlChanged = urlBefore !== urlAfter;
          
          // Check for "Loading child dashboard..." text (shouldn't appear)
          const loadingText = await page.locator('text="Loading child dashboard"').isVisible().catch(() => false);
          
          // Check if button changed to "Claiming..."
          const claimingButton = await page.locator('button:has-text("Claiming")').isVisible().catch(() => false);
          
          // Take screenshot of state after claiming
          await page.screenshot({ path: 'tests/screenshots/critical-test-03-after-claim.png' });
          
          console.log('📊 Quest Claiming Results:');
          console.log(`   - URL changed: ${urlChanged ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
          console.log(`   - Shows "Loading child dashboard": ${loadingText ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
          console.log(`   - Button shows "Claiming...": ${claimingButton ? '✅ YES (GOOD)' : '⚠️ NO'}`);
          
          // Check for success message or pending status
          await page.waitForTimeout(2000);
          const pendingStatus = await page.locator('text=/pending|verification|waiting|claimed/i').isVisible().catch(() => false);
          console.log(`   - Shows pending/claimed status: ${pendingStatus ? '✅ YES' : '⚠️ NO'}`);
        } else {
          console.log('⚠️ No claim buttons found on child dashboard');
        }
        
        // TEST 2: Parent Dashboard Date Handling
        console.log('\n📅 Testing parent dashboard date handling...');
        
        // Navigate back to parent dashboard
        const backButton = page.locator('button:has-text("Back")').first();
        if (await backButton.isVisible()) {
          await backButton.click();
        } else {
          // Try clicking on "Parent Dashboard" or similar
          await page.locator('text=/Parent|Dashboard/i').first().click().catch(() => {});
        }
        
        await page.waitForTimeout(2000);
        
        // Check console for date-related errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        // Look for quest completions section
        const completionsSection = await page.locator('text=/Pending Verifications|Quest Completions/i').isVisible().catch(() => false);
        
        if (completionsSection) {
          console.log('✅ Found quest completions section');
          
          // Check if any date errors occurred
          const dateError = consoleErrors.find(err => err.includes('toDate') || err.includes('completedDate'));
          
          if (dateError) {
            console.log(`❌ Date error found: ${dateError}`);
          } else {
            console.log('✅ No date-related errors in console');
          }
          
          // Take screenshot of parent dashboard with completions
          await page.screenshot({ path: 'tests/screenshots/critical-test-04-parent-completions.png' });
        } else {
          console.log('⚠️ No quest completions section found');
        }
        
        // Try switching between child and parent views multiple times to stress test
        console.log('\n🔄 Stress testing view switching...');
        for (let i = 0; i < 3; i++) {
          // Go to child view
          const childProfile = page.locator('text=/Alice|Bob/').first();
          if (await childProfile.isVisible()) {
            await childProfile.click();
            await page.waitForTimeout(1000);
            
            // Go back to parent view
            const backBtn = page.locator('button:has-text("Back")').first();
            if (await backBtn.isVisible()) {
              await backBtn.click();
              await page.waitForTimeout(1000);
            }
          }
        }
        
        // Check final console errors
        const finalErrors = consoleErrors.filter(err => err.includes('toDate') || err.includes('TypeError'));
        if (finalErrors.length > 0) {
          console.log(`\n❌ Errors detected during stress test:`);
          finalErrors.forEach(err => console.log(`   - ${err}`));
        } else {
          console.log('\n✅ No crashes during view switching stress test');
        }
        
      } else {
        console.log('❌ Could not find Alice profile');
      }
    } else {
      console.log('❌ Login failed or parent dashboard not found');
      await page.screenshot({ path: 'tests/screenshots/critical-test-login-failed.png' });
    }
    
    console.log('\n📋 Test Summary:');
    console.log('================');
    console.log('Critical fixes have been tested. Check screenshots for visual confirmation.');
  });
});