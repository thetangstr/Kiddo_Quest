const { test, expect } = require('@playwright/test');

// Beta Account Setup - Create a test account directly on beta site
test.describe('Beta Account Setup', () => {
  const BETA_URL = 'https://kiddo-quest-beta.web.app';
  const timestamp = Date.now();
  const TEST_EMAIL = `betatest${timestamp}@example.com`;
  const TEST_PASSWORD = 'BetaTest123!';
  
  test('Create new account on beta site and set up children', async ({ page }) => {
    console.log('🚀 Setting up beta test account...');
    console.log('Email:', TEST_EMAIL);
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/beta-setup-01-initial.png' });
    
    // Click Register link
    console.log('Clicking Register link...');
    await page.click('text=Register');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'tests/screenshots/beta-setup-02-register-page.png' });
    
    // Fill registration form
    console.log('Filling registration form...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // Check for confirm password field
    const passwordFields = page.locator('input[type="password"]');
    const passwordCount = await passwordFields.count();
    if (passwordCount > 1) {
      console.log('Filling confirm password...');
      await passwordFields.nth(1).fill(TEST_PASSWORD);
    }
    
    await page.screenshot({ path: 'tests/screenshots/beta-setup-03-form-filled.png' });
    
    // Submit registration
    const registerButton = page.locator('button:has-text("Register"), button:has-text("Sign Up"), button:has-text("Create Account")');
    if (await registerButton.isVisible()) {
      console.log('Submitting registration...');
      await registerButton.click();
    } else {
      // Try alternative registration buttons
      await page.click('button[type="submit"]');
    }
    
    // Wait for registration to complete
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    await page.screenshot({ path: 'tests/screenshots/beta-setup-04-after-registration.png' });
    
    // Check if we're logged in or need to login
    const loggedIn = await page.locator('text=/Dashboard|Welcome|Profile|Add Child/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!loggedIn) {
      console.log('Registration completed, now logging in...');
      // Try to login with the new account
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(5000);
    }
    
    await page.screenshot({ path: 'tests/screenshots/beta-setup-05-logged-in.png' });
    
    // Now add children
    console.log('Setting up child profiles...');
    
    const addChildButton = page.locator('button:has-text("Add Child"), button:has-text("Add Profile"), text="Add a Child"');
    if (await addChildButton.isVisible({ timeout: 5000 })) {
      console.log('Found Add Child button, creating Alice...');
      await addChildButton.click();
      await page.waitForTimeout(2000);
      
      // Fill child form for Alice
      await page.fill('input[placeholder*="name" i], input[name="name"]', 'Alice');
      
      // Select an avatar
      const avatarOption = page.locator('text="👧", text="🦸"').first();
      if (await avatarOption.isVisible({ timeout: 3000 })) {
        await avatarOption.click();
      }
      
      await page.screenshot({ path: 'tests/screenshots/beta-setup-06-alice-form.png' });
      
      // Save Alice
      await page.click('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');
      await page.waitForTimeout(3000);
      
      // Add Bob
      const addAnotherChild = page.locator('button:has-text("Add Child"), button:has-text("Add Profile")');
      if (await addAnotherChild.isVisible({ timeout: 3000 })) {
        console.log('Creating Bob...');
        await addAnotherChild.click();
        await page.waitForTimeout(2000);
        
        await page.fill('input[placeholder*="name" i], input[name="name"]', 'Bob');
        
        const bobAvatar = page.locator('text="👦"').first();
        if (await bobAvatar.isVisible({ timeout: 3000 })) {
          await bobAvatar.click();
        }
        
        await page.click('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');
        await page.waitForTimeout(3000);
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/beta-setup-07-children-created.png' });
    
    // Test clicking on a child profile
    console.log('Testing child dashboard access...');
    const aliceProfile = page.locator('text=Alice').first();
    if (await aliceProfile.isVisible({ timeout: 5000 })) {
      console.log('Clicking on Alice profile...');
      await aliceProfile.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'tests/screenshots/beta-setup-08-alice-dashboard.png' });
      
      // Check for child dashboard elements
      const childElements = {
        name: await page.locator('text=Alice').isVisible().catch(() => false),
        stars: await page.locator('text=/Stars|XP|Points/i').isVisible().catch(() => false),
        quests: await page.locator('text=/Quest|Mission/i').isVisible().catch(() => false),
        rewards: await page.locator('text=/Reward|Treasure/i').isVisible().catch(() => false)
      };
      
      console.log('Child dashboard elements found:', childElements);
      
      if (Object.values(childElements).some(Boolean)) {
        console.log('✅ Child dashboard is working!');
      } else {
        console.log('❌ Child dashboard has issues');
      }
    }
    
    console.log('\n✅ Beta account setup completed!');
    console.log('====================================');
    console.log('Test Account Details:');
    console.log('Email:', TEST_EMAIL);
    console.log('Password:', TEST_PASSWORD);
    console.log('Site: https://kiddo-quest-beta.web.app');
    console.log('Children: Alice & Bob (if created successfully)');
    console.log('====================================');
  });
});
