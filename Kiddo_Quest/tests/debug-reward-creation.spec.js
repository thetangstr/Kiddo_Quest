const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Load test credentials
let testCredentials;
try {
  testCredentials = JSON.parse(fs.readFileSync('./test-credentials.json', 'utf8'));
} catch (error) {
  console.error('❌ Could not load test credentials');
  process.exit(1);
}

test.describe('Debug Reward Creation - Source Field Error', () => {

  test('Beta - Reproduce Reward Creation Error', async ({ page }) => {
    console.log('🐛 Debugging reward creation on Beta environment...');
    console.log(`📧 Using test user: ${testCredentials.user.email}`);
    
    // Track ALL console messages for debugging
    const allLogs = [];
    const errors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      const logEntry = {
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      };
      
      allLogs.push(logEntry);
      
      if (msg.type() === 'error') {
        errors.push(logEntry);
        console.log(`🚨 CONSOLE ERROR: ${text}`);
      }
      
      // Log our enhanced debugging messages
      if (text.includes('🎁') || text.includes('Starting') || text.includes('addReward')) {
        console.log(`📝 DEBUG LOG: ${text}`);
      }
    });

    // Navigate to beta
    await page.goto('https://kiddo-quest-beta.web.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: 'tests/screenshots/debug-reward-01-initial.png',
      fullPage: true 
    });

    console.log('🔑 Logging in...');
    
    // Login
    const emailInput = await page.locator('input[type="email"]');
    const passwordInput = await page.locator('input[type="password"]');
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill(testCredentials.user.email);
      await passwordInput.fill(testCredentials.user.password);
      
      // Use the specific email login button
      const emailLoginButton = await page.locator('button[type="submit"]').first();
      await emailLoginButton.click();
      
      await page.waitForTimeout(5000);
      console.log('✅ Login submitted');
    }

    await page.screenshot({ 
      path: 'tests/screenshots/debug-reward-02-after-login.png',
      fullPage: true 
    });

    // Check authentication
    const isAuthenticated = await page.locator('h1:has-text("Dashboard"), h2:has-text("Welcome"), button:has-text("Manage")').isVisible().catch(() => false);
    console.log(`🔓 Authenticated: ${isAuthenticated}`);

    if (isAuthenticated) {
      console.log('\\n🎁 Navigating to reward management...');
      
      // Navigate to rewards
      const manageRewardsButton = await page.locator('button:has-text("Manage Rewards"), a:has-text("Reward")').first();
      
      if (await manageRewardsButton.isVisible()) {
        await manageRewardsButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Navigated to reward management');
        
        await page.screenshot({ 
          path: 'tests/screenshots/debug-reward-03-reward-management.png' 
        });
        
        // Click create reward
        console.log('\\n📝 Attempting to create new reward...');
        
        const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
        
        if (await createButton.isVisible()) {
          await createButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ Clicked create button');
          
          await page.screenshot({ 
            path: 'tests/screenshots/debug-reward-04-create-form.png' 
          });
          
          // Fill out the form with minimal data
          console.log('\\n📝 Filling reward form...');
          
          const titleInput = await page.locator('input[name="title"]');
          const descInput = await page.locator('textarea[name="description"]');
          const costInput = await page.locator('input[name="cost"]');
          
          if (await titleInput.isVisible()) {
            await titleInput.fill('Debug Test Reward');
            console.log('✅ Filled title: "Debug Test Reward"');
          }
          
          if (await descInput.isVisible()) {
            await descInput.fill('Testing to reproduce source field undefined error');
            console.log('✅ Filled description');
          }
          
          if (await costInput.isVisible()) {
            await costInput.fill('25');
            console.log('✅ Filled cost: 25');
          }
          
          await page.screenshot({ 
            path: 'tests/screenshots/debug-reward-05-form-filled.png' 
          });
          
          // Now submit and watch for the error
          console.log('\\n🧪 SUBMITTING FORM - WATCHING FOR SOURCE FIELD ERROR...');
          
          const submitButton = await page.locator('button[type="submit"], button:has-text("Create")').first();
          
          if (await submitButton.isVisible()) {
            console.log('🚨 ABOUT TO SUBMIT - This should trigger the source field error');
            
            await submitButton.click();
            
            // Wait and watch for errors
            await page.waitForTimeout(8000);
            
            console.log('⏰ Waiting completed - checking for errors...');
          }
          
          await page.screenshot({ 
            path: 'tests/screenshots/debug-reward-06-after-submit.png' 
          });
          
        } else {
          console.log('❌ Create button not found');
        }
      } else {
        console.log('❌ Manage Rewards button not found');
      }
    } else {
      console.log('❌ Authentication failed');
    }

    // Analyze all the errors
    console.log('\\n🔍 ERROR ANALYSIS:');
    console.log(`Total console messages: ${allLogs.length}`);
    console.log(`Total errors: ${errors.length}`);
    
    const sourceFieldErrors = errors.filter(e => 
      e.text.includes('addDoc') && e.text.includes('source') && e.text.includes('undefined')
    );
    
    console.log(`Source field errors: ${sourceFieldErrors.length}`);
    
    if (sourceFieldErrors.length > 0) {
      console.log('\\n🚨 SOURCE FIELD ERRORS FOUND:');
      sourceFieldErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
      });
      console.log('\\n❌ MY FIX IS NOT WORKING!');
    } else {
      console.log('\\n✅ No source field errors detected');
    }
    
    // Show other errors
    if (errors.length > 0) {
      console.log('\\n🐛 ALL ERRORS DETECTED:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.text}`);
      });
    }
    
    // Show debug logs
    const debugLogs = allLogs.filter(log => 
      log.text.includes('🎁') || 
      log.text.includes('addReward') ||
      log.text.includes('Starting') ||
      log.text.includes('DEBUG')
    );
    
    if (debugLogs.length > 0) {
      console.log('\\n📝 DEBUG LOGS CAPTURED:');
      debugLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.text}`);
      });
    } else {
      console.log('\\n⚠️ No debug logs captured - logging may not be working');
    }

    await page.screenshot({ 
      path: 'tests/screenshots/debug-reward-07-final.png',
      fullPage: true 
    });

    // Final assessment
    console.log('\\n📊 FINAL ASSESSMENT:');
    console.log(`Authentication: ${isAuthenticated ? '✅' : '❌'}`);
    console.log(`Source field errors: ${sourceFieldErrors.length > 0 ? '❌ STILL PRESENT' : '✅ None detected'}`);
    console.log(`Fix working: ${sourceFieldErrors.length === 0 ? '✅ YES' : '❌ NO - NEEDS INVESTIGATION'}`);
  });
});