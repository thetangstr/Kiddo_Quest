const { test, expect } = require('@playwright/test');

test('Test Amazon Modal with Debug Logging', async ({ page }) => {
  console.log('🐛 Testing Amazon Modal with Debug Logging');
  
  // Monitor console logs
  page.on('console', msg => {
    console.log(`Browser: ${msg.text()}`);
  });
  
  // Navigate to the app
  await page.goto('/', { waitUntil: 'networkidle' });
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
  
  // Look for the Browse Amazon button
  const browseAmazonBtn = page.locator('button').filter({ hasText: 'Browse Amazon' });
  const buttonVisible = await browseAmazonBtn.isVisible();
  console.log('✅ Browse Amazon button visible:', buttonVisible);
  
  if (buttonVisible) {
    console.log('🖱️ Clicking Browse Amazon button...');
    await browseAmazonBtn.click();
    
    // Wait a bit for the state to update
    await page.waitForTimeout(3000);
    
    // Check if modal appeared
    const modal = page.locator('[role="dialog"]').first();
    const modalVisible = await modal.isVisible();
    console.log('🎭 Modal visible after click:', modalVisible);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-test-result.png' });
    
    if (modalVisible) {
      console.log('🎉 SUCCESS: Amazon modal is working!');
      
      // Test search functionality
      const searchInput = page.locator('input[placeholder*="Search Amazon"]');
      if (await searchInput.isVisible()) {
        console.log('🔍 Testing search...');
        await searchInput.fill('toy');
        
        const searchBtn = page.locator('button').filter({ hasText: 'Search' });
        if (await searchBtn.isVisible()) {
          await searchBtn.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'test-results/search-results.png' });
        }
      }
    } else {
      console.log('❌ Modal did not appear - checking for issues...');
      
      // Check for any error messages
      const errorElements = await page.locator('.text-red-500, .bg-red-50').count();
      console.log('Error elements found:', errorElements);
    }
  }
  
  console.log('🏁 Debug test completed');
});
