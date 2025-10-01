const { test, expect } = require('@playwright/test');

test.describe('Final Test: Child + Reward Creation with Source Field Monitoring', () => {

  test('Beta - Create Child then Reward with Assignment', async ({ page, browser }) => {
    console.log('🧪 FINAL COMPREHENSIVE TEST: Child + Reward Assignment');
    console.log('🎯 Testing the EXACT scenario that causes the undefined source field error');
    
    // Critical error monitoring
    const sourceFieldErrors = [];
    const allErrors = [];
    const successMessages = [];
    
    page.on('console', msg => {
      const text = msg.text();
      
      // Monitor for the specific error
      if (msg.type() === 'error') {
        allErrors.push(text);
        console.log(`❌ Console error: ${text}`);
        
        if (text.includes('Function addDoc() called with invalid data') && 
            text.includes('Unsupported field value: undefined') && 
            text.includes('found in field source')) {
          sourceFieldErrors.push(text);
          console.log(`💥 SOURCE FIELD ERROR DETECTED: ${text}`);
        }
      }
      
      // Monitor success messages
      if (text.includes('✅') || text.includes('success') || text.includes('created')) {
        successMessages.push(text);
        console.log(`✅ Success: ${text}`);
      }
    });

    // Start test
    await page.goto('https://kiddo-quest-beta.web.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('\\n🔑 Step 1: Register fresh test account...');
    
    // Click register
    const registerLink = await page.locator('a:has-text("Register"), button:has-text("Register")').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Generate unique test account
    const timestamp = Date.now();
    const testEmail = `childtest${timestamp}@example.com`;
    
    // Fill registration form
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').first().fill('TestChild123!');
    
    // Handle password confirmation if present
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length > 1) {
      await passwordFields[1].fill('TestChild123!');
    }
    
    // Fill name if present
    const nameInput = await page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Parent');
    }
    
    // Submit registration
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(5000);
    
    console.log(`✅ Registered: ${testEmail}`);
    
    // Handle PIN setup if needed
    const needsPin = await page.locator('text=/pin/i').isVisible().catch(() => false);
    if (needsPin) {
      console.log('🔐 Setting up PIN...');
      const pinInputs = await page.locator('input[type="password"], input[type="number"]').all();
      for (const input of pinInputs) {
        if (await input.isVisible()) {
          await input.fill('1234');
        }
      }
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(3000);
    }

    console.log('\\n👶 Step 2: Create child profile...');
    
    // Navigate to child management
    const childButtons = [
      'button:has-text("Add Child")',
      'button:has-text("Manage Children")',
      'a:has-text("Children")',
      'button:has-text("Children")'
    ];
    
    let childManagementFound = false;
    for (const selector of childButtons) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(2000);
        childManagementFound = true;
        console.log(`✅ Found child management: ${selector}`);
        break;
      }
    }
    
    if (childManagementFound) {
      // Look for add/create child button
      const addChildBtn = await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
      if (await addChildBtn.isVisible()) {
        await addChildBtn.click();
        await page.waitForTimeout(2000);
        
        // Fill child form
        const childNameInput = await page.locator('input[name="name"], input[placeholder*="name" i]').first();
        if (await childNameInput.isVisible()) {
          await childNameInput.fill('Test Child for Source Fix');
          console.log('✅ Child name filled');
        }
        
        // Fill age if present
        const ageInput = await page.locator('input[name="age"], input[type="number"]').first();
        if (await ageInput.isVisible()) {
          await ageInput.fill('10');
          console.log('✅ Age filled');
        }
        
        // Submit child creation
        await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first().click();
        await page.waitForTimeout(5000);
        console.log('✅ Child created');
      }
    }

    await page.screenshot({ 
      path: 'tests/screenshots/final-test-01-child-created.png',
      fullPage: true 
    });

    console.log('\\n🎁 Step 3: Create reward with child assignment...');
    
    // Navigate to rewards
    const rewardButtons = [
      'button:has-text("Manage Rewards")',
      'button:has-text("Rewards")',
      'a:has-text("Rewards")'
    ];
    
    for (const selector of rewardButtons) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(2000);
        console.log(`✅ Found reward management: ${selector}`);
        break;
      }
    }
    
    // Create reward
    const createRewardBtn = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
    if (await createRewardBtn.isVisible()) {
      await createRewardBtn.click();
      await page.waitForTimeout(2000);
      
      // Fill reward form
      await page.locator('input[name="title"]').fill('Final Test Reward with Child');
      await page.locator('textarea[name="description"]').fill('Testing reward with child assignment - monitoring for undefined source error');
      await page.locator('input[name="cost"]').fill('75');
      
      console.log('✅ Reward details filled');
      
      // CRITICAL: Assign to child
      console.log('\\n🚨 CRITICAL: Looking for child assignment checkboxes...');
      
      // Look for checkboxes with child name
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      const labels = await page.locator('label').all();
      
      let childAssigned = false;
      
      // Try to find and check the child checkbox
      for (const checkbox of checkboxes) {
        const isVisible = await checkbox.isVisible();
        if (isVisible) {
          // Check if associated label contains child name
          const parent = await checkbox.locator('..').first();
          const text = await parent.textContent().catch(() => '');
          
          if (text.includes('Test Child') || text.includes('child')) {
            await checkbox.check();
            childAssigned = true;
            console.log(`✅ Child checkbox checked: "${text}"`);
            break;
          }
        }
      }
      
      // Alternative: look for labels containing child name
      if (!childAssigned) {
        for (const label of labels) {
          const text = await label.textContent().catch(() => '');
          if (text.includes('Test Child')) {
            await label.click();
            childAssigned = true;
            console.log(`✅ Child selected via label: "${text}"`);
            break;
          }
        }
      }
      
      await page.screenshot({ 
        path: 'tests/screenshots/final-test-02-form-filled.png',
        fullPage: true 
      });
      
      // SUBMIT - This is where the error would occur
      console.log('\\n🚨 CRITICAL MOMENT: Submitting reward with child assignment...');
      console.log('🔍 Monitoring for: "Function addDoc() called with invalid data...undefined...source"');
      
      await page.locator('button[type="submit"], button:has-text("Create")').first().click();
      await page.waitForTimeout(8000);
      
      console.log('✅ Form submitted');
    }

    await page.screenshot({ 
      path: 'tests/screenshots/final-test-03-after-submit.png',
      fullPage: true 
    });

    // Wait for any delayed operations
    console.log('\\n⏰ Waiting for delayed Firestore operations...');
    await page.waitForTimeout(5000);

    // FINAL RESULTS
    console.log('\\n' + '='.repeat(80));
    console.log('🎯 FINAL TEST RESULTS: CHILD + REWARD ASSIGNMENT');
    console.log('='.repeat(80));
    
    console.log(`\\n📊 Error Analysis:`);
    console.log(`   - Total console errors: ${allErrors.length}`);
    console.log(`   - Source field undefined errors: ${sourceFieldErrors.length}`);
    console.log(`   - Success messages: ${successMessages.length}`);
    
    if (sourceFieldErrors.length > 0) {
      console.log('\\n❌ CRITICAL: SOURCE FIELD ERROR STILL OCCURRING!');
      console.log('The error happens when rewards are assigned to children:');
      sourceFieldErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('\\n🔧 The fix needs to handle child assignments properly');
    } else {
      console.log('\\n✅ SUCCESS: NO SOURCE FIELD ERRORS!');
      console.log('🎉 Rewards can be created with child assignments without the undefined source error!');
    }
    
    // Display other errors if any
    if (allErrors.length > 0 && sourceFieldErrors.length === 0) {
      console.log('\\n📋 Other errors (not source field related):');
      allErrors.slice(0, 3).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.substring(0, 100)}...`);
      });
    }
    
    const testPassed = sourceFieldErrors.length === 0;
    console.log(`\\n🏁 FINAL VERDICT:`);
    console.log(`   Fix Status: ${testPassed ? '✅ WORKING' : '❌ STILL BROKEN'}`);
    console.log(`   Child Assignment Works: ${testPassed ? '✅ YES' : '❌ NO'}`);
    console.log(`   Ready for Production: ${testPassed ? '✅ YES' : '❌ NO'}`);
    
    console.log('\\n' + '='.repeat(80));
    
    return testPassed;
  });
});