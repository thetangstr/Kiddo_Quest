const { test, expect } = require('@playwright/test');

/**
 * Quest Claiming Debug Test
 * Specifically test quest claiming functionality and capture detailed error information
 */
test.describe('Quest Claiming Debug', () => {
  const BETA_URL = 'https://kiddo-quest-beta.web.app';
  
  test('Debug quest claiming failure with detailed error capture', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `questdebug${timestamp}@test.com`;
    const testPassword = 'TestPass123!';
    
    console.log('🔍 QUEST CLAIMING DEBUG TEST');
    console.log('Account:', testEmail);
    
    // Set up console monitoring
    const consoleMessages = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        console.log('🔴 Console Error:', msg.text());
      }
    });
    
    page.on('requestfailed', request => {
      networkErrors.push({ url: request.url(), error: request.failure()?.errorText });
      console.log('🔴 Network Error:', request.url(), request.failure()?.errorText);
    });
    
    page.on('response', response => {
      if (!response.ok() && response.url().includes('firebase')) {
        console.log('🔴 Firebase Error:', response.status(), response.url());
      }
    });
    
    // Step 1: Register account and set up child
    console.log('Step 1: Setting up account and child...');
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Register
    await page.click('text=Register');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    const passwordFields = page.locator('input[type="password"]');
    if (await passwordFields.count() > 1) {
      await passwordFields.nth(1).fill(testPassword);
    }
    
    await page.click('button:has-text("Register"), button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Skip tutorial
    const skipBtn = page.locator('button:has-text("Skip Tutorial")');
    if (await skipBtn.isVisible({ timeout: 3000 })) {
      await skipBtn.click();
    }
    
    // Add child
    console.log('Adding child Alice...');
    await page.click('button:has-text("Add Child"), button:has-text("Add Your First Child")');
    await page.waitForTimeout(2000);
    await page.fill('input[name="name"], input[placeholder*="name"]', 'Alice');
    
    const avatar = page.locator('text="👧"').first();
    if (await avatar.isVisible({ timeout: 3000 })) {
      await avatar.click();
    }
    
    await page.click('button:has-text("Save"), button:has-text("Create")');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'tests/screenshots/debug-01-child-created.png' });
    
    // Step 2: Create quests for testing
    console.log('Step 2: Creating test quests...');
    await page.click('button:has-text("Manage Quests")');
    await page.waitForTimeout(2000);
    
    // Create a simple quest
    const createQuestBtn = page.locator('button:has-text("Create Quest"), button:has-text("Add Quest")');
    if (await createQuestBtn.isVisible({ timeout: 3000 })) {
      await createQuestBtn.click();
      await page.waitForTimeout(2000);
      
      // Fill quest form
      await page.fill('input[name="title"], input[placeholder*="title"]', 'Test Quest');
      await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'A test quest for debugging');
      await page.fill('input[name="xp"], input[placeholder*="xp"], input[type="number"]', '10');
      
      // Select quest type if available
      const questTypeSelect = page.locator('select');
      if (await questTypeSelect.isVisible({ timeout: 3000 })) {
        await questTypeSelect.selectOption('one-time');
      }
      
      await page.screenshot({ path: 'tests/screenshots/debug-02-quest-form.png' });
      
      // Save quest
      await page.click('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    await page.screenshot({ path: 'tests/screenshots/debug-03-quest-created.png' });
    
    // Step 3: Navigate to child dashboard
    console.log('Step 3: Navigating to child dashboard...');
    
    // Go back to main dashboard
    const backBtn = page.locator('button:has-text("Back"), button:has-text("Dashboard")');
    if (await backBtn.isVisible({ timeout: 3000 })) {
      await backBtn.click();
    } else {
      // Try navigating via breadcrumb or logo
      await page.click('text=Parent Dashboard');
    }
    
    await page.waitForTimeout(2000);
    
    // Click on Alice
    await page.click('text=Alice');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'tests/screenshots/debug-04-alice-dashboard.png' });
    
    // Step 4: Test quest claiming with detailed monitoring
    console.log('Step 4: Testing quest claiming...');
    
    // Look for quest claim buttons
    const claimButtons = page.locator('button:has-text("I Did This")');
    const buttonCount = await claimButtons.count();
    console.log(`Found ${buttonCount} quest claim buttons`);
    
    if (buttonCount === 0) {
      console.log('❌ No quest claim buttons found!');
      
      // Check if quests are visible at all
      const questsSection = await page.locator('text=/Quest|Mission/i').isVisible();
      console.log('Quests section visible:', questsSection);
      
      // Check for any quest-related text
      const questElements = await page.locator('h3, h4, .quest-title').count();
      console.log('Quest elements found:', questElements);
      
      await page.screenshot({ path: 'tests/screenshots/debug-05-no-quests.png' });
    } else {
      console.log('Attempting to claim quest...');
      
      // Clear previous console messages
      consoleMessages.length = 0;
      networkErrors.length = 0;
      
      // Click claim button
      await claimButtons.first().click();
      
      // Wait and capture response
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: 'tests/screenshots/debug-05-after-claim.png' });
      
      // Check for success/error notifications
      const notifications = [
        { selector: 'text=/claimed/i', type: 'success' },
        { selector: 'text=/success/i', type: 'success' },
        { selector: 'text=/waiting/i', type: 'success' },
        { selector: 'text=/pending/i', type: 'success' },
        { selector: 'text=/failed/i', type: 'error' },
        { selector: 'text=/error/i', type: 'error' }
      ];
      
      let notificationFound = false;
      for (const notif of notifications) {
        const element = page.locator(notif.selector);
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          const message = await element.textContent();
          console.log(`📝 Notification (${notif.type}):`, message);
          notificationFound = true;
        }
      }
      
      if (!notificationFound) {
        console.log('❌ No notification found after quest claim');
      }
      
      // Check console for errors
      const recentErrors = consoleMessages.filter(msg => msg.type === 'error');
      if (recentErrors.length > 0) {
        console.log('\n🔍 JavaScript Errors during quest claiming:');
        recentErrors.forEach(error => console.log('  -', error.text));
      }
      
      // Check network errors
      if (networkErrors.length > 0) {
        console.log('\n🔍 Network Errors during quest claiming:');
        networkErrors.forEach(error => console.log('  -', error.url, error.error));
      }
      
      // Check if quest status changed
      const updatedButtonCount = await claimButtons.count();
      console.log(`Quest claim buttons after claim: ${updatedButtonCount} (was ${buttonCount})`);
      
      // Check for pending quests section
      const pendingSection = await page.locator('text=/pending|verification|waiting/i').count();
      console.log('Pending verification elements:', pendingSection);
    }
    
    // Step 5: Check Firebase connection and auth status
    console.log('\nStep 5: Checking Firebase connection...');
    
    // Execute JavaScript to check Firebase status
    const firebaseStatus = await page.evaluate(() => {
      return {
        hasAuth: typeof window.firebase !== 'undefined',
        isSignedIn: !!(window.auth?.currentUser),
        userId: window.auth?.currentUser?.uid || 'not signed in'
      };
    }).catch(() => ({ hasAuth: false, isSignedIn: false, userId: 'check failed' }));
    
    console.log('Firebase status:', firebaseStatus);
    
    // Summary
    console.log('\n=== QUEST CLAIMING DEBUG SUMMARY ===');
    console.log('Account created:', testEmail);
    console.log('Child created: Alice');
    console.log('Quest claim buttons found:', buttonCount);
    console.log('JavaScript errors:', consoleMessages.filter(m => m.type === 'error').length);
    console.log('Network errors:', networkErrors.length);
    console.log('Firebase auth status:', firebaseStatus.isSignedIn ? 'OK' : 'FAILED');
    
    if (recentErrors?.length > 0 || networkErrors.length > 0) {
      console.log('\n❌ QUEST CLAIMING FAILED - Errors detected');
      console.log('Check screenshots: debug-*.png');
    } else if (buttonCount === 0) {
      console.log('\n⚠️ NO QUESTS AVAILABLE - Need to investigate quest creation');
    } else {
      console.log('\n✅ Quest claiming test completed - check notifications');
    }
  });
});
