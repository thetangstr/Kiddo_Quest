const { test, expect } = require('@playwright/test');

test('Quick quest claiming test with fresh account', async ({ page }) => {
  const PROD_URL = 'https://kiddo-quest-de7b0.web.app';
  const TEST_EMAIL = 'test1756364941770@kiddoquest.com';
  const TEST_PASSWORD = 'TestKiddo123!';
  
  console.log('🚀 Quick quest test with:', TEST_EMAIL);
  
  // Go to production site
  await page.goto(PROD_URL);
  await page.waitForLoadState('networkidle');
  
  // Login
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'tests/screenshots/quick-01-after-login.png' });
  
  // Check if logged in
  const loggedIn = await page.locator('text=/Alice|Bob|Dashboard/i').isVisible({ timeout: 10000 }).catch(() => false);
  console.log('Login successful:', loggedIn);
  
  if (loggedIn) {
    // Click on Alice
    const alice = page.locator('text=Alice').first();
    if (await alice.isVisible({ timeout: 5000 })) {
      await alice.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'tests/screenshots/quick-02-alice-dashboard.png' });
      
      // Look for claim buttons
      const claimButtons = page.locator('button:has-text("I Did This")');
      const count = await claimButtons.count();
      console.log('Claim buttons found:', count);
      
      if (count > 0) {
        console.log('Clicking first claim button...');
        await claimButtons.first().click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'tests/screenshots/quick-03-after-claim.png' });
        
        // Check for any notification
        const notification = await page.locator('text=/claimed|failed|success|error|waiting|pending/i').textContent().catch(() => 'No notification');
        console.log('Notification:', notification);
        
        if (notification.toLowerCase().includes('failed') || notification.toLowerCase().includes('error')) {
          console.log('❌ QUEST CLAIMING FAILED:', notification);
        } else if (notification.toLowerCase().includes('claimed') || notification.toLowerCase().includes('success') || notification.toLowerCase().includes('waiting')) {
          console.log('✅ QUEST CLAIMING SUCCESS:', notification);
        } else {
          console.log('⚠️ UNCLEAR RESULT:', notification);
        }
      } else {
        console.log('⚠️ No claim buttons found');
      }
    }
  }
});
