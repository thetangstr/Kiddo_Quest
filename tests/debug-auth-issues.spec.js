const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://kiddo-quest-de7b0.web.app';

test.describe('Debug Authentication Issues', () => {
  test('should check authentication state and console logs', async ({ page }) => {
    // Capture console logs
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
    
    console.log('🔍 Loading application and checking for errors...');
    
    // Load the application
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000); // Wait for initial load
    
    // Check for any JavaScript errors
    console.log('\\n📊 CONSOLE LOGS:');
    consoleLogs.forEach(log => console.log(`  ${log}`));
    
    if (errors.length > 0) {
      console.log('\\n❌ PAGE ERRORS:');
      errors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\\n✅ No page errors detected');
    }
    
    // Check if Google login button is present and functional
    console.log('\\n🔍 Checking authentication interface...');
    
    const googleLoginButton = page.locator('button').filter({ hasText: /sign in with google/i });
    const isLoginButtonVisible = await googleLoginButton.isVisible();
    
    if (isLoginButtonVisible) {
      console.log('✅ Google login button is visible');
      
      // Check button attributes and state
      const buttonText = await googleLoginButton.textContent();
      const isEnabled = await googleLoginButton.isEnabled();
      
      console.log(`   Button text: "${buttonText}"`);
      console.log(`   Button enabled: ${isEnabled}`);
      
      // Test clicking the button and see what happens
      console.log('\\n🧪 Testing login button interaction...');
      
      // Clear previous console logs
      consoleLogs.length = 0;
      
      await googleLoginButton.click();
      await page.waitForTimeout(2000);
      
      // Check what happened after click
      console.log('\\n📊 LOGS AFTER LOGIN BUTTON CLICK:');
      consoleLogs.forEach(log => console.log(`  ${log}`));
      
      // Check if any popup was attempted
      const hasFirebaseAuthErrors = consoleLogs.some(log => 
        log.includes('Firebase') || 
        log.includes('auth') || 
        log.includes('popup') ||
        log.includes('Cross-Origin')
      );
      
      if (hasFirebaseAuthErrors) {
        console.log('\\n⚠️ Firebase authentication issues detected in console');
      } else {
        console.log('\\n✅ No obvious Firebase auth errors in console');
      }
      
    } else {
      console.log('❌ Google login button is NOT visible');
    }
    
    // Check if the application loads the correct Firebase config
    console.log('\\n🔍 Checking Firebase configuration...');
    
    const firebaseConfigLogs = consoleLogs.filter(log => 
      log.includes('firebase') || 
      log.includes('Firebase') ||
      log.includes('auth')
    );
    
    if (firebaseConfigLogs.length > 0) {
      console.log('📊 Firebase-related logs:');
      firebaseConfigLogs.forEach(log => console.log(`  ${log}`));
    }
    
    console.log('\\n🎯 SUMMARY:');
    console.log(`✅ Application loaded: ${await page.locator('body').isVisible()}`);
    console.log(`✅ Google login button visible: ${isLoginButtonVisible}`);
    console.log(`📊 Total console messages: ${consoleLogs.length}`);
    console.log(`❌ Page errors: ${errors.length}`);
    
    if (errors.length === 0 && isLoginButtonVisible) {
      console.log('\\n🎉 Basic application functionality appears to be working!');
      console.log('\\nIf login still fails, the issue may be:');
      console.log('1. Firebase Auth domain configuration');
      console.log('2. CORS policy settings');
      console.log('3. Firestore security rules');
    }
  });
  
  test('should check for Amazon browser functionality', async ({ page }) => {
    console.log('🛒 Checking for Amazon browser functionality...');
    
    await page.goto(BASE_URL);
    
    // Check if Amazon-related code exists in the page source
    const content = await page.content();
    
    const amazonKeywords = [
      'AmazonBrowserModal',
      'Browse Amazon',
      'amazon',
      'searchAmazonProducts'
    ];
    
    console.log('\\n🔍 Checking for Amazon-related code:');
    amazonKeywords.forEach(keyword => {
      const found = content.includes(keyword);
      console.log(`  ${found ? '✅' : '❌'} "${keyword}": ${found ? 'Found' : 'Not found'}`);
    });
    
    // Try to navigate to the reward form page
    console.log('\\n🎯 Testing reward form access...');
    await page.goto(`${BASE_URL}/#rewardForm`);
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check if we're redirected to login (expected behavior)
    const isOnLoginPage = await page.locator('button').filter({ hasText: /sign in with google/i }).isVisible();
    
    if (isOnLoginPage) {
      console.log('✅ Reward form properly protected - redirects to login');
    } else {
      console.log('⚠️ Reward form accessible without authentication');
      
      // If accessible, check for Amazon button
      const amazonButton = page.locator('button').filter({ hasText: /browse amazon/i });
      const hasAmazonButton = await amazonButton.isVisible();
      
      console.log(`Amazon button visible: ${hasAmazonButton}`);
    }
  });
});