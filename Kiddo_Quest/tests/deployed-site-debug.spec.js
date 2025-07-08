const { test, expect } = require('@playwright/test');

test.describe('Deployed Site Debug', () => {
  test('should load the deployed site and identify blank page issues', async ({ page }) => {
    // Enable console logging to catch errors
    const consoleMessages = [];
    const networkFailures = [];
    
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    page.on('requestfailed', (request) => {
      networkFailures.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
      console.log(`Network failure: ${request.method()} ${request.url()} - ${request.failure().errorText}`);
    });

    // Navigate to deployed site
    console.log('Navigating to deployed site...');
    await page.goto('https://kiddo-quest-de7b0.web.app/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Take screenshot for debugging
    await page.screenshot({ path: 'tests/screenshots/deployed-site-initial.png', fullPage: true });

    // Check if page is truly blank
    const bodyContent = await page.locator('body').textContent();
    console.log('Body content length:', bodyContent?.length || 0);
    console.log('Body content preview:', bodyContent?.substring(0, 200) || 'No content');

    // Check for React root div
    const reactRoot = page.locator('#root, [data-reactroot], .App');
    const reactRootExists = await reactRoot.count();
    console.log('React root elements found:', reactRootExists);

    // Check for any JavaScript bundles loaded
    const scriptTags = await page.locator('script[src]').count();
    console.log('Script tags found:', scriptTags);

    // Check document ready state
    const readyState = await page.evaluate(() => document.readyState);
    console.log('Document ready state:', readyState);

    // Check for any visible elements
    const visibleElements = await page.locator('*:visible').count();
    console.log('Visible elements count:', visibleElements);

    // Wait a bit longer to see if content loads
    console.log('Waiting additional 5 seconds for potential lazy loading...');
    await page.waitForTimeout(5000);
    
    // Take another screenshot after waiting
    await page.screenshot({ path: 'tests/screenshots/deployed-site-after-wait.png', fullPage: true });

    // Check content again
    const bodyContentAfterWait = await page.locator('body').textContent();
    console.log('Body content after wait length:', bodyContentAfterWait?.length || 0);

    // Log all console messages and network failures
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    console.log('\n=== NETWORK FAILURES ===');
    networkFailures.forEach(failure => console.log(failure));

    // Check HTML source
    const htmlContent = await page.content();
    console.log('\n=== HTML HEAD CONTENT ===');
    const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      console.log(headMatch[1].substring(0, 500));
    }

    console.log('\n=== HTML BODY CONTENT ===');
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      console.log(bodyMatch[1].substring(0, 500));
    }
  });
});