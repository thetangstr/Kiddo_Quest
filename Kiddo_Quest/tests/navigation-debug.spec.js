const { test, expect } = require('@playwright/test');

test('Debug Navigation Issue with Console Logs', async ({ page }) => {
  console.log('🚀 Starting Navigation Debug Test');
  
  // Monitor console logs
  page.on('console', msg => {
    console.log(`Browser Console: ${msg.text()}`);
  });
  
  // Navigate to the app
  await page.goto('http://localhost:5001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Login
  console.log('📝 Logging in...');
  await page.fill('input[type="email"]', 'testadmin@example.com');
  await page.fill('input[type="password"]', 'TestAdmin123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Skip tutorial if present
  const skipTutorialBtn = page.locator('text=Skip Tutorial');
  if (await skipTutorialBtn.isVisible()) {
    console.log('⏭️ Skipping tutorial...');
    await skipTutorialBtn.click();
    await page.waitForTimeout(1000);
  }
  
  console.log('📸 Taking screenshot of dashboard...');
  await page.screenshot({ path: 'test-results/dashboard-before-click.png' });
  
  // Check store state before click
  console.log('🔍 Checking store state before click...');
  const stateBefore = await page.evaluate(() => {
    if (window.useKiddoQuestStore) {
      const state = window.useKiddoQuestStore.getState();
      return { 
        currentView: state.currentView, 
        isLoadingData: state.isLoadingData,
        currentUser: state.currentUser?.email 
      };
    }
    return null;
  });
  console.log('Store state before click:', stateBefore);
  
  // Find and click the Manage Rewards button
  const manageRewardsBtn = page.locator('button:has-text("Manage Rewards")');
  console.log('🎯 Looking for Manage Rewards button...');
  
  if (await manageRewardsBtn.isVisible()) {
    console.log('✅ Found Manage Rewards button, clicking...');
    
    // Click the button
    await manageRewardsBtn.click();
    console.log('✅ Button clicked, waiting for state change...');
    
    // Wait a moment for state to update
    await page.waitForTimeout(2000);
    
    // Check store state after click
    const stateAfter = await page.evaluate(() => {
      if (window.useKiddoQuestStore) {
        const state = window.useKiddoQuestStore.getState();
        return { 
          currentView: state.currentView, 
          isLoadingData: state.isLoadingData,
          currentUser: state.currentUser?.email 
        };
      }
      return null;
    });
    console.log('Store state after click:', stateAfter);
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/dashboard-after-click.png' });
    
    // Check if we're still on dashboard or if we navigated
    const isDashboardVisible = await page.locator('text=Parent Dashboard').isVisible();
    const isRewardManagementVisible = await page.locator('text=Manage Rewards').first().isVisible();
    
    console.log(`Dashboard still visible: ${isDashboardVisible}`);
    console.log(`Reward management visible: ${isRewardManagementVisible}`);
    
    // Try to force navigation via store if button click didn't work
    if (stateBefore?.currentView === stateAfter?.currentView) {
      console.log('⚠️ State did not change, trying direct store manipulation...');
      
      const forceNavigationResult = await page.evaluate(() => {
        if (window.useKiddoQuestStore) {
          const store = window.useKiddoQuestStore;
          console.log('Before force navigation:', store.getState().currentView);
          store.getState().navigateTo('manageRewards');
          console.log('After force navigation:', store.getState().currentView);
          return store.getState().currentView;
        }
        return null;
      });
      
      console.log('Force navigation result:', forceNavigationResult);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/after-force-navigation.png' });
    }
    
  } else {
    console.log('❌ Manage Rewards button not found');
    
    // List all buttons for debugging
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
  }
  
  console.log('🏁 Navigation debug test completed');
});
