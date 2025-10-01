const { test, expect } = require('@playwright/test');

test.describe('Debug Child Navigation', () => {
  test('Debug why child dashboard is not loading', async ({ page }) => {
    console.log('\n🔍 DEBUGGING CHILD DASHBOARD NAVIGATION');
    console.log('='.repeat(50));
    
    // Navigate to app
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // Login with test account
    const testEmail = 'test1756485868624@kiddoquest.com';
    const testPassword = 'TestKiddo123!';
    
    console.log('1️⃣ Logging in...');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In with Email")');
    await page.waitForTimeout(3000);
    
    // Check if logged in
    const dashboard = await page.locator('text=/Dashboard|Welcome/i').first().isVisible().catch(() => false);
    if (dashboard) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed');
      return;
    }
    
    // Look for child profiles
    console.log('\n2️⃣ Looking for child profiles...');
    const aliceProfile = page.locator('text=Alice').first();
    const bobProfile = page.locator('text=Bob').first();
    
    const aliceVisible = await aliceProfile.isVisible().catch(() => false);
    const bobVisible = await bobProfile.isVisible().catch(() => false);
    
    console.log(`Alice visible: ${aliceVisible ? '✅' : '❌'}`);
    console.log(`Bob visible: ${bobVisible ? '✅' : '❌'}`);
    
    // Find and click View Dashboard button
    console.log('\n3️⃣ Looking for View Dashboard button...');
    const viewDashboardButtons = page.locator('button:has-text("View Dashboard")');
    const buttonCount = await viewDashboardButtons.count();
    console.log(`Found ${buttonCount} View Dashboard button(s)`);
    
    if (buttonCount > 0) {
      // Monitor console for errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Take screenshot before clicking
      await page.screenshot({ path: 'tests/screenshots/debug-before-click.png' });
      
      console.log('\n4️⃣ Clicking View Dashboard button...');
      await viewDashboardButtons.first().click();
      
      // Wait and check what happens
      await page.waitForTimeout(3000);
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'tests/screenshots/debug-after-click.png' });
      
      // Check current URL
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Check what's visible now
      console.log('\n5️⃣ Checking what loaded...');
      
      const possibleElements = [
        { name: 'Child Dashboard', selector: 'text=/XP|Level|Quest/i' },
        { name: 'Back Button', selector: 'button:has-text("Back")' },
        { name: 'Loading Spinner', selector: 'text=/Loading/i' },
        { name: 'PIN Modal', selector: 'text=/PIN|Enter.*PIN/i' },
        { name: 'Error Message', selector: 'text=/Error|Failed/i' },
        { name: 'Parent Dashboard Still', selector: 'text=/Your Children/i' },
        { name: 'Quest Section', selector: 'text=/Active Quests/i' },
        { name: 'Reward Section', selector: 'text=/Available Rewards/i' }
      ];
      
      for (const element of possibleElements) {
        const visible = await page.locator(element.selector).first().isVisible().catch(() => false);
        console.log(`${element.name}: ${visible ? '✅ VISIBLE' : '❌ not visible'}`);
      }
      
      // Check console errors
      if (consoleErrors.length > 0) {
        console.log('\n⚠️ Console Errors:');
        consoleErrors.forEach(err => console.log(`  - ${err}`));
      }
      
      // Try to understand the state
      console.log('\n6️⃣ Analyzing state...');
      
      // Check if we're still on parent dashboard
      const stillOnParent = await page.locator('text=/Your Children/i').isVisible().catch(() => false);
      if (stillOnParent) {
        console.log('❌ ISSUE: Still on parent dashboard - navigation did not occur');
        
        // Check if selectedChildIdForDashboard was set
        const storeState = await page.evaluate(() => {
          if (window.useKiddoQuestStore) {
            const state = window.useKiddoQuestStore.getState();
            return {
              currentView: state.currentView,
              selectedChildId: state.selectedChildIdForDashboard,
              isLoadingData: state.isLoadingData
            };
          }
          return null;
        });
        
        if (storeState) {
          console.log('\nStore State:');
          console.log(`  currentView: ${storeState.currentView}`);
          console.log(`  selectedChildId: ${storeState.selectedChildId}`);
          console.log(`  isLoadingData: ${storeState.isLoadingData}`);
        }
      } else {
        const onChildDash = await page.locator('text=/XP|Level/i').first().isVisible().catch(() => false);
        if (onChildDash) {
          console.log('✅ Successfully navigated to child dashboard!');
        } else {
          console.log('❓ In unknown state - not parent, not child dashboard');
        }
      }
    } else {
      console.log('❌ No View Dashboard buttons found');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('Debug complete. Check screenshots in tests/screenshots/');
  });
});