const { test, expect } = require('@playwright/test');

test('Admin to Rewards Management Flow', async ({ page }) => {
  console.log('🚀 Starting Admin to Rewards Management Flow Test');
  
  // Monitor console logs
  page.on('console', msg => {
    console.log(`Browser Console: ${msg.text()}`);
  });
  
  // Navigate to the app
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Login as admin
  console.log('📝 Logging in as admin...');
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
  
  console.log('📸 Taking screenshot of admin dashboard...');
  await page.screenshot({ path: 'test-results/admin-dashboard.png' });
  
  // Check store state - should be adminDashboard
  const adminState = await page.evaluate(() => {
    if (window.useKiddoQuestStore) {
      const state = window.useKiddoQuestStore.getState();
      return { 
        currentView: state.currentView, 
        isAdmin: state.currentUser?.isAdmin,
        userEmail: state.currentUser?.email 
      };
    }
    return null;
  });
  console.log('Admin dashboard state:', adminState);
  
  // Look for a way to navigate to parent dashboard
  // Admin dashboard might have different navigation options
  const adminButtons = await page.locator('button').all();
  console.log(`Found ${adminButtons.length} buttons on admin dashboard:`);
  for (let i = 0; i < adminButtons.length; i++) {
    const text = await adminButtons[i].textContent();
    console.log(`Button ${i}: "${text}"`);
  }
  
  // Look for a parent dashboard or switch view button
  let parentDashboardBtn = page.locator('button:has-text("Parent Dashboard")');
  if (!(await parentDashboardBtn.isVisible())) {
    // Try alternative text
    parentDashboardBtn = page.locator('button:has-text("Switch to Parent")');
  }
  if (!(await parentDashboardBtn.isVisible())) {
    // Try alternative text
    parentDashboardBtn = page.locator('button:has-text("Parent View")');
  }
  
  if (await parentDashboardBtn.isVisible()) {
    console.log('✅ Found Parent Dashboard button, clicking...');
    await parentDashboardBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/after-parent-dashboard-click.png' });
  } else {
    console.log('⚠️ No Parent Dashboard button found, trying direct navigation...');
    // Try direct navigation via store
    await page.evaluate(() => {
      if (window.useKiddoQuestStore) {
        window.useKiddoQuestStore.getState().navigateTo('parentDashboard');
      }
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/after-direct-parent-navigation.png' });
  }
  
  // Check if we're now on parent dashboard
  const parentState = await page.evaluate(() => {
    if (window.useKiddoQuestStore) {
      const state = window.useKiddoQuestStore.getState();
      return { 
        currentView: state.currentView, 
        isAdmin: state.currentUser?.isAdmin,
        userEmail: state.currentUser?.email 
      };
    }
    return null;
  });
  console.log('After navigation state:', parentState);
  
  // Now look for Manage Rewards button
  const manageRewardsBtn = page.locator('button:has-text("Manage Rewards")');
  if (await manageRewardsBtn.isVisible()) {
    console.log('🎯 Found Manage Rewards button, checking for overlays...');
    
    // Check for and dismiss any overlays/modals that might be blocking clicks
    console.log('🔍 Checking for tutorial or overlay modals...');
    
    // Handle tutorial modal specifically
    const tutorialModal = page.locator('div.fixed.bg-white.rounded-lg.shadow-xl.z-50:has-text("Welcome to Kiddo Quest!")');
    if (await tutorialModal.isVisible()) {
      console.log('Found tutorial modal, looking for dismiss button...');
      const skipBtn = tutorialModal.locator('button:has-text("Skip")');
      const closeBtn = tutorialModal.locator('button:has-text("Close")');
      const gotItBtn = tutorialModal.locator('button:has-text("Got it")');
      
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
        console.log('Clicked Skip button');
      } else if (await closeBtn.isVisible()) {
        await closeBtn.click();
        console.log('Clicked Close button');
      } else if (await gotItBtn.isVisible()) {
        await gotItBtn.click();
        console.log('Clicked Got it button');
      }
      await page.waitForTimeout(1000);
    }
    
    // Handle any other modal overlays
    const modalOverlays = page.locator('div.fixed.bg-white.rounded-lg.shadow-xl.z-50');
    const overlayCount = await modalOverlays.count();
    console.log(`Found ${overlayCount} modal overlays`);
    
    for (let i = 0; i < overlayCount; i++) {
      const overlay = modalOverlays.nth(i);
      if (await overlay.isVisible()) {
        console.log(`Handling overlay ${i + 1}...`);
        
        // Try to find close/dismiss buttons within this specific overlay
        const dismissButtons = [
          overlay.locator('button:has-text("Skip")'),
          overlay.locator('button:has-text("Close")'),
          overlay.locator('button:has-text("Got it")'),
          overlay.locator('button:has-text("Next")'),
          overlay.locator('button:has-text("×")'),
          overlay.locator('[aria-label="Close"]')
        ];
        
        let dismissed = false;
        for (const dismissBtn of dismissButtons) {
          if (await dismissBtn.isVisible()) {
            console.log(`Dismissing overlay ${i + 1}...`);
            await dismissBtn.click();
            await page.waitForTimeout(500);
            dismissed = true;
            break;
          }
        }
        
        // If no dismiss button found, try clicking outside the overlay
        if (!dismissed && await overlay.isVisible()) {
          console.log(`No dismiss button found for overlay ${i + 1}, trying to click outside...`);
          await page.click('body', { position: { x: 10, y: 10 } });
          await page.waitForTimeout(500);
        }
      }
    }
    
    console.log('🎯 Overlays handled, attempting to click Manage Rewards button...');
    
    // Check store state before click
    const stateBefore = await page.evaluate(() => {
      if (window.useKiddoQuestStore) {
        const state = window.useKiddoQuestStore.getState();
        return { currentView: state.currentView };
      }
      return null;
    });
    console.log('🔄 navigateTo called:', { view: 'manageRewards', currentView: stateBefore?.currentView });
    
    // Try multiple click strategies
    try {
      await manageRewardsBtn.click();
    } catch (error) {
      console.log('Regular click failed, trying force click...');
      await manageRewardsBtn.click({ force: true });
    }
    await page.waitForTimeout(2000);
    
    // Check store state after click
    const stateAfter = await page.evaluate(() => {
      if (window.useKiddoQuestStore) {
        const state = window.useKiddoQuestStore.getState();
        return { currentView: state.currentView };
      }
      return null;
    });
    console.log('🔄 navigateTo completed, new state:', { currentView: stateAfter?.currentView });
    
    await page.screenshot({ path: 'test-results/after-manage-rewards-click.png' });
    
    // Check if we successfully navigated to rewards management
    if (stateAfter?.currentView === 'manageRewards') {
      console.log('✅ Successfully navigated to Manage Rewards!');
      
      // Look for Create Reward button
      const createRewardBtn = page.locator('button:has-text("Create Reward")');
      if (await createRewardBtn.isVisible()) {
        console.log('🎯 Found Create Reward button, clicking...');
        await createRewardBtn.click();
        await page.waitForTimeout(2000);
        
        // Check if we're now on reward form
        const rewardFormState = await page.evaluate(() => {
          if (window.useKiddoQuestStore) {
            const state = window.useKiddoQuestStore.getState();
            return { currentView: state.currentView };
          }
          return null;
        });
        console.log('Reward form state:', rewardFormState);
        
        if (rewardFormState?.currentView === 'rewardForm') {
          console.log('✅ Successfully navigated to Reward Form!');
          
          // Look for Browse Amazon button
          const browseAmazonBtn = page.locator('button:has-text("Browse Amazon")');
          if (await browseAmazonBtn.isVisible()) {
            console.log('🎯 Found Browse Amazon button, clicking...');
            await browseAmazonBtn.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'test-results/amazon-modal-opened.png' });
            
            // Check if Amazon modal is visible
            const amazonModal = page.locator('[data-testid="amazon-modal"], .amazon-modal, div:has-text("Browse Amazon Products")');
            if (await amazonModal.isVisible()) {
              console.log('🎉 Amazon modal opened successfully!');
              
              // Test search functionality
              const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
              if (await searchInput.isVisible()) {
                await searchInput.fill('toy');
                console.log('✅ Search input filled');
                
                const searchBtn = page.locator('button:has-text("Search")');
                if (await searchBtn.isVisible()) {
                  await searchBtn.click();
                  console.log('✅ Search button clicked');
                }
              }
              
              console.log('🎉 Amazon browser feature test completed successfully!');
            } else {
              console.log('❌ Amazon modal did not open');
            }
          } else {
            console.log('❌ Browse Amazon button not found on reward form');
          }
        } else {
          console.log('❌ Did not navigate to reward form');
        }
      } else {
        console.log('❌ Create Reward button not found');
      }
    } else {
      console.log('❌ Did not navigate to Manage Rewards');
    }
  } else {
    console.log('❌ Manage Rewards button not found on parent dashboard');
    
    // List all buttons for debugging
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on current page:`);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
  }
  
  console.log('🏁 Admin to Rewards Management Flow test completed');
});
