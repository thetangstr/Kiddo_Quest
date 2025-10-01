const { test, expect } = require('@playwright/test');

test.describe('Beta Site Tests', () => {
  test.use({ 
    baseURL: 'https://kiddo-quest-beta.web.app',
    ignoreHTTPSErrors: true 
  });

  test('Beta site loads successfully', async ({ page }) => {
    // Navigate to the beta site
    await page.goto('https://kiddo-quest-beta.web.app');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Kiddo Quest/i);
    
    // Check for login elements
    const loginForm = page.locator('form').first();
    await expect(loginForm).toBeVisible({ timeout: 10000 });
    
    // Check for email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'tests/screenshots/beta-site.png' });
  });

  test('Can login with test account', async ({ page }) => {
    await page.goto('https://kiddo-quest-beta.web.app');
    await page.waitForLoadState('networkidle');
    
    // Enter test credentials
    await page.fill('input[type="email"]', 'test1756356294943@kiddoquest.com');
    await page.fill('input[type="password"]', 'TestKiddo123!');
    
    // Click login button
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if we're logged in (should see dashboard or children)
    const dashboardVisible = await page.locator('text=/Dashboard|Children|Quest/i').isVisible().catch(() => false);
    expect(dashboardVisible).toBeTruthy();
    
    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/beta-logged-in.png' });
  });

  test('Child can view and claim quests', async ({ page }) => {
    // Login first
    await page.goto('https://kiddo-quest-beta.web.app');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test1756356294943@kiddoquest.com');
    await page.fill('input[type="password"]', 'TestKiddo123!');
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click on a child profile (Alice or Bob)
    const childProfile = page.locator('text=/Alice|Bob/i').first();
    if (await childProfile.isVisible()) {
      await childProfile.click();
      await page.waitForLoadState('networkidle');
      
      // Check for quests
      const questsSection = page.locator('text=/My Fun Missions|Available Quests/i');
      await expect(questsSection).toBeVisible({ timeout: 5000 });
      
      // Check for "I Did This!" button
      const claimButton = page.locator('button:has-text("I Did This")');
      const buttonCount = await claimButton.count();
      
      console.log(`Found ${buttonCount} claim buttons`);
      
      // Try to claim a quest if available
      if (buttonCount > 0) {
        await claimButton.first().click();
        
        // Check for success notification
        await page.waitForTimeout(2000);
        const notification = page.locator('text=/claimed|success|waiting/i');
        const notificationVisible = await notification.isVisible().catch(() => false);
        
        console.log('Quest claim notification visible:', notificationVisible);
      }
      
      // Take a screenshot
      await page.screenshot({ path: 'tests/screenshots/beta-child-dashboard.png' });
    }
  });
});
