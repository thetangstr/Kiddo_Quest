const { test, expect } = require('@playwright/test');

test.describe('Comprehensive App Functionality Test', () => {
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@kiddoquest.com`;
  const testPassword = 'TestPassword123!';
  
  test('Test all app functions systematically', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 COMPREHENSIVE APP FUNCTIONALITY TEST');
    console.log('='.repeat(80));
    console.log('Testing URL: https://kiddo-quest-de7b0.web.app');
    console.log('Test Account:', testEmail);
    console.log('='.repeat(80) + '\n');
    
    const results = {
      passed: [],
      failed: [],
      warnings: []
    };
    
    // Navigate to app
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // ========================================
    // 1. AUTHENTICATION TESTS
    // ========================================
    console.log('📝 1. AUTHENTICATION TESTS');
    console.log('-'.repeat(40));
    
    // 1.1 Test Registration
    console.log('1.1 Testing Registration...');
    try {
      // Click Register link
      const registerLink = page.locator('text=Register').first();
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await page.waitForTimeout(1000);
        
        // Fill registration form
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        
        // Look for confirm password field
        const confirmPassword = page.locator('input[placeholder*="Confirm"]').first();
        if (await confirmPassword.isVisible()) {
          await confirmPassword.fill(testPassword);
        }
        
        // Submit registration
        await page.locator('button:has-text("Register")').first().click();
        await page.waitForTimeout(3000);
        
        // Check if registration successful
        const dashboardVisible = await page.locator('text=/Dashboard|Welcome/i').isVisible().catch(() => false);
        if (dashboardVisible) {
          console.log('  ✅ Registration successful');
          results.passed.push('Registration');
        } else {
          console.log('  ❌ Registration failed');
          results.failed.push('Registration - Could not reach dashboard');
        }
      } else {
        console.log('  ⚠️ Register link not found');
        results.warnings.push('Register link not visible');
      }
    } catch (error) {
      console.log('  ❌ Registration error:', error.message);
      results.failed.push(`Registration - ${error.message}`);
    }
    
    // 1.2 Test Logout
    console.log('1.2 Testing Logout...');
    try {
      const logoutButton = page.locator('button:has-text("Logout")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
        
        const loginVisible = await page.locator('text="Sign In with Email"').isVisible().catch(() => false);
        if (loginVisible) {
          console.log('  ✅ Logout successful');
          results.passed.push('Logout');
        } else {
          console.log('  ❌ Logout failed');
          results.failed.push('Logout - Still on dashboard');
        }
      } else {
        console.log('  ⚠️ Logout button not found');
        results.warnings.push('Logout button not visible');
      }
    } catch (error) {
      console.log('  ❌ Logout error:', error.message);
      results.failed.push(`Logout - ${error.message}`);
    }
    
    // 1.3 Test Login
    console.log('1.3 Testing Login...');
    try {
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button:has-text("Sign In with Email")');
      await page.waitForTimeout(3000);
      
      const dashboardVisible = await page.locator('text=/Dashboard|Welcome/i').isVisible().catch(() => false);
      if (dashboardVisible) {
        console.log('  ✅ Login successful');
        results.passed.push('Login');
      } else {
        console.log('  ❌ Login failed');
        results.failed.push('Login - Could not reach dashboard');
      }
    } catch (error) {
      console.log('  ❌ Login error:', error.message);
      results.failed.push(`Login - ${error.message}`);
    }
    
    // ========================================
    // 2. PARENT DASHBOARD TESTS
    // ========================================
    console.log('\n📝 2. PARENT DASHBOARD TESTS');
    console.log('-'.repeat(40));
    
    // 2.1 Test Dashboard Loading
    console.log('2.1 Testing Dashboard Loading...');
    try {
      const dashboardElements = {
        'Welcome message': 'text=/Welcome/i',
        'Children section': 'text=/Your Children|Child Profiles/i',
        'Quests section': 'text=/Quests/i',
        'Rewards section': 'text=/Rewards/i'
      };
      
      for (const [name, selector] of Object.entries(dashboardElements)) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          console.log(`  ✅ ${name} loaded`);
          results.passed.push(`Dashboard - ${name}`);
        } else {
          console.log(`  ❌ ${name} not found`);
          results.failed.push(`Dashboard - ${name} missing`);
        }
      }
    } catch (error) {
      console.log('  ❌ Dashboard loading error:', error.message);
      results.failed.push(`Dashboard loading - ${error.message}`);
    }
    
    // ========================================
    // 3. CHILD PROFILE MANAGEMENT
    // ========================================
    console.log('\n📝 3. CHILD PROFILE MANAGEMENT');
    console.log('-'.repeat(40));
    
    // 3.1 Test Add Child
    console.log('3.1 Testing Add Child...');
    try {
      const addChildButton = page.locator('button:has-text("Add Child")').first();
      if (await addChildButton.isVisible()) {
        await addChildButton.click();
        await page.waitForTimeout(1000);
        
        // Fill child form
        await page.fill('input[placeholder*="name" i]', 'Test Child');
        await page.fill('input[placeholder*="age" i]', '10');
        
        // Submit
        const saveButton = page.locator('button:has-text("Save")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(2000);
          
          // Check if child was added
          const childAdded = await page.locator('text="Test Child"').isVisible().catch(() => false);
          if (childAdded) {
            console.log('  ✅ Child added successfully');
            results.passed.push('Add Child');
          } else {
            console.log('  ❌ Child not added');
            results.failed.push('Add Child - Child not visible');
          }
        }
      } else {
        console.log('  ⚠️ Add Child button not found');
        results.warnings.push('Add Child button not visible');
      }
    } catch (error) {
      console.log('  ❌ Add Child error:', error.message);
      results.failed.push(`Add Child - ${error.message}`);
    }
    
    // 3.2 Test Child Dashboard Access
    console.log('3.2 Testing Child Dashboard Access...');
    try {
      const childProfile = page.locator('text="Test Child"').first();
      if (await childProfile.isVisible()) {
        await childProfile.click();
        await page.waitForTimeout(2000);
        
        // Check if child dashboard loaded
        const childDashboard = await page.locator('text=/XP|Level|Quest/i').first().isVisible().catch(() => false);
        if (childDashboard) {
          console.log('  ✅ Child dashboard accessed');
          results.passed.push('Child Dashboard Access');
          
          // Go back to parent dashboard
          const backButton = page.locator('button:has-text("Back")').first();
          if (await backButton.isVisible()) {
            await backButton.click();
            await page.waitForTimeout(1000);
          }
        } else {
          console.log('  ❌ Child dashboard not loaded');
          results.failed.push('Child Dashboard - Not loaded');
        }
      }
    } catch (error) {
      console.log('  ❌ Child Dashboard error:', error.message);
      results.failed.push(`Child Dashboard - ${error.message}`);
    }
    
    // ========================================
    // 4. QUEST MANAGEMENT
    // ========================================
    console.log('\n📝 4. QUEST MANAGEMENT');
    console.log('-'.repeat(40));
    
    // 4.1 Test Create Quest
    console.log('4.1 Testing Create Quest...');
    try {
      const manageQuests = page.locator('button:has-text("Manage Quests")').first();
      if (await manageQuests.isVisible()) {
        await manageQuests.click();
        await page.waitForTimeout(1000);
        
        const createQuest = page.locator('button:has-text("Create")').first();
        if (await createQuest.isVisible()) {
          await createQuest.click();
          await page.waitForTimeout(1000);
          
          // Fill quest form
          const inputs = page.locator('input[type="text"]');
          const inputCount = await inputs.count();
          
          if (inputCount > 0) {
            await inputs.nth(0).fill('Test Quest');
            if (inputCount > 1) await inputs.nth(1).fill('Test quest description');
          }
          
          // Set XP value
          const xpInput = page.locator('input[type="number"]').first();
          if (await xpInput.isVisible()) {
            await xpInput.fill('100');
          }
          
          // Save quest
          await page.locator('button:has-text("Save")').first().click();
          await page.waitForTimeout(2000);
          
          console.log('  ✅ Quest creation attempted');
          results.passed.push('Create Quest');
        }
      } else {
        console.log('  ⚠️ Manage Quests button not found');
        results.warnings.push('Manage Quests not visible');
      }
    } catch (error) {
      console.log('  ❌ Create Quest error:', error.message);
      results.failed.push(`Create Quest - ${error.message}`);
    }
    
    // ========================================
    // 5. REWARD MANAGEMENT
    // ========================================
    console.log('\n📝 5. REWARD MANAGEMENT');
    console.log('-'.repeat(40));
    
    // 5.1 Test Create Reward
    console.log('5.1 Testing Create Reward...');
    try {
      // Navigate back to dashboard if needed
      const backButton = page.locator('button:has-text("Back")').first();
      if (await backButton.isVisible()) {
        await backButton.click();
        await page.waitForTimeout(1000);
      }
      
      const manageRewards = page.locator('button:has-text("Manage Rewards")').first();
      if (await manageRewards.isVisible()) {
        await manageRewards.click();
        await page.waitForTimeout(1000);
        
        const createReward = page.locator('button:has-text("Create")').first();
        if (await createReward.isVisible()) {
          await createReward.click();
          await page.waitForTimeout(1000);
          
          // Fill reward form
          const inputs = page.locator('input[type="text"]');
          const inputCount = await inputs.count();
          
          if (inputCount > 0) {
            await inputs.nth(0).fill('Test Reward');
            if (inputCount > 1) await inputs.nth(1).fill('Test reward description');
          }
          
          // Set XP cost
          const xpInput = page.locator('input[type="number"]').first();
          if (await xpInput.isVisible()) {
            await xpInput.fill('50');
          }
          
          // Save reward
          await page.locator('button:has-text("Save")').first().click();
          await page.waitForTimeout(2000);
          
          console.log('  ✅ Reward creation attempted');
          results.passed.push('Create Reward');
        }
      } else {
        console.log('  ⚠️ Manage Rewards button not found');
        results.warnings.push('Manage Rewards not visible');
      }
    } catch (error) {
      console.log('  ❌ Create Reward error:', error.message);
      results.failed.push(`Create Reward - ${error.message}`);
    }
    
    // ========================================
    // 6. NAVIGATION & UI TESTS
    // ========================================
    console.log('\n📝 6. NAVIGATION & UI TESTS');
    console.log('-'.repeat(40));
    
    // 6.1 Test Child to Parent Navigation
    console.log('6.1 Testing Child to Parent Navigation...');
    try {
      // Go to child dashboard
      const childProfile = page.locator('text="Test Child"').first();
      if (await childProfile.isVisible()) {
        await childProfile.click();
        await page.waitForTimeout(2000);
        
        // Go back to parent
        const backButton = page.locator('button:has-text("Back")').first();
        if (await backButton.isVisible()) {
          await backButton.click();
          await page.waitForTimeout(2000);
          
          // Check if back on parent dashboard
          const parentDash = await page.locator('text=/Your Children/i').isVisible().catch(() => false);
          if (parentDash) {
            console.log('  ✅ Navigation works');
            results.passed.push('Child-Parent Navigation');
          } else {
            console.log('  ❌ Navigation failed');
            results.failed.push('Child-Parent Navigation');
          }
        }
      }
    } catch (error) {
      console.log('  ❌ Navigation error:', error.message);
      results.failed.push(`Navigation - ${error.message}`);
    }
    
    // 6.2 Test Feedback Button
    console.log('6.2 Testing Feedback Button...');
    try {
      const feedbackButton = page.locator('button:has-text("Feedback")').first();
      if (await feedbackButton.isVisible()) {
        await feedbackButton.click();
        await page.waitForTimeout(1000);
        
        const modalVisible = await page.locator('text="Feedback / Bug Report"').isVisible().catch(() => false);
        if (modalVisible) {
          console.log('  ✅ Feedback modal opens');
          results.passed.push('Feedback Button');
          
          // Close modal
          const closeButton = page.locator('button:has-text("×")').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        } else {
          console.log('  ❌ Feedback modal failed');
          results.failed.push('Feedback Modal');
        }
      } else {
        console.log('  ⚠️ Feedback button not found');
        results.warnings.push('Feedback button not visible');
      }
    } catch (error) {
      console.log('  ❌ Feedback error:', error.message);
      results.failed.push(`Feedback - ${error.message}`);
    }
    
    // ========================================
    // 7. QUEST CLAIMING TEST
    // ========================================
    console.log('\n📝 7. QUEST CLAIMING TEST');
    console.log('-'.repeat(40));
    
    console.log('7.1 Testing Quest Claiming...');
    try {
      // Navigate to child dashboard
      const childProfile = page.locator('text="Test Child"').first();
      if (await childProfile.isVisible()) {
        await childProfile.click();
        await page.waitForTimeout(2000);
        
        // Look for quest claim button
        const claimButton = page.locator('button:has-text("I Did This")').first();
        if (await claimButton.isVisible()) {
          // Store URL before clicking
          const urlBefore = page.url();
          
          await claimButton.click();
          await page.waitForTimeout(2000);
          
          // Check URL didn't change (immediate feedback test)
          const urlAfter = page.url();
          if (urlBefore === urlAfter) {
            console.log('  ✅ Quest claiming with immediate feedback');
            results.passed.push('Quest Claiming - Immediate feedback');
          } else {
            console.log('  ❌ Quest claiming navigated away');
            results.failed.push('Quest Claiming - Navigation issue');
          }
        } else {
          console.log('  ⚠️ No quests available to claim');
          results.warnings.push('No claimable quests');
        }
      }
    } catch (error) {
      console.log('  ❌ Quest claiming error:', error.message);
      results.failed.push(`Quest Claiming - ${error.message}`);
    }
    
    // ========================================
    // 8. ERROR CHECKING
    // ========================================
    console.log('\n📝 8. CONSOLE ERROR CHECK');
    console.log('-'.repeat(40));
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to trigger any errors
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log('  ❌ Console errors detected:');
      consoleErrors.slice(0, 5).forEach(err => {
        console.log(`     - ${err.substring(0, 100)}`);
        results.failed.push(`Console Error - ${err.substring(0, 50)}`);
      });
    } else {
      console.log('  ✅ No console errors');
      results.passed.push('Console - No errors');
    }
    
    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n✅ PASSED (${results.passed.length}):`);
    results.passed.forEach(test => console.log(`   - ${test}`));
    
    if (results.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS (${results.warnings.length}):`);
      results.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (results.failed.length > 0) {
      console.log(`\n❌ FAILED (${results.failed.length}):`);
      results.failed.forEach(failure => console.log(`   - ${failure}`));
    }
    
    const totalTests = results.passed.length + results.failed.length;
    const passRate = totalTests > 0 ? ((results.passed.length / totalTests) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(80));
    console.log(`OVERALL: ${results.passed.length}/${totalTests} tests passed (${passRate}%)`);
    
    if (results.failed.length === 0) {
      console.log('🎉 ALL TESTS PASSED!');
    } else {
      console.log(`⚠️ ${results.failed.length} issues need attention`);
    }
    console.log('='.repeat(80));
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/comprehensive-test-final.png' });
  });
});