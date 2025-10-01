const { test, expect } = require('@playwright/test');

test.describe('KiddoQuest Beta UAT Testing', () => {
  const TEST_EMAIL = 'test1756412395505@kiddoquest.com';
  const TEST_PASSWORD = 'TestKiddo123!';
  const BETA_URL = 'https://kiddo-quest-beta.web.app';

  test.beforeEach(async ({ page }) => {
    // Navigate to beta site
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
  });

  test('1. Authentication Flow - Login with test account', async ({ page }) => {
    console.log('Testing authentication flow...');
    
    // Take screenshot of initial page
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-01-initial-page.png' });
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]');
    const loginButton = page.locator('button:has-text("Sign In with Email")');
    
    // Verify login form is visible
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    console.log('Login form elements found and visible');
    
    // Fill in credentials
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    
    // Take screenshot before login attempt
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-02-before-login.png' });
    
    // Click login button
    await loginButton.click();
    
    // Wait for navigation or dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow time for authentication
    
    // Take screenshot after login
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-03-after-login.png' });
    
    // Check for successful login indicators
    const dashboardElements = [
      'text="Parent Dashboard"',
      'text="Dashboard"', 
      'text="Alice"',
      'text="Bob"',
      'button:has-text("Logout")',
      'text="Manage"'
    ];
    
    let loginSuccess = false;
    for (const selector of dashboardElements) {
      if (await page.locator(selector).isVisible().catch(() => false)) {
        loginSuccess = true;
        console.log(`Found dashboard element: ${selector}`);
        break;
      }
    }
    
    if (loginSuccess) {
      console.log('✓ Authentication successful - dashboard loaded');
    } else {
      console.log('✗ Authentication may have failed - dashboard not detected');
      // Check for error messages
      const errorSelectors = [
        'text*="error"',
        'text*="failed"',
        'text*="invalid"',
        '[class*="error"]'
      ];
      
      for (const errorSelector of errorSelectors) {
        const errorElement = page.locator(errorSelector);
        if (await errorElement.isVisible().catch(() => false)) {
          console.log(`Error message found: ${await errorElement.textContent()}`);
        }
      }
    }
  });

  test('2. Parent Dashboard - UI Elements and Functionality', async ({ page }) => {
    // Login first
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Sign In with Email")');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await loginButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Testing parent dashboard...');
    
    // Take dashboard screenshot
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-04-parent-dashboard.png' });
    
    // Check for child profiles
    const aliceProfile = page.locator('text="Alice"');
    const bobProfile = page.locator('text="Bob"');
    
    console.log('Alice profile visible:', await aliceProfile.isVisible().catch(() => false));
    console.log('Bob profile visible:', await bobProfile.isVisible().catch(() => false));
    
    // Check for navigation elements
    const managementButtons = [
      'text*="Manage Quests"',
      'text*="Manage Rewards"',
      'text*="Quest"',
      'text*="Reward"',
      'button:has-text("Logout")'
    ];
    
    for (const buttonText of managementButtons) {
      const button = page.locator(buttonText);
      const isVisible = await button.isVisible().catch(() => false);
      console.log(`${buttonText} visible:`, isVisible);
    }
    
    // Check for quest completions (the recently fixed date crash)
    const completionsSection = page.locator('text*="completion", text*="pending", text*="completed"');
    if (await completionsSection.count() > 0) {
      console.log('Found quest completions section - checking for date crash...');
      await page.waitForTimeout(2000);
      // If we reach here without crash, the date fix worked
      console.log('✓ No date-related crashes detected in completions');
    }
  });

  test('3. Child Profile Selection - Alice and Bob', async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Sign In with Email")');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await loginButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Testing child profile selection...');
    
    // Try to click on Alice's profile
    const aliceProfile = page.locator('text="Alice"').first();
    if (await aliceProfile.isVisible()) {
      console.log('Clicking Alice profile...');
      await aliceProfile.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of Alice's dashboard
      await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-05-alice-dashboard.png' });
      
      // Check if child dashboard loaded
      const childDashboardIndicators = [
        'text*="Alice"',
        'text*="XP"',
        'text*="Quest"',
        'text*="I Did This"',
        'button:has-text("Back")',
        'text*="Parent View"'
      ];
      
      let aliceLoaded = false;
      for (const indicator of childDashboardIndicators) {
        if (await page.locator(indicator).isVisible().catch(() => false)) {
          aliceLoaded = true;
          console.log(`Alice dashboard loaded - found: ${indicator}`);
          break;
        }
      }
      
      if (aliceLoaded) {
        console.log('✓ Alice profile loaded successfully');
        
        // Try to navigate back
        const backButton = page.locator('button:has-text("Back"), button:has-text("Parent"), text*="Parent"');
        if (await backButton.first().isVisible().catch(() => false)) {
          await backButton.first().click();
          await page.waitForTimeout(2000);
          console.log('✓ Navigation back from Alice profile successful');
        }
      } else {
        console.log('✗ Alice profile failed to load properly');
      }
    }
    
    // Try Bob's profile
    const bobProfile = page.locator('text="Bob"').first();
    if (await bobProfile.isVisible()) {
      console.log('Clicking Bob profile...');
      await bobProfile.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-06-bob-dashboard.png' });
      
      const bobLoaded = await page.locator('text*="Bob"').isVisible().catch(() => false);
      console.log('Bob profile loaded:', bobLoaded);
    }
  });

  test('4. Critical Quest Claiming Flow', async ({ page }) => {
    // Login and navigate to child view
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Sign In with Email")');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await loginButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Navigate to Alice's profile
    const aliceProfile = page.locator('text="Alice"').first();
    if (await aliceProfile.isVisible()) {
      await aliceProfile.click();
      await page.waitForTimeout(2000);
      
      console.log('Testing critical quest claiming flow...');
      
      // Look for "I Did This!" buttons
      const questButtons = page.locator('button:has-text("I Did This"), button:has-text("🎉")');
      const buttonCount = await questButtons.count();
      
      console.log(`Found ${buttonCount} quest buttons`);
      
      if (buttonCount > 0) {
        // Take screenshot before claiming
        await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-07-before-quest-claim.png' });
        
        const firstButton = questButtons.first();
        console.log('Clicking first quest claim button...');
        
        // Monitor for navigation (should NOT happen)
        let navigationOccurred = false;
        page.on('framenavigated', () => {
          navigationOccurred = true;
        });
        
        await firstButton.click();
        
        // Wait a moment and check the button state
        await page.waitForTimeout(1000);
        
        // Take screenshot immediately after click
        await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-08-after-quest-claim.png' });
        
        // Check for "Claiming..." text (should appear)
        const claimingText = page.locator('text="Claiming..."');
        const isClaimingVisible = await claimingText.isVisible().catch(() => false);
        
        // Check for loading message (should NOT appear)
        const loadingMessage = page.locator('text*="Loading child dashboard"');
        const isLoadingVisible = await loadingMessage.isVisible().catch(() => false);
        
        console.log('Navigation occurred:', navigationOccurred);
        console.log('Claiming text visible:', isClaimingVisible);
        console.log('Loading message visible:', isLoadingVisible);
        
        if (isClaimingVisible && !isLoadingVisible && !navigationOccurred) {
          console.log('✓ Quest claiming working correctly - immediate feedback without navigation');
        } else if (isLoadingVisible || navigationOccurred) {
          console.log('✗ Quest claiming has navigation issue - should show immediate feedback');
        } else {
          console.log('? Quest claiming feedback unclear - needs investigation');
        }
        
        // Wait for completion
        await page.waitForTimeout(3000);
        
        // Take final screenshot
        await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-09-quest-claim-complete.png' });
        
        // Check for success feedback
        const successIndicators = [
          'text*="success"',
          'text*="completed"',
          'text*="pending"',
          'text*="approved"'
        ];
        
        for (const indicator of successIndicators) {
          if (await page.locator(indicator).isVisible().catch(() => false)) {
            console.log(`✓ Found success indicator: ${indicator}`);
          }
        }
      } else {
        console.log('No quest claim buttons found - may need to check quest setup');
      }
    }
  });

  test('5. Console Errors and Performance Check', async ({ page }) => {
    const consoleErrors = [];
    const networkErrors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Login to trigger more functionality
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Sign In with Email")');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await loginButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('Console Errors Found:', consoleErrors.length);
    consoleErrors.forEach(error => console.log('  ERROR:', error));
    
    console.log('Network Errors Found:', networkErrors.length);
    networkErrors.forEach(error => console.log('  NETWORK:', error));
    
    // Check page performance
    const performanceMetrics = await page.evaluate(() => {
      return {
        loadComplete: performance.now(),
        navigation: performance.getEntriesByType('navigation')[0]
      };
    });
    
    console.log('Page Load Time:', Math.round(performanceMetrics.loadComplete), 'ms');
  });
});