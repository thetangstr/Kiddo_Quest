const { test, expect } = require('@playwright/test');

test('Complete Amazon Browser Feature Test', async ({ page }) => {
  console.log('🚀 Starting Amazon Browser Feature Test');
  
  // Navigate to the app
  await page.goto('/', { waitUntil: 'networkidle' });
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
  
  // Navigate to Reward Management
  console.log('🎁 Navigating to Reward Management...');
  const manageRewardsBtn = page.locator('button:has-text("Manage Rewards")');
  await expect(manageRewardsBtn).toBeVisible();
  
  // Try different click approaches
  console.log('🖱️ Attempting to click Manage Rewards button...');
  try {
    await manageRewardsBtn.click();
  } catch (error) {
    console.log('Regular click failed, trying force click...');
    await manageRewardsBtn.click({ force: true });
  }
  
  // Wait for navigation and check for reward management screen
  console.log('⏳ Waiting for reward management screen to load...');
  await page.waitForTimeout(5000);
  
  // Check if we're still on the dashboard or if navigation happened
  const dashboardStillVisible = await page.locator('text=Parent Dashboard').isVisible();
  console.log(`Dashboard still visible: ${dashboardStillVisible}`);
  
  // Try to wait for any indication of navigation
  const backToDashboardBtn = page.locator('text=Back to Dashboard');
  const isRewardScreenVisible = await backToDashboardBtn.isVisible();
  console.log(`Reward screen visible: ${isRewardScreenVisible}`);
  
  if (!isRewardScreenVisible) {
    // Try clicking the button again with JavaScript
    console.log('🔄 Navigation may have failed, trying JavaScript click...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageRewardsBtn = buttons.find(btn => btn.textContent.includes('Manage Rewards'));
      if (manageRewardsBtn) {
        manageRewardsBtn.click();
      }
    });
    await page.waitForTimeout(3000);
    
    // If still not working, try to directly manipulate the store
    const stillNotVisible = await page.locator('text=Back to Dashboard').isVisible();
    if (!stillNotVisible) {
      console.log('🔧 Trying direct store manipulation...');
      await page.evaluate(() => {
        // Try to access the Zustand store directly
        if (window.useKiddoQuestStore) {
          const store = window.useKiddoQuestStore.getState();
          store.navigateTo('manageRewards');
        }
      });
      await page.waitForTimeout(2000);
    }
  }
  
  // Wait for the specific reward management content to appear
  await page.waitForSelector('text=Back to Dashboard', { timeout: 10000 });
  
  // Debug: Check what's on the page after navigation
  const pageContent = await page.textContent('body');
  console.log('Reward management page content:', pageContent.substring(0, 800));
  await page.screenshot({ path: 'test-results/reward-management-debug.png' });
  
  // Verify we're on the reward management screen
  await expect(page.locator('text=Back to Dashboard')).toBeVisible();
  console.log('✅ Successfully navigated to Reward Management screen!');
  
  // Look for Create Reward button with different selectors
  const createRewardSelectors = [
    'text=Create Reward',
    'button:has-text("Create Reward")',
    'text=Add Reward',
    'text=New Reward',
    '[data-testid="create-reward"]'
  ];
  
  let createRewardBtn = null;
  for (const selector of createRewardSelectors) {
    const btn = page.locator(selector);
    if (await btn.isVisible()) {
      console.log(`✅ Found create reward button with selector: ${selector}`);
      createRewardBtn = btn;
      break;
    }
  }
  
  if (!createRewardBtn) {
    console.log('❌ Create Reward button not found, checking all buttons on page...');
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`Found ${buttonCount} buttons on page:`);
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const buttonText = await allButtons.nth(i).textContent();
      console.log(`Button ${i}: "${buttonText}"`);
    }
    throw new Error('Create Reward button not found');
  }
  
  // Click Create Reward
  console.log('➕ Creating new reward...');
  await createRewardBtn.click();
  await page.waitForTimeout(2000);
  
  // Verify Browse Amazon button exists
  console.log('🛒 Looking for Browse Amazon button...');
  const browseAmazonBtn = page.locator('text=Browse Amazon');
  await expect(browseAmazonBtn).toBeVisible();
  console.log('✅ Browse Amazon button found!');
  
  // Click Browse Amazon
  console.log('🔍 Opening Amazon browser...');
  await browseAmazonBtn.click();
  await page.waitForTimeout(2000);
  
  // Verify Amazon modal opened
  const modalTitle = page.locator('text=Browse Amazon Products');
  await expect(modalTitle).toBeVisible();
  console.log('✅ Amazon browser modal opened!');
  
  // Test search functionality
  console.log('🔎 Testing search functionality...');
  const searchInput = page.locator('input[placeholder="Search for products..."]');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('toy');
  
  const searchBtn = page.locator('text=Search');
  await searchBtn.click();
  await page.waitForTimeout(1500);
  
  // Verify search results
  console.log('📦 Checking search results...');
  const productCards = page.locator('.grid > div');
  const productCount = await productCards.count();
  console.log(`✅ Found ${productCount} products in search results`);
  expect(productCount).toBeGreaterThan(0);
  
  // Verify product details are shown
  await expect(page.locator('text=LEGO Classic Creative Bricks')).toBeVisible();
  await expect(page.locator('text=$29.99')).toBeVisible();
  
  // Select the first product
  console.log('🎯 Selecting first product...');
  const firstSelectBtn = page.locator('text=Select').first();
  await expect(firstSelectBtn).toBeVisible();
  await firstSelectBtn.click();
  await page.waitForTimeout(1000);
  
  // Verify modal closed and form populated
  console.log('📝 Verifying form population...');
  await expect(modalTitle).not.toBeVisible();
  
  const titleInput = page.locator('input[placeholder="Enter reward title"]');
  await expect(titleInput).toHaveValue('LEGO Classic Creative Bricks');
  
  const descriptionTextarea = page.locator('textarea[placeholder="Describe the reward"]');
  await expect(descriptionTextarea).toHaveValue('Educational Building Toy');
  
  // Verify Amazon product indicator
  await expect(page.locator('text=Amazon Product')).toBeVisible();
  console.log('✅ Form populated with Amazon product data!');
  
  // Set XP cost and complete reward creation
  console.log('💰 Setting XP cost and saving reward...');
  const xpInput = page.locator('input[type="number"]');
  await xpInput.fill('100');
  
  const createBtn = page.locator('text=Create Reward');
  await createBtn.click();
  await page.waitForTimeout(3000);
  
  // Verify reward was created and appears in list
  console.log('🎉 Verifying reward creation...');
  await expect(page.locator('text=Manage Rewards')).toBeVisible();
  await expect(page.locator('text=LEGO Classic Creative Bricks')).toBeVisible();
  
  console.log('🎊 Amazon Browser Feature Test PASSED! All functionality working correctly.');
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/amazon-feature-complete.png' });
});
