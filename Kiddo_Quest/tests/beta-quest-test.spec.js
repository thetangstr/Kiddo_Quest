const { test, expect } = require('@playwright/test');

test.describe('Beta Quest Claiming Test', () => {
  test('Login and test quest claiming functionality', async ({ page }) => {
    // Use the newly created test account
    const testEmail = 'test1756412395505@kiddoquest.com';
    const testPassword = 'TestKiddo123!';
    
    console.log('Testing beta site with account:', testEmail);
    
    // Navigate to beta site
    await page.goto('https://kiddo-quest-beta.web.app');
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In with Email")');
    
    // Wait for login
    await page.waitForTimeout(5000);
    
    // Check if logged in - look for child profiles or dashboard
    const loggedIn = await page.locator('text=/Alice|Bob|Dashboard|Profile/i').isVisible({ timeout: 10000 }).catch(() => false);
    console.log('Login successful:', loggedIn);
    
    if (loggedIn) {
      await page.screenshot({ path: 'tests/screenshots/beta-logged-in-success.png' });
      
      // Try to click on Alice's profile
      const aliceProfile = page.locator('text=Alice').first();
      if (await aliceProfile.isVisible()) {
        console.log('Clicking on Alice profile...');
        await aliceProfile.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'tests/screenshots/beta-alice-dashboard.png' });
        
        // Look for quest claim buttons
        const claimButtons = page.locator('button:has-text("I Did This")');
        const buttonCount = await claimButtons.count();
        console.log('Found', buttonCount, 'quest claim buttons');
        
        if (buttonCount > 0) {
          console.log('Claiming first quest...');
          await claimButtons.first().click();
          await page.waitForTimeout(2000);
          
          // Check for success message
          const successMessage = await page.locator('text=/claimed|success|waiting|pending/i').textContent().catch(() => 'No message');
          console.log('Quest claim result:', successMessage);
          
          await page.screenshot({ path: 'tests/screenshots/beta-quest-claimed.png' });
          
          // The quest should now show as "pending verification"
          const pendingQuest = await page.locator('text=/pending|verification|waiting/i').isVisible().catch(() => false);
          console.log('Quest pending verification:', pendingQuest);
          
          if (pendingQuest) {
            console.log('✅ Quest claiming is working! Quest is now pending parent verification.');
          } else {
            console.log('❌ Quest claim may have failed - no pending status found');
          }
        } else {
          console.log('❌ No quest claim buttons found');
        }
        
        // Check rewards section
        const rewardsSection = await page.locator('text=/Treasure|Reward/i').isVisible().catch(() => false);
        console.log('Rewards section visible:', rewardsSection);
        
      } else {
        console.log('❌ Alice profile not found');
      }
    } else {
      console.log('❌ Login failed');
      await page.screenshot({ path: 'tests/screenshots/beta-login-failed.png' });
    }
  });
});
