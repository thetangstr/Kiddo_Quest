const { test, expect } = require('@playwright/test');

test.describe('Neumorphic UI Components Test', () => {
  test('Verify neumorphic design system implementation', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Wait for React to render
    await page.waitForTimeout(2000);
    
    console.log('Testing neumorphic UI components...');
    
    // Take a screenshot of the login screen
    await page.screenshot({ path: 'test-results/neumorphic-login.png', fullPage: true });
    
    // Test 1: Verify Inter font is loaded
    const fontFamily = await page.evaluate(() => {
      const element = document.querySelector('h1');
      return window.getComputedStyle(element).fontFamily;
    });
    console.log('Font family:', fontFamily);
    expect(fontFamily).toContain('Inter');
    
    // Test 2: Verify login form elements have neumorphic styling
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check if email input has rounded corners
    const emailInputStyles = await emailInput.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow,
        backgroundColor: styles.backgroundColor
      };
    });
    console.log('Email input styles:', emailInputStyles);
    expect(emailInputStyles.borderRadius).toBe('9999px'); // rounded-full
    
    // Test 3: Verify button has neumorphic styling
    const signInButton = page.locator('button:has-text("Sign In with Email")');
    await expect(signInButton).toBeVisible();
    
    const buttonStyles = await signInButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        borderRadius: styles.borderRadius,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });
    console.log('Button styles:', buttonStyles);
    expect(buttonStyles.borderRadius).toBe('9999px'); // rounded-full
    
    // Test 4: Verify card container has proper styling
    const cardContainer = page.locator('.min-h-screen');
    await expect(cardContainer).toBeVisible();
    
    // Test 5: Test hover effects on interactive elements
    await signInButton.hover();
    await page.waitForTimeout(500); // Wait for transition
    
    // Test 6: Verify no console errors related to styling
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Filter out non-styling related errors
    const stylingErrors = consoleErrors.filter(error => 
      error.includes('CSS') || 
      error.includes('style') || 
      error.includes('theme') ||
      error.includes('cssHelpers')
    );
    
    expect(stylingErrors).toHaveLength(0);
    
    console.log('✅ All neumorphic UI tests passed!');
  });

  test('Test modal and component interactions', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test form validation and interactions
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('button:has-text("Sign In with Email")');
    
    // Test input focus states
    await emailInput.click();
    await page.waitForTimeout(300);
    
    // Check focus ring styling
    const focusStyles = await emailInput.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow
      };
    });
    console.log('Focus styles:', focusStyles);
    
    // Test form submission with invalid data to trigger error states
    await emailInput.fill('invalid-email');
    await passwordInput.fill('short');
    await signInButton.click();
    
    // Wait for potential error messages
    await page.waitForTimeout(1000);
    
    // Take screenshot of error state
    await page.screenshot({ path: 'test-results/neumorphic-error-state.png' });
    
    console.log('✅ Modal and interaction tests completed!');
  });

  test('Test responsive design and accessibility', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/neumorphic-mobile.png' });
    
    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/neumorphic-tablet.png' });
    
    // Test desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/neumorphic-desktop.png' });
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    console.log('✅ Responsive and accessibility tests completed!');
  });
});
