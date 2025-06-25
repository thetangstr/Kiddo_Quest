const { test, expect } = require('@playwright/test');

test.describe('Debug Testing', () => {
  test('Detailed app debugging', async ({ page }) => {
    // Listen for all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Listen for page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Listen for network failures
    const networkFailures = [];
    page.on('requestfailed', request => {
      networkFailures.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
    });

    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');
    
    console.log('Waiting for load state...');
    await page.waitForLoadState('networkidle');
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Log all console messages
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Log page errors
    console.log('\n=== PAGE ERRORS ===');
    pageErrors.forEach(error => console.log(error));
    
    // Log network failures
    console.log('\n=== NETWORK FAILURES ===');
    networkFailures.forEach(failure => console.log(failure));
    
    // Get page content
    const content = await page.content();
    console.log('\n=== PAGE CONTENT LENGTH ===', content.length);
    
    // Check if React root exists
    const reactRoot = page.locator('#root');
    console.log('React root exists:', await reactRoot.count() > 0);
    console.log('React root visible:', await reactRoot.isVisible());
    
    // Check if there's any content in the root
    const rootContent = await reactRoot.innerHTML();
    console.log('Root content length:', rootContent.length);
    console.log('Root content preview:', rootContent.substring(0, 200));
    
    // Check for specific elements
    const loginCard = page.locator('.min-h-screen');
    console.log('Login container exists:', await loginCard.count() > 0);
    
    const cardElement = page.locator('div').filter({ hasText: 'Kiddo Quest' });
    console.log('Card with title exists:', await cardElement.count() > 0);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/debug-screenshot.png', fullPage: true });
    
    // Check computed styles
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        height: styles.height,
        overflow: styles.overflow
      };
    });
    console.log('\n=== BODY STYLES ===', bodyStyles);
  });
});
