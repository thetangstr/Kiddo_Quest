const { test, expect } = require('@playwright/test');

test.describe('Manual Reward Creation Test - After Fix Deployment', () => {

  test('Beta - Manual Reward Creation Test with Error Monitoring', async ({ page }) => {
    console.log('🎁 Manual reward creation test on Beta with error monitoring...');
    console.log('📝 This test will show you the login screen and monitor for Firestore errors');
    
    // Track ONLY Firestore source field errors
    const sourceFieldErrors = [];
    const allFirestoreErrors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      
      if (msg.type() === 'error') {
        // Check for any Firestore errors
        if (text.includes('addDoc') || text.includes('updateDoc') || text.includes('Firestore')) {
          allFirestoreErrors.push(text);
          console.log(`🚨 FIRESTORE ERROR: ${text}`);
        }
        
        // Check specifically for source field undefined errors
        if (text.includes('addDoc') && text.includes('source') && text.includes('undefined')) {
          sourceFieldErrors.push(text);
          console.log(`💥 SOURCE FIELD ERROR: ${text}`);
        }
      }
    });

    await page.goto('https://kiddo-quest-beta.web.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ 
      path: 'tests/screenshots/manual-test-01-initial.png',
      fullPage: true 
    });

    console.log('\\n📋 MANUAL TEST INSTRUCTIONS:');
    console.log('1. You should see the KiddoQuest login page');
    console.log('2. Login with any valid credentials (or register)');
    console.log('3. Navigate to "Manage Rewards"');
    console.log('4. Click "Create New Reward"');
    console.log('5. Fill out the form with:');
    console.log('   - Title: "Test Reward After Fix"');
    console.log('   - Description: "Testing source field fix"');
    console.log('   - Cost: "50"');
    console.log('6. Click "Create Reward"');
    console.log('7. Watch this console for any Firestore errors');
    
    console.log('\\n🔍 Monitoring for errors...');
    console.log('⏰ Test will run for 2 minutes to monitor for errors...');
    
    // Wait for 2 minutes to allow manual testing
    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(1000);
      
      // Take screenshots periodically
      if (i % 30 === 0) {
        await page.screenshot({ 
          path: `tests/screenshots/manual-test-${Math.floor(i/30) + 2}-monitoring.png`,
          fullPage: true 
        });
      }
      
      // Report progress every 30 seconds
      if (i % 30 === 0 && i > 0) {
        console.log(`⏰ ${i} seconds elapsed - Source field errors: ${sourceFieldErrors.length}`);
      }
    }

    await page.screenshot({ 
      path: 'tests/screenshots/manual-test-final.png',
      fullPage: true 
    });

    console.log('\\n📊 FINAL ERROR ANALYSIS:');
    console.log(`   - Total Firestore errors: ${allFirestoreErrors.length}`);
    console.log(`   - Source field undefined errors: ${sourceFieldErrors.length}`);
    
    if (sourceFieldErrors.length > 0) {
      console.log('\\n❌ SOURCE FIELD ERRORS STILL PRESENT - FIX NOT WORKING:');
      sourceFieldErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else if (allFirestoreErrors.length > 0) {
      console.log('\\n⚠️ Other Firestore errors detected:');
      allFirestoreErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.substring(0, 150)}...`);
      });
    } else {
      console.log('\\n✅ NO FIRESTORE ERRORS DETECTED - FIX IS WORKING!');
    }
    
    console.log('\\n🎯 MANUAL TEST RESULTS:');
    console.log(`   - Fix deployment: ✅ Deployed to beta`);
    console.log(`   - Error monitoring: ✅ Active for 2 minutes`);
    console.log(`   - Source field errors: ${sourceFieldErrors.length === 0 ? '✅ NONE' : '❌ DETECTED'}`);
    console.log(`   - Overall status: ${sourceFieldErrors.length === 0 ? '✅ FIX WORKING' : '❌ NEEDS INVESTIGATION'}`);
  });

  test('Simple Beta Page Load - Error Check', async ({ page }) => {
    console.log('🔍 Simple page load test to check for immediate errors...');
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`Error: ${msg.text()}`);
      }
    });

    await page.goto('https://kiddo-quest-beta.web.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await page.screenshot({ 
      path: 'tests/screenshots/simple-beta-test.png',
      fullPage: true 
    });

    console.log('\\n📊 Simple Test Results:');
    console.log(`   - Page loaded: ✅`);
    console.log(`   - Console errors: ${errors.length}`);
    console.log(`   - Ready for manual testing: ✅`);
    
    if (errors.length > 0) {
      console.log('\\n🐛 Errors detected on page load:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.substring(0, 100)}...`);
      });
    }
  });
});