const { test, expect } = require('@playwright/test');

test.describe('Authenticated Issues Reproduction', () => {
  
  test('Full User Journey - Reproduce all critical issues with login', async ({ page }) => {
    console.log('🔐 Starting authenticated user journey test...');
    
    // Navigate to the app
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'tests/screenshots/auth-journey-01-initial.png', fullPage: true });
    
    console.log('📱 Testing Mobile Responsiveness on different viewports...');
    
    // Test multiple mobile viewports
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Samsung Galaxy', width: 360, height: 740 },
      { name: 'iPad Mini', width: 768, height: 1024 }
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Take screenshot
      await page.screenshot({ 
        path: `tests/screenshots/mobile-${viewport.name.replace(' ', '-').toLowerCase()}.png`, 
        fullPage: true 
      });
      
      // Check for horizontal scroll (indicates overflow)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      // Check button positioning
      const buttons = await page.locator('button').all();
      let issuesFound = [];
      
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        try {
          const button = buttons[i];
          const isVisible = await button.isVisible();
          
          if (isVisible) {
            const box = await button.boundingBox();
            if (box) {
              if (box.x + box.width > viewport.width) {
                issuesFound.push(`Button ${i} overflows viewport`);
              }
              if (box.width < 44) { // iOS minimum touch target
                issuesFound.push(`Button ${i} too small for touch (${box.width}px)`);
              }
            }
          }
        } catch (error) {
          // Skip problematic buttons
        }
      }
      
      console.log(`   ${viewport.name} Results:`);
      console.log(`   - Horizontal scroll: ${hasHorizontalScroll}`);
      console.log(`   - Issues found: ${issuesFound.length}`);
      if (issuesFound.length > 0) {
        issuesFound.forEach(issue => console.log(`     ❌ ${issue}`));
      }
    }
    
    // Reset to desktop for login testing
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('\n🔍 Attempting to access authenticated features...');
    
    // Look for login options
    const loginElements = await page.locator('button:has-text("Login"), button:has-text("Sign in"), button:has-text("Get Started")').all();
    console.log(`Found ${loginElements.length} login-related elements`);
    
    if (loginElements.length > 0) {
      console.log('🔄 Clicking login button...');
      await loginElements[0].click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'tests/screenshots/auth-journey-02-login-attempt.png' });
      
      // Check if we see a login form or Google auth
      const emailInput = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);
      const googleLogin = await page.locator('button:has-text("Google"), [class*="google"]').isVisible().catch(() => false);
      
      console.log(`   Email input visible: ${emailInput}`);
      console.log(`   Google login visible: ${googleLogin}`);
      
      if (emailInput) {
        console.log('📧 Email/password login form detected');
        console.log('ℹ️ Cannot proceed without test credentials');
      }
      
      if (googleLogin) {
        console.log('🔍 Google OAuth login detected');
        console.log('ℹ️ Cannot proceed without OAuth in test environment');
      }
      
      // Try to find demo/test mode
      const demoButtons = await page.locator('button:has-text("Demo"), button:has-text("Test"), button:has-text("Guest")').all();
      if (demoButtons.length > 0) {
        console.log('🎭 Demo mode found, attempting to use...');
        await demoButtons[0].click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'tests/screenshots/auth-journey-03-demo-mode.png' });
      }
    }
    
    console.log('\n🎯 Testing reward and quest interfaces (unauthenticated exploration)...');
    
    // Even without login, we can test the UI structure
    const allElements = await page.locator('*').all();
    let rewardRelatedFound = 0;
    let questRelatedFound = 0;
    
    for (let i = 0; i < Math.min(allElements.length, 100); i++) {
      try {
        const element = allElements[i];
        const text = await element.textContent();
        if (text) {
          const lowerText = text.toLowerCase();
          if (lowerText.includes('reward')) rewardRelatedFound++;
          if (lowerText.includes('quest') || lowerText.includes('task')) questRelatedFound++;
        }
      } catch (error) {
        // Skip problematic elements
      }
    }
    
    console.log(`   Found ${rewardRelatedFound} reward-related elements`);
    console.log(`   Found ${questRelatedFound} quest-related elements`);
    
    // Test navigation structure
    const navigationLinks = await page.locator('nav a, [role="navigation"] a, a[href]').all();
    console.log(`   Found ${navigationLinks.length} navigation links`);
    
    for (let i = 0; i < Math.min(navigationLinks.length, 10); i++) {
      try {
        const link = navigationLinks[i];
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text && text.trim()) {
          console.log(`   Navigation: "${text.trim()}" -> ${href}`);
        }
      } catch (error) {
        // Skip problematic links
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/auth-journey-04-final-state.png', fullPage: true });
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMPREHENSIVE ISSUE ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    console.log('✅ Mobile responsiveness tested across 4 viewports');
    console.log('✅ Authentication flow analyzed');
    console.log('✅ UI structure examined for reward/quest features');
    console.log('✅ Navigation structure documented');
    console.log('\n💡 Key findings will inform implementation plan');
  });

  test('Alternative Testing - Simulate logged in user behavior', async ({ page }) => {
    console.log('🎭 Simulating user interactions without authentication...');
    
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // Use browser console to simulate logged-in state if possible
    const simulatedLogin = await page.evaluate(() => {
      // Try to detect if app has any test/demo functionality
      if (window.localStorage) {
        // Check for any existing test data
        const keys = Object.keys(localStorage);
        return keys.filter(key => key.includes('demo') || key.includes('test') || key.includes('user'));
      }
      return [];
    });
    
    console.log(`Found localStorage keys: ${simulatedLogin.join(', ')}`);
    
    // Test button interactions to see what happens
    const interactiveElements = await page.locator('button, [role="button"], [tabindex="0"]').all();
    console.log(`Found ${interactiveElements.length} interactive elements`);
    
    // Test clicking various elements to see the app's behavior
    for (let i = 0; i < Math.min(interactiveElements.length, 5); i++) {
      try {
        const element = interactiveElements[i];
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const text = await element.textContent();
          if (text && !text.toLowerCase().includes('login') && !text.toLowerCase().includes('sign')) {
            console.log(`🔄 Testing interaction with: "${text.trim()}"`);
            
            // Monitor what happens when we click
            const beforeUrl = page.url();
            await element.click();
            await page.waitForTimeout(1500);
            const afterUrl = page.url();
            
            if (beforeUrl !== afterUrl) {
              console.log(`   ✅ Navigation occurred: ${afterUrl}`);
            } else {
              console.log(`   📝 No navigation - possible modal or state change`);
            }
            
            await page.screenshot({ path: `tests/screenshots/interaction-test-${i}.png` });
          }
        }
      } catch (error) {
        console.log(`   ❌ Error testing element ${i}: ${error.message}`);
      }
    }
    
    console.log('\n✅ User interaction simulation complete');
  });
});