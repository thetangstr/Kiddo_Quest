const { test, expect } = require('@playwright/test');

test('Simple Amazon Modal Test', async ({ page }) => {
  console.log('🔍 Simple Amazon Modal Test');
  
  // Monitor console logs and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  // Navigate to the app
  await page.goto('http://localhost:5001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Login as admin
  await page.fill('input[type="email"]', 'testadmin@example.com');
  await page.fill('input[type="password"]', 'TestAdmin123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Handle tutorial modal
  const tutorialModal = page.locator('div.fixed.bg-white.rounded-lg.shadow-xl.z-50').filter({ hasText: 'Welcome to Kiddo Quest!' });
  if (await tutorialModal.isVisible()) {
    const skipBtn = tutorialModal.locator('button').filter({ hasText: 'Skip' });
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }
  }
  
  // Navigate directly to reward form
  console.log('🎯 Navigating to reward form...');
  await page.evaluate(() => {
    if (window.useKiddoQuestStore) {
      window.useKiddoQuestStore.getState().navigateTo('rewardForm');
    }
  });
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/reward-form-state.png' });
  
  // Find Browse Amazon button
  const browseAmazonBtn = page.locator('button').filter({ hasText: 'Browse Amazon' });
  const isVisible = await browseAmazonBtn.isVisible();
  console.log('✅ Browse Amazon button visible:', isVisible);
  
  if (isVisible) {
    console.log('🖱️ Clicking Browse Amazon button...');
    await browseAmazonBtn.click();
    await page.waitForTimeout(2000);
    
    // Look for modal with multiple approaches
    const modalByRole = page.locator('[role="dialog"]');
    const modalByClass = page.locator('.fixed.inset-0.z-50');
    const modalByText = page.locator('div').filter({ hasText: 'Browse Amazon Rewards' });
    
    const modalByRoleVisible = await modalByRole.isVisible();
    const modalByClassVisible = await modalByClass.isVisible();
    const modalByTextVisible = await modalByText.isVisible();
    
    console.log('Modal by role visible:', modalByRoleVisible);
    console.log('Modal by class visible:', modalByClassVisible);
    console.log('Modal by text visible:', modalByTextVisible);
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/after-amazon-button-click.png' });
    
    // Check if any modal elements exist
    const modalCount = await page.locator('.fixed').count();
    console.log('Total fixed elements:', modalCount);
    
    if (modalCount > 0) {
      console.log('📋 Fixed elements found:');
      for (let i = 0; i < modalCount; i++) {
        const element = page.locator('.fixed').nth(i);
        const text = await element.textContent();
        const classes = await element.getAttribute('class');
        console.log(`Element ${i}: "${text?.substring(0, 50)}..." (classes: ${classes})`);
      }
    }
    
    // If modal opened, try to interact with it
    if (modalByRoleVisible || modalByClassVisible || modalByTextVisible) {
      console.log('🎉 Modal opened successfully!');
      
      // Try to find search input
      const searchInput = page.locator('input[placeholder*="Search Amazon"]');
      if (await searchInput.isVisible()) {
        console.log('✅ Found search input');
        await searchInput.fill('toy');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/amazon-search-results.png' });
      }
    } else {
      console.log('❌ Modal did not open');
    }
    
  } else {
    console.log('❌ Browse Amazon button not found');
    
    // List all buttons for debugging
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons:`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const text = await allButtons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
  }
  
  console.log('🏁 Test completed');
});
