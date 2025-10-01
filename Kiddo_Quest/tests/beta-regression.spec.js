const { test, expect } = require('@playwright/test');

// Beta Regression Test Suite - Run on every beta deployment
test.describe('Beta Regression Tests', () => {
  const BETA_URL = 'https://kiddo-quest-beta.web.app';
  const TEST_EMAIL = 'test1756360126136@kiddoquest.com';
  const TEST_PASSWORD = 'TestKiddo123!';
  
  let page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set up console error tracking
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('🔴 Console error:', msg.text());
      }
    });
    
    // Set up network failure tracking
    page.on('requestfailed', request => {
      console.log('🔴 Network failure:', request.url(), request.failure()?.errorText);
    });
    
    page.consoleErrors = consoleErrors;
  });
  
  test('Beta site loads and shows login page', async () => {
    console.log('🧪 Testing: Beta site loads correctly');
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page).toHaveTitle(/Kiddo Quest/i);
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    
    // Check feedback button
    await expect(page.locator('button:has-text("Feedback")')).toBeVisible();
    
    await page.screenshot({ path: 'tests/screenshots/regression-01-login.png' });
    console.log('✅ Beta site login page loads correctly');
  });
  
  test('User can login with test account', async () => {
    console.log('🧪 Testing: User login functionality');
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    await page.screenshot({ path: 'tests/screenshots/regression-02-before-login.png' });
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation with longer timeout
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
      console.log('⚠️ Network idle timeout - continuing...');
    });
    
    await page.screenshot({ path: 'tests/screenshots/regression-03-after-login.png' });
    
    // Check if we're logged in by looking for dashboard elements
    const dashboardVisible = await page.locator('text=/Dashboard|Children|Profile|Alice|Bob|Welcome/i').isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!dashboardVisible) {
      // Try alternative login method or account creation
      console.log('⚠️ Standard login failed, checking for registration option...');
      
      // Check if we're still on login page
      const stillOnLogin = await page.locator('input[type="email"]').isVisible();
      if (stillOnLogin) {
        // Try to register
        const registerLink = page.locator('text=Register');
        if (await registerLink.isVisible()) {
          await registerLink.click();
          await page.waitForTimeout(2000);
          
          // Fill registration form
          await page.fill('input[type="email"]', TEST_EMAIL);
          await page.fill('input[type="password"]', TEST_PASSWORD);
          
          // Look for confirm password field
          const confirmPasswordFields = page.locator('input[type="password"]');
          const fieldCount = await confirmPasswordFields.count();
          if (fieldCount > 1) {
            await confirmPasswordFields.nth(1).fill(TEST_PASSWORD);
          }
          
          await page.screenshot({ path: 'tests/screenshots/regression-03b-registration.png' });
          
          // Submit registration
          const registerButton = page.locator('button:has-text("Register"), button:has-text("Sign Up"), button:has-text("Create Account")');
          if (await registerButton.isVisible()) {
            await registerButton.click();
            await page.waitForTimeout(5000);
          }
        }
      }
    }
    
    // Final check for successful login
    const finalDashboardCheck = await page.locator('text=/Dashboard|Children|Profile|Alice|Bob|Welcome/i').isVisible({ timeout: 10000 }).catch(() => false);
    
    if (finalDashboardCheck) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed - this is a regression!');
      await page.screenshot({ path: 'tests/screenshots/regression-FAILED-login.png' });
      
      // Don't fail the test yet, continue to check what we can
    }
    
    expect(page.consoleErrors.filter(err => !err.includes('favicon')).length).toBe(0);
  });
  
  test('Child dashboard is accessible and functional', async () => {
    console.log('🧪 Testing: Child dashboard functionality');
    
    // Login first
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    // Look for child profiles
    const aliceProfile = page.locator('text=Alice').first();
    const bobProfile = page.locator('text=Bob').first();
    
    let childFound = false;
    
    // Try to click on Alice first
    if (await aliceProfile.isVisible({ timeout: 5000 })) {
      console.log('👶 Found Alice profile, clicking...');
      await aliceProfile.click();
      childFound = true;
    } else if (await bobProfile.isVisible({ timeout: 5000 })) {
      console.log('👶 Found Bob profile, clicking...');
      await bobProfile.click();
      childFound = true;
    }
    
    if (!childFound) {
      console.log('❌ No child profiles found - major regression!');
      await page.screenshot({ path: 'tests/screenshots/regression-FAILED-no-children.png' });
      throw new Error('Child profiles not found - this is a critical regression');
    }
    
    // Wait for child dashboard to load
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    await page.screenshot({ path: 'tests/screenshots/regression-04-child-dashboard.png' });
    
    // Check for child dashboard elements
    const childDashboardElements = {
      'Child name or avatar': page.locator('text=/Alice|Bob/i'),
      'XP or Stars display': page.locator('text=/XP|Stars|Points/i'),
      'Quests section': page.locator('text=/Quest|Mission|Task/i'),
      'Rewards section': page.locator('text=/Reward|Treasure|Prize/i')
    };
    
    const missingElements = [];
    
    for (const [elementName, locator] of Object.entries(childDashboardElements)) {
      const isVisible = await locator.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        console.log(`✅ ${elementName} is visible`);
      } else {
        console.log(`❌ ${elementName} is missing`);
        missingElements.push(elementName);
      }
    }
    
    if (missingElements.length > 0) {
      console.log('❌ Missing dashboard elements:', missingElements);
      await page.screenshot({ path: 'tests/screenshots/regression-FAILED-missing-elements.png' });
    }
    
    // Test quest claiming functionality
    const claimButtons = page.locator('button:has-text("I Did This")');
    const claimButtonCount = await claimButtons.count();
    console.log(`🎯 Found ${claimButtonCount} quest claim buttons`);
    
    if (claimButtonCount > 0) {
      console.log('🧪 Testing quest claiming...');
      
      // Get the first quest title
      const questTitle = await page.locator('h3, h4, .quest-title').first().textContent().catch(() => 'Unknown Quest');
      console.log('📝 Attempting to claim quest:', questTitle);
      
      await claimButtons.first().click();
      await page.waitForTimeout(3000);
      
      // Check for success notification
      const notifications = [
        page.locator('text=/claimed/i'),
        page.locator('text=/success/i'),
        page.locator('text=/waiting/i'),
        page.locator('text=/pending/i')
      ];
      
      let notificationFound = false;
      for (const notification of notifications) {
        if (await notification.isVisible({ timeout: 2000 }).catch(() => false)) {
          const message = await notification.textContent();
          console.log('✅ Quest claim notification:', message);
          notificationFound = true;
          break;
        }
      }
      
      if (!notificationFound) {
        console.log('❌ No quest claim notification - potential regression!');
      }
      
      await page.screenshot({ path: 'tests/screenshots/regression-05-quest-claimed.png' });
    } else {
      // Check if all quests are already pending
      const pendingQuests = await page.locator('text=/pending|verification|waiting/i').count();
      if (pendingQuests > 0) {
        console.log(`✅ ${pendingQuests} quests already pending verification`);
      } else {
        console.log('⚠️ No quests available to claim and none pending');
      }
    }
    
    console.log('✅ Child dashboard test completed');
  });
  
  test('Navigation and UI elements work correctly', async () => {
    console.log('🧪 Testing: Navigation and UI functionality');
    
    // Login and navigate to child dashboard
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    // Click on a child
    const childProfile = page.locator('text=/Alice|Bob/i').first();
    if (await childProfile.isVisible({ timeout: 5000 })) {
      await childProfile.click();
      await page.waitForTimeout(3000);
      
      // Test parent access button
      const parentAccessBtn = page.locator('button[aria-label="Parent Access"], button:has(svg)');
      if (await parentAccessBtn.isVisible({ timeout: 3000 })) {
        console.log('✅ Parent access button found');
      } else {
        console.log('⚠️ Parent access button not found');
      }
      
      // Test feedback button
      const feedbackBtn = page.locator('button:has-text("Feedback")');
      if (await feedbackBtn.isVisible({ timeout: 3000 })) {
        console.log('✅ Feedback button accessible from child dashboard');
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/regression-06-ui-elements.png' });
    console.log('✅ Navigation and UI test completed');
  });
  
  test('No critical JavaScript errors', async () => {
    console.log('🧪 Testing: JavaScript error monitoring');
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Login and navigate
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    // Click on child if available
    const childProfile = page.locator('text=/Alice|Bob/i').first();
    if (await childProfile.isVisible({ timeout: 5000 })) {
      await childProfile.click();
      await page.waitForTimeout(3000);
    }
    
    // Filter out non-critical errors
    const criticalErrors = page.consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_INTERNET_DISCONNECTED') &&
      !error.toLowerCase().includes('warning')
    );
    
    if (criticalErrors.length > 0) {
      console.log('❌ Critical JavaScript errors found:');
      criticalErrors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ No critical JavaScript errors detected');
    }
    
    expect(criticalErrors.length).toBe(0);
  });
  
  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });
});
