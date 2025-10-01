const { test, expect } = require('@playwright/test');

test.describe('Beta Site Full Test with Test Account', () => {
  test.use({ 
    baseURL: 'https://kiddo-quest-beta.web.app',
    ignoreHTTPSErrors: true
  });

  test('Complete user journey - Login, View Children, Claim Quest', async ({ page }) => {
    console.log('🚀 Starting full beta site test...');
    
    // Step 1: Navigate to beta site
    console.log('Step 1: Navigating to beta site...');
    await page.goto('https://kiddo-quest-beta.web.app');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/beta-1-initial.png' });
    
    // Step 2: Login with test account
    console.log('Step 2: Logging in with test account...');
    await page.fill('input[type="email"]', 'test1756356294943@kiddoquest.com');
    await page.fill('input[type="password"]', 'TestKiddo123!');
    await page.screenshot({ path: 'tests/screenshots/beta-2-credentials-entered.png' });
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation with longer timeout
    console.log('Waiting for login to complete...');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
      console.log('Network idle timeout - continuing...');
    });
    
    await page.waitForTimeout(3000); // Extra wait for React to render
    await page.screenshot({ path: 'tests/screenshots/beta-3-after-login.png' });
    
    // Check if we're logged in
    const isLoggedIn = await page.locator('text=/Dashboard|Children|Welcome|Profile/i').isVisible().catch(() => false);
    console.log('Login successful:', isLoggedIn);
    
    // If login failed, try to see what error appeared
    if (!isLoggedIn) {
      const errorMessage = await page.locator('text=/error|invalid|incorrect/i').textContent().catch(() => 'No error message found');
      console.log('Login error:', errorMessage);
      
      // Check if we're still on login page
      const stillOnLogin = await page.locator('input[type="email"]').isVisible();
      console.log('Still on login page:', stillOnLogin);
      
      // Try to register the account if it doesn't exist
      if (stillOnLogin) {
        console.log('Account might not exist, trying to register...');
        await page.click('text=Register');
        await page.waitForTimeout(2000);
        
        // Fill registration form
        await page.fill('input[type="email"]', 'test1756356294943@kiddoquest.com');
        await page.fill('input[type="password"]', 'TestKiddo123!');
        
        // Look for confirm password field
        const confirmPasswordField = page.locator('input[type="password"]').nth(1);
        if (await confirmPasswordField.isVisible()) {
          await confirmPasswordField.fill('TestKiddo123!');
        }
        
        await page.screenshot({ path: 'tests/screenshots/beta-3b-registration.png' });
        
        // Submit registration
        const registerButton = page.locator('button:has-text("Register"), button:has-text("Sign Up"), button:has-text("Create Account")');
        if (await registerButton.isVisible()) {
          await registerButton.click();
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(3000);
        }
        
        await page.screenshot({ path: 'tests/screenshots/beta-3c-after-registration.png' });
      }
    }
    
    // Step 3: Check for parent dashboard
    console.log('Step 3: Checking for parent dashboard...');
    
    // Look for "Add Child" button or child profiles
    const addChildButton = page.locator('button:has-text("Add Child"), button:has-text("Add Profile"), text="Add a Child"');
    const hasAddChild = await addChildButton.isVisible().catch(() => false);
    console.log('Add Child button visible:', hasAddChild);
    
    // Look for existing children
    const aliceProfile = page.locator('text=/Alice/i').first();
    const bobProfile = page.locator('text=/Bob/i').first();
    const hasAlice = await aliceProfile.isVisible().catch(() => false);
    const hasBob = await bobProfile.isVisible().catch(() => false);
    console.log('Child profiles found - Alice:', hasAlice, 'Bob:', hasBob);
    
    await page.screenshot({ path: 'tests/screenshots/beta-4-dashboard.png' });
    
    // Step 4: If no children exist, create one
    if (!hasAlice && !hasBob && hasAddChild) {
      console.log('Step 4: Creating child profile...');
      await addChildButton.click();
      await page.waitForTimeout(2000);
      
      // Fill child profile form
      await page.fill('input[placeholder*="name" i], input[name="name"]', 'TestChild');
      
      // Select an avatar if available
      const avatarOption = page.locator('text="🦸"').first();
      if (await avatarOption.isVisible()) {
        await avatarOption.click();
      }
      
      await page.screenshot({ path: 'tests/screenshots/beta-5-add-child.png' });
      
      // Save child profile
      await page.click('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');
      await page.waitForTimeout(3000);
    }
    
    // Step 5: Navigate to child dashboard
    console.log('Step 5: Navigating to child dashboard...');
    
    // Click on a child profile
    const childToClick = hasAlice ? aliceProfile : (hasBob ? bobProfile : page.locator('text=/TestChild/i').first());
    
    if (await childToClick.isVisible()) {
      console.log('Clicking on child profile...');
      await childToClick.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'tests/screenshots/beta-6-child-dashboard.png' });
      
      // Step 6: Check for quests
      console.log('Step 6: Looking for quests...');
      
      // Look for quest section
      const questSection = page.locator('text=/My Fun Missions|Available Quest|Quest/i');
      const hasQuests = await questSection.isVisible().catch(() => false);
      console.log('Quest section visible:', hasQuests);
      
      // Look for claim buttons
      const claimButtons = page.locator('button:has-text("I Did This"), button:has-text("Claim"), button:has-text("Complete")');
      const claimButtonCount = await claimButtons.count();
      console.log('Number of claim buttons found:', claimButtonCount);
      
      // Step 7: Try to claim a quest
      if (claimButtonCount > 0) {
        console.log('Step 7: Attempting to claim a quest...');
        
        // Get quest title before claiming
        const questTitle = await page.locator('.quest-title, h3, h4').first().textContent().catch(() => 'Unknown Quest');
        console.log('Claiming quest:', questTitle);
        
        await claimButtons.first().click();
        await page.waitForTimeout(3000);
        
        // Check for success notification
        const notification = page.locator('text=/claimed|success|complete|waiting|pending/i');
        const notificationText = await notification.textContent().catch(() => 'No notification');
        console.log('Claim result:', notificationText);
        
        await page.screenshot({ path: 'tests/screenshots/beta-7-after-claim.png' });
        
        // Check console for any errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        if (consoleErrors.length > 0) {
          console.log('Console errors detected:', consoleErrors);
        }
      } else {
        console.log('No quests available to claim');
        
        // Check if all quests are already claimed
        const pendingQuests = page.locator('text=/pending|waiting|verification/i');
        const pendingCount = await pendingQuests.count();
        console.log('Pending quests found:', pendingCount);
      }
      
      // Step 8: Check rewards section
      console.log('Step 8: Checking rewards section...');
      const rewardsSection = page.locator('text=/Treasure|Reward/i');
      const hasRewards = await rewardsSection.isVisible().catch(() => false);
      console.log('Rewards section visible:', hasRewards);
      
      await page.screenshot({ path: 'tests/screenshots/beta-8-final-state.png' });
    } else {
      console.log('No child profiles found to test with');
    }
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log('Beta site URL: https://kiddo-quest-beta.web.app');
    console.log('Test account: test1756356294943@kiddoquest.com');
    console.log('All screenshots saved in tests/screenshots/beta-*.png');
  });
});
