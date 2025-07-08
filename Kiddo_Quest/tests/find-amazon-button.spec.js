const { test, expect } = require('@playwright/test');

test('Find Amazon Browser Button', async ({ page }) => {
  console.log('🔍 Looking for Amazon Browser Button');
  
  // Navigate to the app
  await page.goto('http://localhost:5001', { waitUntil: 'networkidle' });
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
  
  // Force navigate to reward form directly
  console.log('🎯 Navigating directly to reward form...');
  await page.evaluate(() => {
    if (window.useKiddoQuestStore) {
      window.useKiddoQuestStore.getState().navigateTo('rewardForm');
    }
  });
  await page.waitForTimeout(3000);
  
  // Take screenshot of reward form
  await page.screenshot({ path: 'test-results/reward-form-direct.png' });
  
  // Look for Browse Amazon button
  const browseAmazonBtn = page.locator('button:has-text("Browse Amazon")');
  const isVisible = await browseAmazonBtn.isVisible();
  console.log('Browse Amazon button visible:', isVisible);
  
  if (isVisible) {
    console.log('✅ Found Browse Amazon button!');
    // Click it to test
    await browseAmazonBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/amazon-modal-opened.png' });
    
    // Check if modal opened
    const modal = page.locator('div[role="dialog"]:has-text("Browse Amazon Products")');
    const modalVisible = await modal.isVisible();
    console.log('Amazon modal opened:', modalVisible);
    
    if (modalVisible) {
      console.log('🎉 Amazon Browser Modal is working!');
    }
  } else {
    console.log('❌ Browse Amazon button not found');
    
    // Check if there's already an image
    const existingImage = await page.locator('img[alt="Reward"]').isVisible();
    console.log('Existing image present:', existingImage);
    
    // If there's an image, remove it to show the buttons
    if (existingImage) {
      console.log('🗑️ Removing existing image to show buttons...');
      const removeBtn = page.locator('button:has(svg)').filter({ hasText: '' }).first();
      if (await removeBtn.isVisible()) {
        await removeBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/after-image-removal.png' });
        
        // Now check for Browse Amazon button again
        const browseAmazonBtn2 = page.locator('button:has-text("Browse Amazon")');
        const isVisible2 = await browseAmazonBtn2.isVisible();
        console.log('Browse Amazon button visible after image removal:', isVisible2);
      }
    }
    
    // List all buttons for debugging
    const allButtons = await page.locator('button').all();
    console.log(`\nFound ${allButtons.length} buttons on page:`);
    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      const classes = await allButtons[i].getAttribute('class');
      console.log(`Button ${i}: "${text}" (classes: ${classes})`);
    }
  }
  
  console.log('🏁 Amazon button search completed');
});
