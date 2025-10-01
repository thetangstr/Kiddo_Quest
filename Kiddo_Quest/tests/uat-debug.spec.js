const { test, expect } = require('@playwright/test');

test.describe('KiddoQuest Beta Login Debug', () => {
  const TEST_EMAIL = 'test1756412395505@kiddoquest.com';
  const TEST_PASSWORD = 'TestKiddo123!';
  const BETA_URL = 'https://kiddo-quest-beta.web.app';

  test('Debug login process step by step', async ({ page }) => {
    console.log('=== LOGIN DEBUG TEST ===');
    
    // Capture console logs
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.text());
    });
    
    // Capture network failures
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('NETWORK ERROR:', response.status(), response.url());
      }
    });

    console.log('1. Navigating to beta site...');
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/debug-01-initial.png' });
    console.log('   Screenshot saved: debug-01-initial.png');
    
    console.log('2. Looking for form elements...');
    const emailInput = page.locator('input[placeholder*="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Sign In with Email")');
    
    // Verify elements exist
    const emailVisible = await emailInput.isVisible();
    const passwordVisible = await passwordInput.isVisible(); 
    const buttonVisible = await loginButton.isVisible();
    
    console.log('   Email input visible:', emailVisible);
    console.log('   Password input visible:', passwordVisible);
    console.log('   Login button visible:', buttonVisible);
    
    if (!emailVisible || !passwordVisible || !buttonVisible) {
      throw new Error('Required form elements not found');
    }
    
    console.log('3. Filling in credentials...');
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    
    // Verify fields were filled
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    console.log('   Email filled:', emailValue);
    console.log('   Password filled (length):', passwordValue.length);
    
    // Take screenshot after filling
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/debug-02-filled.png' });
    console.log('   Screenshot saved: debug-02-filled.png');
    
    console.log('4. Clicking login button...');
    await loginButton.click();
    
    // Wait a moment and see what happens
    await page.waitForTimeout(2000);
    
    // Take screenshot immediately after click
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/debug-03-after-click.png' });
    console.log('   Screenshot saved: debug-03-after-click.png');
    
    console.log('5. Checking for error messages...');
    // Look for error messages
    const errorSelectors = [
      'div:has-text("error")',
      'div:has-text("failed")',
      'div:has-text("invalid")',
      'span:has-text("error")',
      '[class*="error"]',
      'div[role="alert"]'
    ];
    
    for (const selector of errorSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        const text = await element.first().textContent();
        console.log('   Found error element:', selector, '-> text:', text);
      }
    }
    
    console.log('6. Waiting longer for potential navigation...');
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
    
    // Final screenshot
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/debug-04-final.png' });
    console.log('   Screenshot saved: debug-04-final.png');
    
    console.log('7. Checking current URL and page content...');
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log('   Current URL:', currentUrl);
    console.log('   Page title:', pageTitle);
    
    // Check if we can find dashboard indicators
    const dashboardElements = [
      'text="Parent Dashboard"',
      'text="Dashboard"',
      'text="Alice"',
      'text="Bob"',
      'text="Logout"',
      'text="Manage Quests"',
      'text="Manage Rewards"'
    ];
    
    console.log('8. Looking for dashboard elements...');
    for (const selector of dashboardElements) {
      const element = page.locator(selector);
      const visible = await element.isVisible().catch(() => false);
      if (visible) {
        console.log('   ✓ Found dashboard element:', selector);
      }
    }
    
    // Check if still on login page
    const stillOnLoginPage = await emailInput.isVisible().catch(() => false);
    console.log('   Still on login page:', stillOnLoginPage);
    
    console.log('=== DEBUG TEST COMPLETE ===');
  });
});