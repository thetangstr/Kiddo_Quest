const { test, expect } = require('@playwright/test');

/**
 * Production Quest Claiming Test
 * Test quest claiming on production site where we have working test data
 */
test.describe('Production Quest Claiming Test', () => {
  const PROD_URL = 'https://kiddo-quest-de7b0.web.app';
  const TEST_EMAIL = 'test1756360126136@kiddoquest.com'; // Account we created earlier
  const TEST_PASSWORD = 'TestKiddo123!';
  
  test('Test quest claiming on production with existing account', async ({ page }) => {
    console.log('🎯 TESTING QUEST CLAIMING ON PRODUCTION');
    console.log('Using existing account:', TEST_EMAIL);
    
    // Monitor console and network
    const consoleErrors = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('🔴 Console Error:', msg.text());
      }
    });
    
    page.on('requestfailed', request => {
      networkErrors.push({ url: request.url(), error: request.failure()?.errorText });
      console.log('🔴 Network Failed:', request.url());
    });
    
    // Step 1: Go to production site
    console.log('Step 1: Loading production site...');
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/prod-debug-01-login.png' });
    
    // Step 2: Login with existing account
    console.log('Step 2: Logging in...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In")');
    
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    await page.screenshot({ path: 'tests/screenshots/prod-debug-02-after-login.png' });
    
    // Check if logged in
    const dashboardVisible = await page.locator('text=/Dashboard|Alice|Bob/i').isVisible({ timeout: 10000 }).catch(() => false);
    console.log('Login successful:', dashboardVisible);
    
    if (!dashboardVisible) {
      console.log('❌ Login failed - account may not exist');
      return;
    }
    
    // Step 3: Find and click on a child (Alice or Bob)
    console.log('Step 3: Looking for child profiles...');
    
    const childProfiles = [
      { name: 'Alice', locator: page.locator('text=Alice').first() },
      { name: 'Bob', locator: page.locator('text=Bob').first() }
    ];
    
    let selectedChild = null;
    for (const child of childProfiles) {
      if (await child.locator.isVisible({ timeout: 3000 })) {
        selectedChild = child;
        console.log(`Found ${child.name}, clicking...`);
        await child.locator.click();
        break;
      }
    }
    
    if (!selectedChild) {
      console.log('❌ No child profiles found');
      return;
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/prod-debug-03-child-dashboard.png' });
    
    // Step 4: Check for quest claiming functionality
    console.log(`Step 4: Testing quest claiming for ${selectedChild.name}...`);
    
    // Look for quest elements
    const questSection = await page.locator('text=/Quest|Mission/i').isVisible({ timeout: 5000 });
    console.log('Quest section visible:', questSection);
    
    // Look for claim buttons
    const claimButtons = page.locator('button:has-text("I Did This")');
    const claimButtonCount = await claimButtons.count();
    console.log('Quest claim buttons found:', claimButtonCount);
    
    // Look for pending quests (already claimed)
    const pendingQuests = page.locator('text=/pending|verification|waiting/i');
    const pendingCount = await pendingQuests.count();
    console.log('Pending quests found:', pendingCount);
    
    if (claimButtonCount > 0) {
      console.log('🎯 Attempting to claim quest...');
      
      // Clear previous errors
      consoleErrors.length = 0;
      networkErrors.length = 0;
      
      // Get quest details before claiming
      const questTitle = await page.locator('h3, h4, .quest-title').first().textContent().catch(() => 'Unknown Quest');
      console.log('Claiming quest:', questTitle);
      
      // Click claim button
      await claimButtons.first().click();
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'tests/screenshots/prod-debug-04-after-claim.png' });
      
      // Check for notifications
      const successNotifications = [
        page.locator('text=/claimed/i'),
        page.locator('text=/success/i'),
        page.locator('text=/waiting/i'),
        page.locator('text=/pending/i')
      ];
      
      const errorNotifications = [
        page.locator('text=/failed/i'),
        page.locator('text=/error/i'),
        page.locator('text=/unable/i')
      ];
      
      let notificationMessage = '';
      let notificationType = 'none';
      
      // Check for success notifications
      for (const notif of successNotifications) {
        if (await notif.isVisible({ timeout: 2000 }).catch(() => false)) {
          notificationMessage = await notif.textContent();
          notificationType = 'success';
          break;
        }
      }
      
      // Check for error notifications
      if (notificationType === 'none') {
        for (const notif of errorNotifications) {
          if (await notif.isVisible({ timeout: 2000 }).catch(() => false)) {
            notificationMessage = await notif.textContent();
            notificationType = 'error';
            break;
          }
        }
      }
      
      console.log(`Notification: ${notificationType} - "${notificationMessage}"`);
      
      // Check if quest status changed
      const updatedClaimButtons = await claimButtons.count();
      const updatedPendingQuests = await pendingQuests.count();
      
      console.log('After claim - Claim buttons:', updatedClaimButtons, 'Pending quests:', updatedPendingQuests);
      
      // Report results
      if (notificationType === 'success') {
        console.log('✅ SUCCESS: Quest claiming is working!');
      } else if (notificationType === 'error') {
        console.log('❌ ERROR: Quest claiming failed with message:', notificationMessage);
      } else {
        console.log('⚠️ WARNING: No clear success/error notification found');
      }
      
      // Check for JavaScript errors
      if (consoleErrors.length > 0) {
        console.log('\n🔴 JavaScript Errors:');
        consoleErrors.forEach(error => console.log('  -', error));
      }
      
      // Check for network errors
      if (networkErrors.length > 0) {
        console.log('\n🔴 Network Errors:');
        networkErrors.forEach(error => console.log('  -', error.url));
      }
      
    } else if (pendingCount > 0) {
      console.log('ℹ️ All quests are already claimed and pending verification');
      console.log('✅ This suggests quest claiming worked previously!');
    } else {
      console.log('⚠️ No quests available to claim and none pending');
    }
    
    // Step 5: Check Firebase authentication
    const authStatus = await page.evaluate(() => {
      return {
        hasAuth: !!(window.firebase || window.auth),
        currentUser: window.auth?.currentUser?.uid || 'none'
      };
    }).catch(() => ({ hasAuth: false, currentUser: 'check failed' }));
    
    console.log('\n=== PRODUCTION QUEST CLAIMING TEST SUMMARY ===');
    console.log('Site:', PROD_URL);
    console.log('Login successful:', dashboardVisible);
    console.log('Child found:', selectedChild?.name || 'none');
    console.log('Quest claim buttons:', claimButtonCount);
    console.log('Pending quests:', pendingCount);
    console.log('Notification type:', notificationType);
    console.log('JavaScript errors:', consoleErrors.length);
    console.log('Network errors:', networkErrors.length);
    console.log('Auth status:', authStatus);
    
    if (consoleErrors.length === 0 && (claimButtonCount > 0 || pendingCount > 0)) {
      console.log('\n✅ QUEST SYSTEM IS FUNCTIONAL');
    } else {
      console.log('\n❌ QUEST SYSTEM HAS ISSUES');
    }
  });
});
