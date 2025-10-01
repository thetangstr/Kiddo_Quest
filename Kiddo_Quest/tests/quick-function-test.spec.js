const { test, expect } = require('@playwright/test');

test.describe('Quick Function Test', () => {
  test('Test critical app functions', async ({ page }) => {
    console.log('\n🔍 QUICK FUNCTION TEST');
    console.log('='.repeat(50));
    
    const issues = [];
    
    // Navigate to app
    await page.goto('https://kiddo-quest-de7b0.web.app');
    await page.waitForLoadState('networkidle');
    
    // 1. Check initial page load
    console.log('\n1️⃣ INITIAL PAGE LOAD');
    const loginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
    if (loginForm) {
      console.log('✅ Login page loaded');
    } else {
      console.log('❌ Login page not loaded');
      issues.push('Login page not loading');
    }
    
    // 2. Test with existing test account
    console.log('\n2️⃣ AUTHENTICATION TEST');
    const testEmail = 'test1756428303944@kiddoquest.com';
    const testPassword = 'TestKiddo123!';
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Take screenshot before login
    await page.screenshot({ path: 'tests/screenshots/quick-test-01-login.png' });
    
    await page.click('button:has-text("Sign In with Email")');
    await page.waitForTimeout(3000);
    
    // Check if logged in
    const dashboard = await page.locator('text=/Dashboard|Welcome|Children/i').first().isVisible().catch(() => false);
    if (dashboard) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed');
      issues.push('Login not working');
      
      // Try to understand why
      const errorMsg = await page.locator('text=/error|failed|invalid/i').first().textContent().catch(() => null);
      if (errorMsg) {
        console.log('   Error:', errorMsg);
        issues.push(`Login error: ${errorMsg}`);
      }
    }
    
    // Take screenshot of current state
    await page.screenshot({ path: 'tests/screenshots/quick-test-02-after-login.png' });
    
    // 3. Check dashboard elements
    console.log('\n3️⃣ DASHBOARD ELEMENTS');
    const elements = [
      { name: 'Children Section', selector: 'text=/Alice|Bob|Children/i' },
      { name: 'Quest Button', selector: 'button:has-text("Quest")' },
      { name: 'Reward Button', selector: 'button:has-text("Reward")' },
      { name: 'Feedback Button', selector: 'button:has-text("Feedback")' }
    ];
    
    for (const element of elements) {
      const visible = await page.locator(element.selector).first().isVisible().catch(() => false);
      if (visible) {
        console.log(`✅ ${element.name} found`);
      } else {
        console.log(`❌ ${element.name} missing`);
        issues.push(`${element.name} not found`);
      }
    }
    
    // 4. Test child profile access
    console.log('\n4️⃣ CHILD PROFILE ACCESS');
    const aliceProfile = page.locator('text=Alice').first();
    if (await aliceProfile.isVisible().catch(() => false)) {
      await aliceProfile.click();
      await page.waitForTimeout(2000);
      
      // Check if child dashboard loaded
      const childDash = await page.locator('text=/XP|Level|Quest/i').first().isVisible().catch(() => false);
      if (childDash) {
        console.log('✅ Child dashboard loads');
        
        // Test back navigation
        const backBtn = page.locator('button:has-text("Back")').first();
        if (await backBtn.isVisible()) {
          await backBtn.click();
          await page.waitForTimeout(1000);
          
          const parentDash = await page.locator('text=/Your Children/i').isVisible().catch(() => false);
          if (parentDash) {
            console.log('✅ Navigation back to parent works');
          } else {
            console.log('❌ Navigation back failed');
            issues.push('Parent-Child navigation broken');
          }
        }
      } else {
        console.log('❌ Child dashboard not loading');
        issues.push('Child dashboard not accessible');
      }
    } else {
      console.log('⚠️ No child profiles found');
    }
    
    // 5. Test feedback modal
    console.log('\n5️⃣ FEEDBACK MODAL');
    const feedbackBtn = page.locator('button:has-text("Feedback")').first();
    if (await feedbackBtn.isVisible().catch(() => false)) {
      await feedbackBtn.click();
      await page.waitForTimeout(1000);
      
      const modal = await page.locator('text="Feedback / Bug Report"').isVisible().catch(() => false);
      if (modal) {
        console.log('✅ Feedback modal opens');
        
        // Close it
        const closeBtn = page.locator('button:has-text("×")').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      } else {
        console.log('❌ Feedback modal not opening');
        issues.push('Feedback modal broken');
      }
    }
    
    // 6. Check for console errors
    console.log('\n6️⃣ CONSOLE ERRORS');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        errors.push(msg.text());
      }
    });
    
    // Refresh to catch any errors
    await page.reload();
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log(`❌ Found ${errors.length} console errors`);
      errors.slice(0, 3).forEach(err => {
        console.log(`   - ${err.substring(0, 80)}`);
        issues.push(`Console: ${err.substring(0, 50)}`);
      });
    } else {
      console.log('✅ No console errors');
    }
    
    // SUMMARY
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    if (issues.length === 0) {
      console.log('✅ ALL TESTS PASSED! No issues found.');
    } else {
      console.log(`❌ Found ${issues.length} issue(s):\n`);
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      if (issues.some(i => i.includes('Login'))) {
        console.log('- Check authentication system and test account validity');
      }
      if (issues.some(i => i.includes('dashboard'))) {
        console.log('- Verify dashboard components are rendering properly');
      }
      if (issues.some(i => i.includes('navigation'))) {
        console.log('- Fix navigation between parent and child views');
      }
    }
    
    console.log('\nScreenshots saved in tests/screenshots/');
    console.log('='.repeat(50));
  });
});