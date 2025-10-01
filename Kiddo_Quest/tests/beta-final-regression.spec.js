const { test, expect } = require('@playwright/test');

/**
 * Beta Final Regression Test
 * Run this test on every beta deployment to verify core functionality
 * This test creates a fresh account each time to ensure clean testing
 */
test.describe('Beta Final Regression Test', () => {
  const BETA_URL = 'https://kiddo-quest-beta.web.app';
  
  test('Complete user journey: Register → Add Child → Test Child Dashboard → Claim Quest', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `regression${timestamp}@test.com`;
    const testPassword = 'TestPass123!';
    
    console.log('🧪 BETA REGRESSION TEST STARTED');
    console.log('Account:', testEmail);
    
    // Step 1: Navigate to beta site
    console.log('Step 1: Loading beta site...');
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Verify login page loads
    await expect(page).toHaveTitle(/Kiddo Quest/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/final-01-login-page.png' });
    
    // Step 2: Register new account
    console.log('Step 2: Registering new account...');
    await page.click('text=Register');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Handle confirm password if present
    const passwordFields = page.locator('input[type="password"]');
    const fieldCount = await passwordFields.count();
    if (fieldCount > 1) {
      await passwordFields.nth(1).fill(testPassword);
    }
    
    await page.click('button:has-text("Register"), button:has-text("Sign Up"), button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    await page.screenshot({ path: 'tests/screenshots/final-02-after-registration.png' });
    
    // Step 3: Verify parent dashboard loaded
    console.log('Step 3: Verifying parent dashboard...');
    await expect(page.locator('text=Parent Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Child Profiles')).toBeVisible();
    
    // Close tutorial if present
    const skipTutorial = page.locator('button:has-text("Skip Tutorial"), text="Skip Tutorial"');
    if (await skipTutorial.isVisible({ timeout: 3000 })) {
      await skipTutorial.click();
      await page.waitForTimeout(1000);
    }
    
    // Step 4: Add first child (Alice)
    console.log('Step 4: Adding child profile (Alice)...');
    const addChildButton = page.locator('button:has-text("Add Child"), button:has-text("Add Your First Child")');
    await addChildButton.first().click();
    await page.waitForTimeout(2000);
    
    // Fill child form
    await page.fill('input[placeholder*="name" i], input[name="name"]', 'Alice');
    
    // Select avatar
    const avatar = page.locator('text="👧"').first();
    if (await avatar.isVisible({ timeout: 3000 })) {
      await avatar.click();
    }
    
    await page.screenshot({ path: 'tests/screenshots/final-03-add-alice.png' });
    
    // Save child
    await page.click('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');
    await page.waitForTimeout(3000);
    
    // Step 5: Verify child appears in dashboard
    console.log('Step 5: Verifying Alice appears in parent dashboard...');
    await expect(page.locator('text=Alice')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'tests/screenshots/final-04-alice-created.png' });
    
    // Step 6: Click on Alice to enter child dashboard
    console.log('Step 6: Entering Alice\'s child dashboard...');
    await page.click('text=Alice');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    await page.screenshot({ path: 'tests/screenshots/final-05-alice-dashboard.png' });
    
    // Step 7: Verify child dashboard elements
    console.log('Step 7: Verifying child dashboard elements...');
    
    const childDashboardChecks = {
      'Child name': page.locator('text=Alice'),
      'XP/Stars display': page.locator('text=/Stars|XP|Points/i'),
      'Quest section': page.locator('text=/Quest|Mission/i'),
      'Reward section': page.locator('text=/Reward|Treasure/i'),
      'Parent access button': page.locator('button[aria-label="Parent Access"], button:has(svg)')
    };
    
    const results = {};
    for (const [name, locator] of Object.entries(childDashboardChecks)) {
      const visible = await locator.isVisible({ timeout: 5000 }).catch(() => false);
      results[name] = visible;
      if (visible) {
        console.log(`✅ ${name} is visible`);
      } else {
        console.log(`❌ ${name} is missing`);
      }
    }
    
    // Step 8: Test quest claiming (if available)
    console.log('Step 8: Testing quest functionality...');
    const claimButtons = page.locator('button:has-text("I Did This")');
    const claimCount = await claimButtons.count();
    console.log(`Found ${claimCount} quest claim buttons`);
    
    if (claimCount > 0) {
      console.log('Testing quest claim...');
      await claimButtons.first().click();
      await page.waitForTimeout(2000);
      
      // Check for notification
      const notification = page.locator('text=/claimed|success|waiting|pending/i');
      const hasNotification = await notification.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasNotification) {
        const message = await notification.textContent();
        console.log('✅ Quest claim successful:', message);
      } else {
        console.log('⚠️ No quest claim notification found');
      }
      
      await page.screenshot({ path: 'tests/screenshots/final-06-quest-claimed.png' });
    } else {
      console.log('⚠️ No quests available to claim (need to add default quests)');
    }
    
    // Step 9: Test navigation back to parent dashboard
    console.log('Step 9: Testing navigation back to parent dashboard...');
    const parentAccessButton = page.locator('button[aria-label="Parent Access"], button:has-text("Parent")');
    if (await parentAccessButton.isVisible({ timeout: 3000 })) {
      await parentAccessButton.click();
      await page.waitForTimeout(2000);
      
      // Verify we're back at parent dashboard
      const backAtParent = await page.locator('text=Parent Dashboard').isVisible({ timeout: 5000 }).catch(() => false);
      if (backAtParent) {
        console.log('✅ Successfully navigated back to parent dashboard');
      } else {
        console.log('❌ Failed to navigate back to parent dashboard');
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/final-07-final-state.png' });
    
    // Step 10: Summary
    console.log('\n=== BETA REGRESSION TEST RESULTS ===');
    console.log('Beta Site:', BETA_URL);
    console.log('Test Account:', testEmail);
    console.log('Child Dashboard Elements:');
    Object.entries(results).forEach(([name, visible]) => {
      console.log(`  ${visible ? '✅' : '❌'} ${name}`);
    });
    
    const criticalIssues = Object.values(results).filter(v => !v).length;
    if (criticalIssues === 0) {
      console.log('\n✅ BETA REGRESSION TEST PASSED - All core functionality working!');
    } else {
      console.log(`\n⚠️ BETA REGRESSION TEST - ${criticalIssues} issues found`);
    }
    
    console.log('Screenshots saved in tests/screenshots/final-*.png');
    console.log('=== END REGRESSION TEST ===\n');
    
    // Expect critical elements to be present
    expect(results['Child name']).toBeTruthy();
    expect(results['Quest section'] || results['Reward section']).toBeTruthy();
  });
});
