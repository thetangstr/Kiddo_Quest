const { test, expect } = require('@playwright/test');

test('Debug Amazon Modal Opening', async ({ page }) => {
  console.log('🐛 Debugging Amazon Modal Opening');
  
  // Monitor console logs and errors
  page.on('console', msg => {
    console.log(`Browser Console: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`Page Error: ${error.message}`);
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
  const tutorialModal = page.locator('div.fixed.bg-white.rounded-lg.shadow-xl.z-50:has-text("Welcome to Kiddo Quest!")');
  if (await tutorialModal.isVisible()) {
    const skipBtn = tutorialModal.locator('button:has-text("Skip")');
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
  
  // Check the state before clicking
  const preClickState = await page.evaluate(() => {
    return {
      modalElements: document.querySelectorAll('[role="dialog"]').length,
      amazonModalElements: document.querySelectorAll('div:has-text("Browse Amazon")').length,
      allModals: Array.from(document.querySelectorAll('.fixed')).map(el => el.textContent?.substring(0, 50))
    };
  });
  console.log('Pre-click state:', preClickState);
  
  // Take screenshot before clicking
  await page.screenshot({ path: 'test-results/before-amazon-click.png' });
  
  // Find and click Browse Amazon button
  const browseAmazonBtn = page.locator('button:has-text("Browse Amazon")');
  console.log('Browse Amazon button visible:', await browseAmazonBtn.isVisible());
  
  if (await browseAmazonBtn.isVisible()) {
    console.log('🖱️ Clicking Browse Amazon button...');
    
    // Check the button's onclick handler
    const buttonInfo = await browseAmazonBtn.evaluate(btn => ({
      onclick: btn.onclick?.toString(),
      attributes: Array.from(btn.attributes).map(attr => `${attr.name}="${attr.value}"`),
      textContent: btn.textContent
    }));
    console.log('Button info:', buttonInfo);
    
    // Click the button
    await browseAmazonBtn.click();
    await page.waitForTimeout(2000);
    
    // Check state after clicking
    const postClickState = await page.evaluate(() => {
      return {
        modalElements: document.querySelectorAll('[role="dialog"]').length,
        amazonModalElements: document.querySelectorAll('div:has-text("Browse Amazon")').length,
        allModals: Array.from(document.querySelectorAll('.fixed')).map(el => el.textContent?.substring(0, 50)),
        amazonModalVisible: document.querySelector('div:has-text("Browse Amazon Rewards")') !== null
      };
    });
    console.log('Post-click state:', postClickState);
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'test-results/after-amazon-click.png' });
    
    // Check for specific modal selectors
    const modalSelectors = [
      'div[role="dialog"]',
      '.fixed.inset-0.z-50',
      'div:has-text("Browse Amazon Rewards")',
      'div:has-text("Search Amazon products")'
    ];
    
    for (const selector of modalSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible();
      console.log(`Selector "${selector}" visible:`, isVisible);
      if (isVisible) {
        const text = await element.textContent();
        console.log(`Content: ${text?.substring(0, 100)}...`);
      }
    }
    
    // Check the React component state
    const reactState = await page.evaluate(() => {
      if (window.useKiddoQuestStore) {
        const state = window.useKiddoQuestStore.getState();
        return {
          currentView: state.currentView,
          isLoadingData: state.isLoadingData
        };
      }
      return null;
    });
    console.log('React state:', reactState);
    
  } else {
    console.log('❌ Browse Amazon button not found');
  }
  
  console.log('🏁 Debug completed');
});
