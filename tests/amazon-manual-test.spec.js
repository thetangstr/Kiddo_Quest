const { test, expect } = require('@playwright/test');

test('Manual Amazon Browser Test - Direct Access', async ({ page }) => {
  console.log('🚀 Starting Manual Amazon Browser Test');
  
  // Monitor console logs for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Console Error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('💥 Page Error:', error.message);
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
  
  console.log('📸 Taking screenshot of current state...');
  await page.screenshot({ path: 'test-results/manual-test-dashboard.png' });
  
  // Try to directly navigate to reward form using URL manipulation or store
  console.log('🔧 Attempting direct navigation to reward form...');
  await page.evaluate(() => {
    // Try to access the store and navigate directly
    if (window.useKiddoQuestStore) {
      const store = window.useKiddoQuestStore.getState();
      console.log('Store found, current view:', store.currentView);
      store.navigateTo('rewardForm');
    } else {
      console.log('Store not found on window');
    }
  });
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/after-direct-navigation.png' });
  
  // Check if we're now on the reward form
  const rewardFormVisible = await page.locator('text=Browse Amazon').isVisible();
  console.log(`Reward form visible: ${rewardFormVisible}`);
  
  if (rewardFormVisible) {
    console.log('✅ Successfully accessed reward form! Testing Amazon browser...');
    
    // Click Browse Amazon
    await page.click('text=Browse Amazon');
    await page.waitForTimeout(2000);
    
    // Check if Amazon modal opened
    const modalTitle = page.locator('text=Browse Amazon Products');
    if (await modalTitle.isVisible()) {
      console.log('✅ Amazon browser modal opened successfully!');
      
      // Test search
      await page.fill('input[placeholder="Search for products..."]', 'toy');
      await page.click('text=Search');
      await page.waitForTimeout(1500);
      
      // Check for products
      const productCards = page.locator('.grid > div');
      const productCount = await productCards.count();
      console.log(`✅ Found ${productCount} products`);
      
      if (productCount > 0) {
        // Select first product
        await page.click('text=Select');
        await page.waitForTimeout(1000);
        
        // Check if form was populated
        const titleInput = page.locator('input[placeholder="Enter reward title"]');
        const titleValue = await titleInput.inputValue();
        console.log(`✅ Form populated with: ${titleValue}`);
        
        if (titleValue.length > 0) {
          console.log('🎉 Amazon browser feature is working correctly!');
        }
      }
      
      await page.screenshot({ path: 'test-results/amazon-feature-working.png' });
    } else {
      console.log('❌ Amazon modal did not open');
    }
  } else {
    console.log('❌ Could not access reward form');
    
    // Let's try the manage rewards approach one more time with more debugging
    console.log('🔄 Trying manage rewards navigation again...');
    
    // First, let's see what buttons are available
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`Found ${buttonCount} buttons on page:`);
    
    for (let i = 0; i < Math.min(buttonCount, 15); i++) {
      const buttonText = await allButtons.nth(i).textContent();
      console.log(`Button ${i}: "${buttonText}"`);
    }
    
    // Try clicking manage rewards again
    const manageRewardsBtn = page.locator('button:has-text("Manage Rewards")');
    if (await manageRewardsBtn.isVisible()) {
      console.log('🎯 Found Manage Rewards button, clicking...');
      
      // Check store state before click
      const stateBefore = await page.evaluate(() => {
        if (window.useKiddoQuestStore) {
          const state = window.useKiddoQuestStore.getState();
          return { currentView: state.currentView, isLoadingData: state.isLoadingData };
        }
        return null;
      });
      console.log('Store state before click:', stateBefore);
      
      await manageRewardsBtn.click();
      await page.waitForTimeout(5000);
      
      // Check store state after click
      const stateAfter = await page.evaluate(() => {
        if (window.useKiddoQuestStore) {
          const state = window.useKiddoQuestStore.getState();
          return { currentView: state.currentView, isLoadingData: state.isLoadingData };
        }
        return null;
      });
      console.log('Store state after click:', stateAfter);
      
      // Check what happened
      const pageContent = await page.textContent('body');
      console.log('Page content after click:', pageContent.substring(0, 500));
      
      await page.screenshot({ path: 'test-results/after-manage-rewards-click.png' });
    }
  }
  
  console.log('🏁 Manual test completed');
});
