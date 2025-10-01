const { test, expect } = require('@playwright/test');

test.describe('Critical Issues Reproduction', () => {
  
  test('Issue #1: Mobile Responsiveness - Buttons overflow screen', async ({ page }) => {
    console.log('🔍 Testing mobile responsiveness issues...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    // Navigate to the app
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-responsive-01-initial.png', fullPage: true });
    
    // Check if buttons overflow or are cut off
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on page`);
    
    let overflowingButtons = 0;
    const viewport = page.viewportSize();
    
    for (let i = 0; i < buttons.length; i++) {
      try {
        const button = buttons[i];
        const isVisible = await button.isVisible();
        
        if (isVisible) {
          const box = await button.boundingBox();
          if (box) {
            const isOverflowing = box.x + box.width > viewport.width;
            if (isOverflowing) {
              overflowingButtons++;
              console.log(`❌ Button ${i} overflows: x=${box.x}, width=${box.width}, viewport=${viewport.width}`);
            }
          }
        }
      } catch (error) {
        // Skip buttons that can't be measured
      }
    }
    
    // Check text size issues
    const textElements = await page.locator('p, span, div').all();
    let smallTextElements = 0;
    
    for (let i = 0; i < Math.min(textElements.length, 20); i++) {
      try {
        const element = textElements[i];
        const fontSize = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return parseFloat(style.fontSize);
        });
        
        if (fontSize < 14) { // Considered too small for mobile
          smallTextElements++;
          console.log(`❌ Small text found: ${fontSize}px`);
        }
      } catch (error) {
        // Skip elements that can't be measured
      }
    }
    
    console.log(`\n📊 Mobile Responsiveness Results:`);
    console.log(`   Overflowing buttons: ${overflowingButtons}`);
    console.log(`   Small text elements: ${smallTextElements}`);
    
    // This issue is confirmed if we have overflowing elements
    const hasResponsivenessIssues = overflowingButtons > 0 || smallTextElements > 0;
    console.log(`\n${hasResponsivenessIssues ? '❌ CONFIRMED' : '✅ NOT REPRODUCED'}: Mobile responsiveness issues`);
    
    await page.screenshot({ path: 'tests/screenshots/mobile-responsive-02-analysis.png', fullPage: true });
  });

  test('Issue #2: Reward Update Broken - Nothing happens when clicking update', async ({ page }) => {
    console.log('🔍 Testing reward update functionality...');
    
    // Navigate to the app
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/reward-update-01-initial.png' });
    
    // Try to access reward management (need to be logged in first)
    // Check if we need to login
    const loginButton = await page.locator('button:has-text("Login"), button:has-text("Sign in")').first();
    const isLoginVisible = await loginButton.isVisible().catch(() => false);
    
    if (isLoginVisible) {
      console.log('ℹ️ Not logged in - cannot test reward update without authentication');
      console.log('💡 This test requires valid user credentials to reproduce the issue');
      return;
    }
    
    // Look for reward-related elements
    const rewardButtons = await page.locator('button:has-text("Reward"), a:has-text("Reward"), button:has-text("Manage Reward")').all();
    console.log(`Found ${rewardButtons.length} reward-related buttons`);
    
    if (rewardButtons.length > 0) {
      await rewardButtons[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/reward-update-02-rewards-page.png' });
      
      // Look for existing rewards to update
      const updateButtons = await page.locator('button:has-text("Update"), button:has-text("Edit"), button:has-text("Modify")').all();
      console.log(`Found ${updateButtons.length} update/edit buttons`);
      
      if (updateButtons.length > 0) {
        console.log('🔄 Attempting to click update button...');
        
        // Listen for any network requests
        const requests = [];
        page.on('request', request => requests.push({
          url: request.url(),
          method: request.method()
        }));
        
        // Click the update button
        await updateButtons[0].click();
        await page.waitForTimeout(3000);
        
        // Check if anything happened
        await page.screenshot({ path: 'tests/screenshots/reward-update-03-after-click.png' });
        
        console.log(`📡 Network requests made: ${requests.length}`);
        requests.forEach(req => console.log(`   ${req.method} ${req.url}`));
        
        // Check for any modal, form, or page change
        const modalExists = await page.locator('[role="dialog"], .modal, .popup').isVisible().catch(() => false);
        const formExists = await page.locator('form input, textarea').isVisible().catch(() => false);
        
        console.log(`\n📊 Update Button Click Results:`);
        console.log(`   Modal opened: ${modalExists}`);
        console.log(`   Form visible: ${formExists}`);
        console.log(`   Network requests: ${requests.length}`);
        
        const isUpdateWorking = modalExists || formExists || requests.length > 0;
        console.log(`\n${isUpdateWorking ? '✅ WORKING' : '❌ CONFIRMED BUG'}: Reward update functionality`);
      } else {
        console.log('ℹ️ No existing rewards found to update');
      }
    } else {
      console.log('ℹ️ No reward management interface found');
    }
  });

  test('Issue #3: Quest Claiming Fails - Claim request fails', async ({ page }) => {
    console.log('🔍 Testing quest claiming functionality...');
    
    // Navigate to the app
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/quest-claim-01-initial.png' });
    
    // Check authentication status
    const loginButton = await page.locator('button:has-text("Login"), button:has-text("Sign in")').first();
    const isLoginVisible = await loginButton.isVisible().catch(() => false);
    
    if (isLoginVisible) {
      console.log('ℹ️ Not logged in - cannot test quest claiming without authentication');
      console.log('💡 This test requires valid user credentials to reproduce the issue');
      return;
    }
    
    // Look for quest-related elements
    const questElements = await page.locator('button:has-text("Quest"), a:has-text("Quest"), button:has-text("Claim")').all();
    console.log(`Found ${questElements.length} quest-related elements`);
    
    // Look for claim buttons specifically
    const claimButtons = await page.locator('button:has-text("Claim"), input[value*="Claim"]').all();
    console.log(`Found ${claimButtons.length} claim buttons`);
    
    if (claimButtons.length > 0) {
      console.log('🎯 Attempting to claim a quest...');
      
      // Monitor network requests
      const requests = [];
      const errors = [];
      
      page.on('request', request => requests.push({
        url: request.url(),
        method: request.method()
      }));
      
      page.on('response', response => {
        if (!response.ok()) {
          errors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });
      
      // Click claim button
      await claimButtons[0].click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'tests/screenshots/quest-claim-02-after-claim.png' });
      
      // Check for success/error messages
      const successMessage = await page.locator(':has-text("success"), :has-text("claimed"), :has-text("completed")').isVisible().catch(() => false);
      const errorMessage = await page.locator(':has-text("error"), :has-text("failed"), :has-text("try again")').isVisible().catch(() => false);
      
      console.log(`\n📊 Quest Claim Results:`);
      console.log(`   Success message shown: ${successMessage}`);
      console.log(`   Error message shown: ${errorMessage}`);
      console.log(`   Network requests: ${requests.length}`);
      console.log(`   Failed requests: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log('❌ Network errors detected:');
        errors.forEach(err => console.log(`   ${err.status} ${err.statusText} - ${err.url}`));
      }
      
      const isClaimWorking = successMessage && !errorMessage && errors.length === 0;
      console.log(`\n${isClaimWorking ? '✅ WORKING' : '❌ CONFIRMED BUG'}: Quest claiming functionality`);
    } else {
      console.log('ℹ️ No claimable quests found on this page');
      
      // Try to navigate to quests page
      const questNavigation = await page.locator('a:has-text("Quest"), button:has-text("Quest")').first();
      if (await questNavigation.isVisible().catch(() => false)) {
        await questNavigation.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'tests/screenshots/quest-claim-03-quests-page.png' });
        
        const questPageClaimButtons = await page.locator('button:has-text("Claim")').all();
        console.log(`Found ${questPageClaimButtons.length} claim buttons on quests page`);
      }
    }
  });

  test('Test Suite Summary - Critical Issues Analysis', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('📋 CRITICAL ISSUES REPRODUCTION SUMMARY');
    console.log('='.repeat(80));
    
    // This test just provides a summary - actual testing done in previous tests
    console.log('✅ Completed reproduction tests for:');
    console.log('   1. Mobile Responsiveness Issues');
    console.log('   2. Reward Update Broken');
    console.log('   3. Quest Claiming Failures');
    
    console.log('\n💡 Next steps:');
    console.log('   - Review screenshots for visual confirmation');
    console.log('   - Analyze console logs for specific errors');
    console.log('   - Create implementation plan based on findings');
    console.log('   - Prioritize fixes by user impact');
    
    console.log('\n🎯 Implementation Priority:');
    console.log('   1. Fix mobile responsiveness (affects all mobile users)');
    console.log('   2. Fix reward update functionality (core feature)');
    console.log('   3. Fix quest claiming issues (core feature)');
    
    console.log('\n' + '='.repeat(80));
  });
});