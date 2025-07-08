const { test, expect } = require('@playwright/test');

test('Manual Navigation to Amazon Browser', async ({ page }) => {
  console.log('🚀 Starting Manual Navigation Test');
  
  // Monitor console logs
  page.on('console', msg => {
    console.log(`Browser Console: ${msg.text()}`);
  });
  
  // Navigate to the app
  await page.goto('http://localhost:5001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Login as admin
  console.log('📝 Logging in as admin...');
  await page.fill('input[type="email"]', 'testadmin@example.com');
  await page.fill('input[type="password"]', 'TestAdmin123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Handle tutorial modal if present
  const tutorialModal = page.locator('div.fixed.bg-white.rounded-lg.shadow-xl.z-50:has-text("Welcome to Kiddo Quest!")');
  if (await tutorialModal.isVisible()) {
    console.log('Dismissing tutorial modal...');
    const skipBtn = tutorialModal.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }
  }
  
  console.log('📸 Taking screenshot of current state...');
  await page.screenshot({ path: 'test-results/current-state.png' });
  
  // Check current view
  const currentState = await page.evaluate(() => {
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
  console.log('Current state:', currentState);
  
  // Navigate to parent dashboard if on admin dashboard
  if (currentState?.currentView === 'adminDashboard') {
    console.log('🔄 Navigating to parent dashboard...');
    await page.evaluate(() => {
      if (window.useKiddoQuestStore) {
        window.useKiddoQuestStore.getState().navigateTo('parentDashboard');
      }
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/parent-dashboard.png' });
  }
  
  // Look for Manage Rewards button
  const manageRewardsBtn = page.locator('button:has-text("Manage Rewards")');
  if (await manageRewardsBtn.isVisible()) {
    console.log('✅ Found Manage Rewards button, clicking...');
    await manageRewardsBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/manage-rewards.png' });
  } else {
    console.log('❌ Manage Rewards button not found');
    // List all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
  }
  
  // Look for Create Reward button
  const createRewardBtn = page.locator('button:has-text("Create Reward")');
  if (await createRewardBtn.isVisible()) {
    console.log('✅ Found Create Reward button, clicking...');
    await createRewardBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/reward-form.png' });
    
    // Look for Browse Amazon button
    const browseAmazonBtn = page.locator('button:has-text("Browse Amazon")');
    if (await browseAmazonBtn.isVisible()) {
      console.log('🎯 Found Browse Amazon button!');
      await page.screenshot({ path: 'test-results/amazon-button-found.png' });
    } else {
      console.log('❌ Browse Amazon button not found');
      // Check if there's an image already selected
      const currentImage = await page.locator('img[alt="Reward"]').isVisible();
      console.log('Current image present:', currentImage);
      
      // List all buttons on the form
      const formButtons = await page.locator('button').all();
      console.log(`Found ${formButtons.length} buttons on form:`);
      for (let i = 0; i < formButtons.length; i++) {
        const text = await formButtons[i].textContent();
        console.log(`Form Button ${i}: "${text}"`);
      }
    }
  } else {
    console.log('❌ Create Reward button not found');
  }
  
  console.log('🏁 Manual navigation test completed');
});
