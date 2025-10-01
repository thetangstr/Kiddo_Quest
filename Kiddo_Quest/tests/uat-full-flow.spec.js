const { test, expect } = require('@playwright/test');

test.describe('KiddoQuest Beta Full Flow UAT', () => {
  const BETA_URL = 'https://kiddo-quest-beta.web.app';
  const TEST_EMAIL = `uat.test.${Date.now()}@example.com`;
  const TEST_PASSWORD = 'UAT_Test123!';
  
  test('Complete flow - Registration, Login, and Dashboard Testing', async ({ page }) => {
    console.log('=== COMPLETE FLOW UAT TEST ===');
    console.log('Test email:', TEST_EMAIL);
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('CONSOLE ERROR:', msg.text());
      }
    });

    // Step 1: Registration
    console.log('1. Testing account registration...');
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Click Register
    await page.locator('text="Register"').click();
    await page.waitForTimeout(2000);
    
    // Fill registration form
    await page.locator('input[placeholder*="email"]').fill(TEST_EMAIL);
    await page.locator('input[placeholder*="password"]:not([placeholder*="Confirm"])').fill(TEST_PASSWORD);
    await page.locator('input[placeholder*="Confirm"], input[placeholder*="confirm"]').fill(TEST_PASSWORD);
    
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-full-01-registration.png' });
    
    // Submit registration
    await page.locator('button:has-text("Create Account"), button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-full-02-after-registration.png' });
    
    // Check if registration was successful (might redirect to dashboard or login)
    const currentUrl = page.url();
    console.log('URL after registration:', currentUrl);
    
    // Step 2: Check for Dashboard or Login Again
    console.log('2. Checking for dashboard or login requirement...');
    
    let dashboardFound = false;
    const dashboardElements = [
      'text="Parent Dashboard"',
      'text="Dashboard"',
      'text="Manage Quests"',
      'text="Manage Rewards"',
      'button:has-text("Logout")'
    ];
    
    for (const element of dashboardElements) {
      if (await page.locator(element).isVisible().catch(() => false)) {
        dashboardFound = true;
        console.log('✓ Dashboard found after registration:', element);
        break;
      }
    }
    
    if (!dashboardFound) {
      console.log('Dashboard not found, checking if we need to login...');
      
      // Check if we're back on login page
      const emailInput = page.locator('input[placeholder*="email"]');
      if (await emailInput.isVisible().catch(() => false)) {
        console.log('Need to login after registration...');
        
        await emailInput.fill(TEST_EMAIL);
        await page.locator('input[type="password"]').fill(TEST_PASSWORD);
        await page.locator('button:has-text("Sign In with Email")').click();
        
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-full-03-after-login.png' });
        
        // Check for dashboard again
        for (const element of dashboardElements) {
          if (await page.locator(element).isVisible().catch(() => false)) {
            dashboardFound = true;
            console.log('✓ Dashboard found after login:', element);
            break;
          }
        }
      }
    }
    
    if (dashboardFound) {
      console.log('✓ Successfully authenticated and reached dashboard');
      
      // Step 3: Test Dashboard Functionality
      console.log('3. Testing dashboard functionality...');
      
      await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-full-04-dashboard.png' });
      
      // Check for child management
      const addChildButton = page.locator('button:has-text("Add Child")').or(page.locator('button:has-text("Create Child")')).or(page.locator('text="Add Child"'));
      if (await addChildButton.count() > 0) {
        console.log('✓ Add child functionality available');
        
        // Test adding a child
        console.log('4. Testing add child functionality...');
        await addChildButton.first().click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-full-05-add-child.png' });
        
        // Fill child information if form appears
        const childNameInput = page.locator('input[placeholder*="name"], input[name*="name"]');
        if (await childNameInput.isVisible().catch(() => false)) {
          await childNameInput.fill('Test Child');
          
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');
          if (await saveButton.count() > 0) {
            await saveButton.first().click();
            await page.waitForTimeout(2000);
            
            console.log('✓ Child creation attempted');
            await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-full-06-child-created.png' });
          }
        }
      }
      
      // Step 5: Test Quest Management
      console.log('5. Testing quest management...');
      const questButton = page.locator('button:has-text("Quest"), text*="Quest"');
      if (await questButton.count() > 0) {
        await questButton.first().click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-full-07-quests.png' });
        console.log('✓ Quest management accessible');
      }
      
      // Step 6: Test Reward Management
      console.log('6. Testing reward management...');
      const rewardButton = page.locator('button:has-text("Reward"), text*="Reward"');
      if (await rewardButton.count() > 0) {
        await rewardButton.first().click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-full-08-rewards.png' });
        console.log('✓ Reward management accessible');
      }
      
      // Step 7: Test Logout
      console.log('7. Testing logout functionality...');
      const logoutButton = page.locator('button:has-text("Logout")');
      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-full-09-logout.png' });
        
        // Check if back to login page
        const backToLogin = await page.locator('input[placeholder*="email"]').isVisible().catch(() => false);
        console.log('✓ Logout successful:', backToLogin ? 'Yes' : 'No');
      }
      
    } else {
      console.log('✗ Could not reach dashboard - registration/login may have failed');
      
      // Look for error messages
      const errorElements = page.locator('div:has-text("error"), div:has-text("failed"), div:has-text("invalid")');
      const errorCount = await errorElements.count();
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorElements.nth(i).textContent();
          console.log('Error message found:', errorText);
        }
      }
    }
    
    console.log('Console errors during test:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(error => console.log('  -', error));
    }
    
    console.log('=== FULL FLOW UAT COMPLETE ===');
  });

  test('Test with provided credentials as backup', async ({ page }) => {
    console.log('=== TESTING PROVIDED CREDENTIALS ===');
    
    const PROVIDED_EMAIL = 'test1756412395505@kiddoquest.com';
    const PROVIDED_PASSWORD = 'TestKiddo123!';
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[placeholder*="email"]').fill(PROVIDED_EMAIL);
    await page.locator('input[type="password"]').fill(PROVIDED_PASSWORD);
    await page.locator('button:has-text("Sign In with Email")').click();
    
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-provided-credentials.png' });
    
    // Check for dashboard
    const dashboardElements = [
      'text="Alice"',
      'text="Bob"',
      'text="Parent Dashboard"',
      'text="Dashboard"'
    ];
    
    let loginSuccessful = false;
    for (const element of dashboardElements) {
      if (await page.locator(element).isVisible().catch(() => false)) {
        loginSuccessful = true;
        console.log('✓ Login with provided credentials successful:', element);
        
        // If we can login, test the quest claiming fix
        if (element.includes('Alice') || element.includes('Bob')) {
          console.log('Testing child profile and quest claiming...');
          
          const childProfile = page.locator('text="Alice"').first();
          if (await childProfile.isVisible()) {
            await childProfile.click();
            await page.waitForTimeout(3000);
            
            await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-alice-dashboard.png' });
            
            // Look for "I Did This!" buttons - the critical test
            const questButtons = page.locator('button:has-text("I Did This"), button:has-text("🎉")');
            const buttonCount = await questButtons.count();
            
            if (buttonCount > 0) {
              console.log(`Found ${buttonCount} quest buttons - testing critical claiming flow`);
              
              const firstButton = questButtons.first();
              await firstButton.click();
              await page.waitForTimeout(1000);
              
              await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-quest-claim-test.png' });
              
              // Check for "Claiming..." text (should appear)
              const claimingText = page.locator('text="Claiming..."');
              const isClaimingVisible = await claimingText.isVisible().catch(() => false);
              
              // Check for loading message (should NOT appear)
              const loadingMessage = page.locator('text*="Loading child dashboard"');
              const isLoadingVisible = await loadingMessage.isVisible().catch(() => false);
              
              console.log('✓ Quest claiming feedback test results:');
              console.log('  - Claiming text visible:', isClaimingVisible);
              console.log('  - Loading message visible (should be false):', isLoadingVisible);
              
              if (isClaimingVisible && !isLoadingVisible) {
                console.log('✅ CRITICAL FIX VERIFIED: Quest claiming shows immediate feedback without navigation');
              } else {
                console.log('❌ CRITICAL ISSUE: Quest claiming may still have navigation problem');
              }
            } else {
              console.log('No quest buttons found - may need existing quest data');
            }
          }
        }
        break;
      }
    }
    
    if (!loginSuccessful) {
      console.log('✗ Login with provided credentials failed');
      
      // Check for error messages
      const stillOnLogin = await page.locator('input[placeholder*="email"]').isVisible().catch(() => false);
      console.log('Still on login page:', stillOnLogin);
    }
    
    console.log('=== PROVIDED CREDENTIALS TEST COMPLETE ===');
  });
});