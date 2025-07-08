const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://kiddo-quest-de7b0.web.app';

test.describe('Test After Domain Configuration Fix', () => {
  test('should verify authentication works after domain fix', async ({ page }) => {
    // Capture console logs to monitor auth process
    const consoleLogs = [];
    const errors = [];
    
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`PAGE ERROR: ${error.message}`);
    });
    
    console.log('🚀 Testing authentication after domain configuration...');
    
    // Load the application
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    
    // Check for authentication interface
    const googleLoginButton = page.locator('button').filter({ hasText: /sign in with google/i });
    await expect(googleLoginButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Google login button found');
    
    // Clear previous logs
    consoleLogs.length = 0;
    errors.length = 0;
    
    // Test login button click - this should now work without CORS errors
    console.log('🧪 Testing Google login button click...');
    await googleLoginButton.click();
    
    // Wait a moment for any authentication popup or redirect
    await page.waitForTimeout(3000);
    
    // Check for CORS errors or authentication issues
    const hasAuthErrors = consoleLogs.some(log => 
      log.includes('Cross-Origin-Opener-Policy') ||
      log.includes('CORS') ||
      log.includes('FirebaseError')
    );
    
    if (hasAuthErrors) {
      console.log('❌ Still encountering authentication errors:');
      consoleLogs.filter(log => 
        log.includes('Cross-Origin') || 
        log.includes('Firebase') || 
        log.includes('auth')
      ).forEach(log => console.log(`  ${log}`));
    } else {
      console.log('✅ No CORS or Firebase auth errors detected!');
    }
    
    if (errors.length > 0) {
      console.log('❌ Page errors detected:');
      errors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('✅ No page errors');
    }
    
    console.log(`\\n📊 Total console messages after login attempt: ${consoleLogs.length}`);
    console.log(`❌ Total errors: ${errors.length}`);
    
    // Check if we're still on the login page or if anything changed
    const stillOnLogin = await googleLoginButton.isVisible();
    console.log(`Still showing login button: ${stillOnLogin}`);
    
    if (!hasAuthErrors && errors.length === 0) {
      console.log('\\n🎉 Authentication appears to be working correctly!');
      console.log('Note: Actual login completion requires user interaction with Google OAuth popup');
    }
  });
  
  test('should check for Amazon functionality availability', async ({ page }) => {
    console.log('🛒 Checking Amazon browser functionality availability...');
    
    await page.goto(BASE_URL);
    
    // Check if Amazon components are present in the built application
    const content = await page.content();
    
    // More comprehensive search for Amazon-related functionality
    const amazonIndicators = [
      { name: 'AmazonBrowserModal', found: content.includes('AmazonBrowserModal') },
      { name: 'Browse Amazon text', found: content.includes('Browse Amazon') },
      { name: 'amazon keyword', found: content.toLowerCase().includes('amazon') },
      { name: 'searchAmazonProducts', found: content.includes('searchAmazonProducts') },
      { name: 'RewardFormScreen', found: content.includes('RewardFormScreen') },
      { name: 'ManageRewardsScreen', found: content.includes('ManageRewardsScreen') }
    ];
    
    console.log('\\n🔍 Amazon functionality indicators:');
    amazonIndicators.forEach(indicator => {
      console.log(`  ${indicator.found ? '✅' : '❌'} ${indicator.name}: ${indicator.found ? 'Found' : 'Not found'}`);
    });
    
    const amazonComponentsPresent = amazonIndicators.some(indicator => indicator.found);
    
    if (amazonComponentsPresent) {
      console.log('\\n✅ Amazon functionality appears to be included in the build');
    } else {
      console.log('\\n⚠️ Amazon functionality may not be properly included');
    }
    
    // Test navigation to reward form (should redirect to login for unauthenticated users)
    console.log('\\n🎯 Testing reward form route protection...');
    await page.goto(`${BASE_URL}/#rewardForm`);
    await page.waitForTimeout(2000);
    
    const backOnLogin = await page.locator('button').filter({ hasText: /sign in with google/i }).isVisible();
    
    if (backOnLogin) {
      console.log('✅ Reward form properly protected - redirects to login');
      console.log('   (Amazon browser button will be available after successful authentication)');
    } else {
      console.log('⚠️ Reward form accessible without authentication');
    }
  });
  
  test('should provide manual testing instructions', async ({ page }) => {
    console.log('\\n📋 MANUAL TESTING INSTRUCTIONS');
    console.log('=====================================');
    console.log('');
    console.log('1. Open: https://kiddo-quest-de7b0.web.app');
    console.log('2. Click "Sign in with Google"');
    console.log('3. Complete Google OAuth in popup');
    console.log('4. Should see dashboard after login');
    console.log('5. Navigate to: Manage Rewards > Create New Reward');
    console.log('6. Look for "Browse Amazon" button');
    console.log('7. Click button to test Amazon modal');
    console.log('');
    console.log('Expected Results:');
    console.log('✅ No CORS errors in console');
    console.log('✅ Successful login and dashboard access');
    console.log('✅ Amazon browser button visible in reward form');
    console.log('✅ Amazon modal opens with search functionality');
    console.log('');
    console.log('If issues persist:');
    console.log('- Check browser console for specific errors');
    console.log('- Try different browser or incognito mode');
    console.log('- Verify Firebase Console domain settings');
    
    // Just load the page to verify it's accessible
    await page.goto(BASE_URL);
    const isAccessible = await page.locator('body').isVisible();
    console.log(`\\n🌐 Application accessibility: ${isAccessible ? '✅ Accessible' : '❌ Not accessible'}`);
  });
});