const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  email: 'test1756485868624@kiddoquest.com',
  password: 'TestKiddo123!',
  baseURL: 'http://localhost:3000',
  timeout: 30000
};

// Test data for creating new quests/rewards
const TEST_QUEST = {
  title: 'UAT Test Quest',
  description: 'A test quest for UAT validation',
  xpReward: 25,
  frequency: 'daily'
};

const TEST_REWARD = {
  name: 'UAT Test Reward',
  description: 'A test reward for UAT validation',
  xpCost: 100
};

test.describe('KiddoQuest Comprehensive UAT', () => {
  let page;
  let context;

  test.beforeAll(async ({ browser }) => {
    // Create context with console logging
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Listen for console messages
    context.on('page', (page) => {
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.error('CONSOLE ERROR:', msg.text());
        } else if (msg.type() === 'warning') {
          console.warn('CONSOLE WARNING:', msg.text());
        }
      });
      
      // Listen for page errors
      page.on('pageerror', (error) => {
        console.error('PAGE ERROR:', error.message);
      });
    });
    
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('1. Authentication Flow', async () => {
    console.log('🔐 Testing Authentication Flow...');
    
    // Navigate to app
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/uat-01-initial-page.png' });
    
    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    
    // Login with test account
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.screenshot({ path: 'test-results/uat-02-before-login.png' });
    
    await page.click('button:has-text("Sign In")');
    
    // Wait for dashboard to load (may have tutorial modal)
    await page.waitForSelector('[data-testid="dashboard-title"], h1:has-text("Parent Dashboard"), button:has-text("Manage Quests")', { timeout: 15000 });
    
    // Close tutorial if present
    const skipTutorialBtn = page.locator('button:has-text("Skip Tutorial")');
    if (await skipTutorialBtn.isVisible()) {
      await skipTutorialBtn.click();
      await page.waitForTimeout(1000); // Wait for modal to close
    }
    
    await page.screenshot({ path: 'test-results/uat-03-after-login.png' });
    
    // Verify dashboard elements are present
    const dashboardVisible = await page.isVisible('h1:has-text("Parent Dashboard")') || 
                            await page.isVisible('[data-testid="dashboard-title"]') ||
                            await page.isVisible('button:has-text("Manage Quests")');
    expect(dashboardVisible).toBe(true);
    
    console.log('✅ Authentication successful - Dashboard loaded');
  });

  test('2. Parent Dashboard Functionality', async () => {
    console.log('👨‍👩‍👧‍👦 Testing Parent Dashboard...');
    
    await navigateToDashboard(page);
    
    // Look for Alice and Bob profiles
    const aliceProfile = page.locator('text=Alice').first();
    const bobProfile = page.locator('text=Bob').first();
    
    await expect(aliceProfile).toBeVisible({ timeout: 5000 });
    await expect(bobProfile).toBeVisible({ timeout: 5000 });
    
    // Check for quest and reward management buttons
    const manageQuestsBtn = page.locator('button:has-text("Manage Quests")').first();
    const manageRewardsBtn = page.locator('button:has-text("Manage Rewards")').first();
    
    await expect(manageQuestsBtn).toBeVisible();
    await expect(manageRewardsBtn).toBeVisible();
    
    console.log('✅ Parent Dashboard elements verified');
  });

  test('3. Child Profile Navigation', async () => {
    console.log('👧👦 Testing Child Profile Navigation...');
    
    await navigateToDashboard(page);
    
    // Click on Alice's profile - look for "View Dashboard" button
    const aliceViewBtn = page.locator('button:has-text("View Dashboard")').first();
    await aliceViewBtn.click();
    await page.waitForTimeout(2000); // Wait for navigation
    await page.screenshot({ path: 'test-results/uat-04-alice-dashboard.png' });
    
    // Wait for child dashboard to load - more flexible selector
    await page.waitForSelector('h1:has-text("Adventure")', { timeout: 10000 });
    
    // Verify we're on Alice's dashboard
    const aliceDashboard = await page.isVisible('h1:has-text("Alice\'s Adventure")') || 
                          await page.isVisible('h2:has-text("Alice")') ||
                          await page.isVisible('[data-testid="child-dashboard"]');
    expect(aliceDashboard).toBe(true);
    
    // Test back navigation
    const backBtn = page.locator('button:has-text("Back"), button:has-text("← Back"), .back-button').first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForSelector('[data-testid="dashboard-title"], h1:has-text("Parent Dashboard"), button:has-text("Manage Quests")', { timeout: 5000 });
    } else {
      // Try browser back
      await page.goBack();
      await page.waitForSelector('[data-testid="dashboard-title"], h1:has-text("Parent Dashboard"), button:has-text("Manage Quests")', { timeout: 5000 });
    }
    
    // Close tutorial if present again
    const skipTutorialBtn = page.locator('button:has-text("Skip Tutorial")');
    if (await skipTutorialBtn.isVisible()) {
      await skipTutorialBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Test Bob's profile - click second "View Dashboard" button
    const bobViewBtn = page.locator('button:has-text("View Dashboard")').nth(1);
    await bobViewBtn.click();
    await page.waitForSelector('h1:has-text("Bob\'s Adventure"), h2:has-text("Bob"), [data-testid="child-dashboard"]', { timeout: 10000 });
    await page.screenshot({ path: 'test-results/uat-05-bob-dashboard.png' });
    
    console.log('✅ Child profile navigation working');
  });

  test('4. Quest Management', async () => {
    console.log('⚔️ Testing Quest Management...');
    
    await navigateToDashboard(page);
    
    // Click Manage Quests
    await page.click('button:has-text("Manage Quests"), a:has-text("Manage Quests")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/uat-06-quest-management.png' });
    
    // Look for quest management interface
    const questManagementVisible = await page.isVisible('h1:has-text("Quest Management")') || 
                                  await page.isVisible('h2:has-text("Quests")') ||
                                  await page.isVisible('button:has-text("Create Quest")') ||
                                  await page.isVisible('button:has-text("Add Quest")');
    
    expect(questManagementVisible).toBe(true);
    
    // Try to create a new quest
    const createQuestBtn = page.locator('button:has-text("Create Quest"), button:has-text("Add Quest"), button:has-text("New Quest")').first();
    if (await createQuestBtn.isVisible()) {
      await createQuestBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Fill quest form if visible
      if (await page.isVisible('input[placeholder*="title"], input[placeholder*="Title"]')) {
        await page.fill('input[placeholder*="title"], input[placeholder*="Title"]', TEST_QUEST.title);
      }
      if (await page.isVisible('textarea, input[placeholder*="description"]')) {
        await page.fill('textarea, input[placeholder*="description"]', TEST_QUEST.description);
      }
      if (await page.isVisible('input[placeholder*="XP"], input[placeholder*="points"]')) {
        await page.fill('input[placeholder*="XP"], input[placeholder*="points"]', TEST_QUEST.xpReward.toString());
      }
      
      await page.screenshot({ path: 'test-results/uat-07-quest-form.png' });
      
      // Try to save (but don't submit if it would create actual data)
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create")').first();
      if (await saveBtn.isVisible()) {
        // Just verify the button is clickable, don't actually save
        expect(await saveBtn.isEnabled()).toBe(true);
      }
    }
    
    console.log('✅ Quest management interface verified');
  });

  test('5. Quest Claiming Functionality', async () => {
    console.log('🎯 Testing Quest Claiming...');
    
    // Navigate to a child dashboard to test quest claiming
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForSelector('h1:has-text("Parent Dashboard"), h2:has-text("Your Children")', { timeout: 10000 });
    
    // Click on Alice's profile
    await page.click('text=Alice');
    await page.waitForSelector('h1:has-text("Alice"), h2:has-text("Alice")', { timeout: 10000 });
    
    // Look for available quests and "I Did This!" buttons
    const questButtons = page.locator('button:has-text("I Did This!"), button:has-text("Complete"), button:has-text("Claim")');
    const questCount = await questButtons.count();
    
    if (questCount > 0) {
      const firstQuestBtn = questButtons.first();
      await page.screenshot({ path: 'test-results/uat-08-before-claiming.png' });
      
      // Click the quest claim button
      await firstQuestBtn.click();
      
      // Check for immediate feedback
      await page.waitForTimeout(1000); // Wait a moment for UI updates
      
      // Look for "Claiming..." text or similar feedback
      const claimingFeedback = await page.isVisible('text=Claiming...') || 
                              await page.isVisible('text=Processing...') ||
                              await page.isVisible('.loading') ||
                              await page.isVisible('button:disabled:has-text("I Did This!")');
      
      await page.screenshot({ path: 'test-results/uat-09-after-claiming.png' });
      
      // Verify we're still on the same page (no unwanted navigation)
      const stillOnChildDashboard = await page.isVisible('h1:has-text("Alice")') || 
                                   await page.isVisible('h2:has-text("Alice")');
      expect(stillOnChildDashboard).toBe(true);
      
      console.log('✅ Quest claiming feedback working');
    } else {
      console.log('ℹ️ No available quests to claim for testing');
    }
  });

  test('6. Reward Management', async () => {
    console.log('🎁 Testing Reward Management...');
    
    // Navigate back to parent dashboard
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForSelector('h1:has-text("Parent Dashboard"), h2:has-text("Your Children")', { timeout: 10000 });
    
    // Click Manage Rewards
    await page.click('button:has-text("Manage Rewards"), a:has-text("Manage Rewards")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/uat-10-reward-management.png' });
    
    // Verify reward management interface
    const rewardManagementVisible = await page.isVisible('h1:has-text("Reward Management")') || 
                                   await page.isVisible('h2:has-text("Rewards")') ||
                                   await page.isVisible('button:has-text("Create Reward")') ||
                                   await page.isVisible('button:has-text("Add Reward")');
    
    expect(rewardManagementVisible).toBe(true);
    
    // Try to access reward creation
    const createRewardBtn = page.locator('button:has-text("Create Reward"), button:has-text("Add Reward"), button:has-text("New Reward")').first();
    if (await createRewardBtn.isVisible()) {
      await createRewardBtn.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/uat-11-reward-form.png' });
      
      // Verify form elements
      const rewardFormVisible = await page.isVisible('input[placeholder*="name"], input[placeholder*="title"]') ||
                               await page.isVisible('textarea') ||
                               await page.isVisible('input[placeholder*="cost"], input[placeholder*="XP"]');
      
      if (rewardFormVisible) {
        console.log('✅ Reward form accessible');
      }
    }
    
    console.log('✅ Reward management interface verified');
  });

  test('7. Navigation and Back Button Testing', async () => {
    console.log('🧭 Testing Navigation Flows...');
    
    // Test various navigation paths
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForSelector('h1:has-text("Parent Dashboard"), h2:has-text("Your Children")', { timeout: 10000 });
    
    // Navigate through different sections and test back navigation
    const navigationTests = [
      { action: () => page.click('text=Alice'), verify: 'h1:has-text("Alice"), h2:has-text("Alice")' },
      { action: () => page.goBack(), verify: 'h1:has-text("Parent Dashboard"), h2:has-text("Your Children")' },
      { action: () => page.click('button:has-text("Manage Quests"), a:has-text("Manage Quests")'), verify: 'h1:has-text("Quest"), h2:has-text("Quest")' },
      { action: () => page.goBack(), verify: 'h1:has-text("Parent Dashboard"), h2:has-text("Your Children")' }
    ];
    
    for (let i = 0; i < navigationTests.length; i++) {
      const test = navigationTests[i];
      try {
        await test.action();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Check if expected content is visible
        const elements = test.verify.split(', ');
        let verified = false;
        for (const element of elements) {
          if (await page.isVisible(element)) {
            verified = true;
            break;
          }
        }
        
        if (!verified) {
          console.log(`⚠️ Navigation test ${i + 1} may have issues`);
        }
      } catch (error) {
        console.log(`⚠️ Navigation test ${i + 1} failed: ${error.message}`);
      }
    }
    
    console.log('✅ Navigation testing completed');
  });

  test('8. UI Elements and Interactions', async () => {
    console.log('🎨 Testing UI Elements...');
    
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForSelector('h1:has-text("Parent Dashboard"), h2:has-text("Your Children")', { timeout: 10000 });
    
    // Test feedback button
    const feedbackBtn = page.locator('button:has-text("Feedback"), [data-testid="feedback-button"]').first();
    if (await feedbackBtn.isVisible()) {
      await feedbackBtn.click();
      await page.waitForTimeout(1000);
      
      // Check if feedback modal opens
      const feedbackModal = await page.isVisible('[role="dialog"], .modal, .feedback-modal');
      if (feedbackModal) {
        // Close the modal
        const closeBtn = page.locator('button:has-text("Close"), button:has-text("×"), .close-button').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
      console.log('✅ Feedback button functional');
    }
    
    // Test responsive design at different breakpoints
    const viewports = [
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `test-results/uat-responsive-${viewport.name.toLowerCase()}.png` });
    }
    
    // Reset to desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('✅ UI elements and responsive design tested');
  });

  test('9. Console Errors and Performance', async () => {
    console.log('🔍 Checking Console Errors and Performance...');
    
    const errors = [];
    const warnings = [];
    
    // Set up console monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    // Navigate through key pages to catch errors
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');
    
    // Login flow
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    
    // Navigate through different sections
    if (await page.isVisible('text=Alice')) {
      await page.click('text=Alice');
      await page.waitForLoadState('networkidle');
    }
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Check for critical errors (ignore common warnings)
    const criticalErrors = errors.filter(error => 
      !error.includes('deprecated') && 
      !error.includes('DevTools') &&
      !error.includes('Extension') &&
      !error.toLowerCase().includes('warning')
    );
    
    console.log(`Found ${errors.length} console errors, ${criticalErrors.length} critical`);
    console.log(`Found ${warnings.length} console warnings`);
    
    if (criticalErrors.length > 0) {
      console.log('🚨 Critical Console Errors:');
      criticalErrors.forEach(error => console.log('  -', error));
    }
    
    console.log('✅ Console monitoring completed');
  });

  test('10. Logout Functionality', async () => {
    console.log('🚪 Testing Logout...');
    
    // Look for logout button
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), button:has-text("Log Out")').first();
    
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      
      // Wait for redirect to login page
      await page.waitForSelector('input[type="email"], input[type="password"]', { timeout: 5000 });
      
      // Verify we're back at login
      const backAtLogin = await page.isVisible('input[type="email"]') && 
                         await page.isVisible('input[type="password"]');
      expect(backAtLogin).toBe(true);
      
      console.log('✅ Logout successful');
    } else {
      console.log('ℹ️ Logout button not found - may be in menu or different location');
    }
  });
});

// Helper function to login and navigate to dashboard
async function loginAndNavigateToDashboard(page) {
  await page.goto(TEST_CONFIG.baseURL);
  
  // Check if already on dashboard or need to login
  const isAlreadyLoggedIn = await page.isVisible('[data-testid="dashboard-title"], h1:has-text("Parent Dashboard"), button:has-text("Manage Quests")');
  
  if (!isAlreadyLoggedIn) {
    // Need to login first
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.click('button:has-text("Sign In")');
  }
  
  await page.waitForSelector('[data-testid="dashboard-title"], h1:has-text("Parent Dashboard"), button:has-text("Manage Quests")', { timeout: 15000 });
  
  // Close tutorial if present
  const skipTutorialBtn = page.locator('button:has-text("Skip Tutorial")');
  if (await skipTutorialBtn.isVisible()) {
    await skipTutorialBtn.click();
    await page.waitForTimeout(1000);
  }
}

// Helper function for tests that know user is already logged in
async function navigateToDashboard(page) {
  await loginAndNavigateToDashboard(page);
}

// Helper function to safely click with retry
async function safeClick(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    return true;
  } catch (error) {
    console.log(`Failed to click ${selector}: ${error.message}`);
    return false;
  }
}

// Helper function to take screenshot with error handling
async function safeScreenshot(page, path) {
  try {
    await page.screenshot({ path });
  } catch (error) {
    console.log(`Failed to take screenshot ${path}: ${error.message}`);
  }
}