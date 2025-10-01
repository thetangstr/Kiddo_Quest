const { test, expect } = require('@playwright/test');

test.describe('KiddoQuest Beta UAT - No Authentication Required', () => {
  const BETA_URL = 'https://kiddo-quest-beta.web.app';

  test('1. Initial Page Load and UI Elements', async ({ page }) => {
    console.log('=== TESTING INITIAL PAGE LOAD ===');
    
    const consoleErrors = [];
    const networkErrors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('CONSOLE ERROR:', msg.text());
      }
    });
    
    // Capture network failures
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
        console.log('NETWORK ERROR:', response.status(), response.url());
      }
    });

    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-no-auth-01-initial.png' });
    
    console.log('✓ Page loaded successfully');
    
    // Check basic page elements
    await expect(page.locator('text="Kiddo Quest"')).toBeVisible();
    await expect(page.locator('text="Sign in to manage quests and rewards"')).toBeVisible();
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In with Email")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
    await expect(page.locator('text="Register"')).toBeVisible();
    
    console.log('✓ All expected UI elements are visible');
    
    // Check for feedback button
    const feedbackButton = page.locator('button:has-text("Feedback")');
    const feedbackVisible = await feedbackButton.isVisible();
    console.log('Feedback button visible:', feedbackVisible);
    
    if (feedbackVisible) {
      console.log('Testing feedback button...');
      await feedbackButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal or form appears
      const feedbackModal = page.locator('div:has-text("Feedback"), div:has-text("feedback")').first();
      if (await feedbackModal.isVisible().catch(() => false)) {
        console.log('✓ Feedback modal/form opened');
        await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-no-auth-02-feedback.png' });
        
        // Close modal if possible
        const closeButtons = page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label="Close"]');
        if (await closeButtons.count() > 0) {
          await closeButtons.first().click();
        } else {
          // Try clicking outside modal
          await page.click('body');
        }
      } else {
        console.log('? Feedback functionality unclear');
      }
    }
    
    console.log('Console errors found:', consoleErrors.length);
    console.log('Network errors found:', networkErrors.length);
    
    if (consoleErrors.length > 0) {
      console.log('CONSOLE ERRORS:');
      consoleErrors.forEach(error => console.log('  -', error));
    }
    
    if (networkErrors.length > 0) {
      console.log('NETWORK ERRORS:');
      networkErrors.forEach(error => console.log('  -', error));
    }
  });

  test('2. Registration Form Functionality', async ({ page }) => {
    console.log('=== TESTING REGISTRATION FORM ===');
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Click on Register link
    const registerLink = page.locator('text="Register"');
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-no-auth-03-register.png' });
    
    // Check if registration form appeared
    const registrationIndicators = [
      'text="Register"',
      'text="Create"',
      'text="Sign up"',
      'input[placeholder*="Confirm"]',
      'input[placeholder*="confirm"]'
    ];
    
    let registrationFormFound = false;
    for (const indicator of registrationIndicators) {
      if (await page.locator(indicator).isVisible().catch(() => false)) {
        registrationFormFound = true;
        console.log('✓ Registration form detected:', indicator);
        break;
      }
    }
    
    if (registrationFormFound) {
      console.log('✓ Registration functionality is accessible');
      
      // Test form validation if possible
      const submitButton = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Create"), button:has-text("Sign up")');
      if (await submitButton.count() > 0) {
        console.log('Testing form validation...');
        await submitButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check for validation messages
        const validationMessages = page.locator(':has-text("required"), :has-text("invalid"), :has-text("error")');
        const validationCount = await validationMessages.count();
        if (validationCount > 0) {
          console.log('✓ Form validation working - found', validationCount, 'validation messages');
        }
      }
    } else {
      console.log('? Registration form not detected - may be on same page or different flow');
    }
  });

  test('3. Google Authentication Button', async ({ page }) => {
    console.log('=== TESTING GOOGLE AUTH BUTTON ===');
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    const googleButton = page.locator('button:has-text("Sign in with Google")');
    await expect(googleButton).toBeVisible();
    
    console.log('Testing Google authentication button...');
    
    // Click Google button - this will likely redirect or open popup
    await googleButton.click();
    await page.waitForTimeout(3000);
    
    // Check if we were redirected or if popup appeared
    const currentUrl = page.url();
    console.log('URL after Google button click:', currentUrl);
    
    if (currentUrl.includes('google') || currentUrl.includes('oauth') || currentUrl.includes('accounts')) {
      console.log('✓ Google authentication redirect working');
    } else {
      console.log('? Google authentication response unclear');
    }
    
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-no-auth-04-google.png' });
  });

  test('4. Responsive Design and Mobile View', async ({ page }) => {
    console.log('=== TESTING RESPONSIVE DESIGN ===');
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-responsive-01-desktop.png' });
    console.log('✓ Desktop view captured');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-responsive-02-tablet.png' });
    console.log('✓ Tablet view captured');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Volumes/home/Projects_Hosted/kq_v0.5/Kiddo_Quest/tests/screenshots/uat-responsive-03-mobile.png' });
    console.log('✓ Mobile view captured');
    
    // Check that essential elements are still visible on mobile
    const mobileElements = [
      'text="Kiddo Quest"',
      'input[placeholder*="email"]',
      'input[type="password"]',
      'button:has-text("Sign In with Email")',
      'button:has-text("Sign in with Google")'
    ];
    
    for (const element of mobileElements) {
      const isVisible = await page.locator(element).isVisible();
      console.log(`Mobile view - ${element}: ${isVisible ? '✓' : '✗'}`);
    }
  });

  test('5. Performance and Loading Times', async ({ page }) => {
    console.log('=== TESTING PERFORMANCE ===');
    
    const startTime = Date.now();
    
    await page.goto(BETA_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log('Total page load time:', loadTime, 'ms');
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    console.log('Performance Metrics:');
    console.log('  DOM Content Loaded:', Math.round(performanceMetrics.domContentLoaded), 'ms');
    console.log('  Load Complete:', Math.round(performanceMetrics.loadComplete), 'ms');
    console.log('  First Paint:', Math.round(performanceMetrics.firstPaint), 'ms');
    console.log('  First Contentful Paint:', Math.round(performanceMetrics.firstContentfulPaint), 'ms');
    
    // Performance thresholds for assessment
    const assessments = [];
    if (performanceMetrics.loadComplete < 3000) assessments.push('✓ Good load time');
    else if (performanceMetrics.loadComplete < 5000) assessments.push('⚠ Moderate load time');
    else assessments.push('✗ Slow load time');
    
    if (performanceMetrics.firstContentfulPaint < 1500) assessments.push('✓ Good FCP');
    else if (performanceMetrics.firstContentfulPaint < 2500) assessments.push('⚠ Moderate FCP');
    else assessments.push('✗ Slow FCP');
    
    assessments.forEach(assessment => console.log(assessment));
  });
});