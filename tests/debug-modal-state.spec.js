const { test, expect } = require('@playwright/test');

test('Debug Modal State', async ({ page }) => {
  console.log('🐛 Debugging Modal State');
  
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
  
  // Add debugging to the page
  await page.evaluate(() => {
    // Add debug logging to React components
    const originalConsoleLog = console.log;
    window.debugAmazonModal = true;
    
    // Override setState for debugging
    const originalSetState = React.useState;
    console.log('Debug mode enabled for Amazon modal');
  });
  
  // Check initial state
  const initialModalCount = await page.locator('[role="dialog"]').count();
  console.log('Initial modal count:', initialModalCount);
  
  // Find Browse Amazon button
  const browseAmazonBtn = page.locator('button').filter({ hasText: 'Browse Amazon' });
  const buttonVisible = await browseAmazonBtn.isVisible();
  console.log('Button visible:', buttonVisible);
  
  if (buttonVisible) {
    // Take screenshot before click
    await page.screenshot({ path: 'test-results/before-click-debug.png' });
    
    // Click with force and wait
    console.log('🖱️ Clicking button...');
    await browseAmazonBtn.click({ force: true });
    
    // Wait and check multiple times
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(500);
      const modalCount = await page.locator('[role="dialog"]').count();
      const fixedCount = await page.locator('.fixed').count();
      console.log(`Check ${i + 1}: Modals=${modalCount}, Fixed=${fixedCount}`);
      
      if (modalCount > 0) {
        console.log('✅ Modal appeared!');
        break;
      }
    }
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/after-click-debug.png' });
    
    // Check for any JavaScript errors
    const jsErrors = await page.evaluate(() => {
      return window.jsErrors || [];
    });
    console.log('JS Errors:', jsErrors);
    
    // Try to manually trigger the modal
    console.log('🔧 Manually triggering modal...');
    await page.evaluate(() => {
      // Try to find and trigger the modal state directly
      const reactRoot = document.querySelector('#root');
      if (reactRoot && reactRoot._reactInternalFiber) {
        console.log('React root found, attempting to trigger modal');
      }
      
      // Alternative: try to trigger via DOM
      const button = document.querySelector('button:has-text("Browse Amazon")');
      if (button) {
        console.log('Button found, triggering click event');
        button.click();
      }
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/manual-trigger-debug.png' });
    
    const finalModalCount = await page.locator('[role="dialog"]').count();
    console.log('Final modal count:', finalModalCount);
  }
  
  console.log('🏁 Debug completed');
});
