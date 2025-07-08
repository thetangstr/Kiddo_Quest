const { test, expect } = require('@playwright/test');

test('Debug Amazon Browser Feature', async ({ page }) => {
  // Enable JavaScript and wait for React to load
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait for React app to fully load
  await page.waitForSelector('body', { timeout: 10000 });
  await page.waitForTimeout(2000); // Give React time to render
  
  // Take screenshot of login page
  await page.screenshot({ path: 'test-results/login-page.png' });
  
  // Check if we can see the login form
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  
  if (await emailInput.isVisible() && await passwordInput.isVisible()) {
    console.log('✅ Login form found');
    
    // Sign in with admin credentials
    await emailInput.fill('testadmin@example.com');
    await passwordInput.fill('TestAdmin123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation/loading
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/after-login.png' });
    
    // Check for and dismiss any tutorial/welcome modals
    const skipTutorialBtn = page.locator('text=Skip Tutorial');
    if (await skipTutorialBtn.isVisible()) {
      console.log('✅ Found tutorial modal, skipping...');
      await skipTutorialBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Check for any other modal close buttons
    const closeButtons = page.locator('button[aria-label="Close"], .modal-close, [data-dismiss="modal"]');
    const closeButtonCount = await closeButtons.count();
    if (closeButtonCount > 0) {
      console.log(`✅ Found ${closeButtonCount} close buttons, clicking them...`);
      for (let i = 0; i < closeButtonCount; i++) {
        try {
          await closeButtons.nth(i).click({ timeout: 1000 });
          await page.waitForTimeout(500);
        } catch (e) {
          // Ignore if button is not clickable
        }
      }
    }
    
    // Check for dashboard or any admin interface
    const pageText = await page.textContent('body');
    console.log('Page content after login:', pageText.substring(0, 1000));
    
    // Look for admin dashboard elements
    const adminElements = await page.locator('text=Admin').count();
    const dashboardElements = await page.locator('text=Dashboard').count();
    const rewardElements = await page.locator('text=Reward').count();
    
    console.log(`Found ${adminElements} admin elements, ${dashboardElements} dashboard elements, ${rewardElements} reward elements`);
    
    // Try to find reward management
    if (rewardElements > 0) {
      console.log('✅ Reward elements found, trying to navigate to reward management');
      
      // Look for reward management link/button
      const rewardManagementLink = page.locator('button:has-text("Manage Rewards")');
      if (await rewardManagementLink.isVisible()) {
        await rewardManagementLink.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/reward-management.png' });
        
        // Look for Create Reward button
        const createRewardBtn = page.locator('text=Create Reward');
        if (await createRewardBtn.isVisible()) {
          await createRewardBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'test-results/create-reward-form.png' });
          
          // Look for Browse Amazon button
          const browseAmazonBtn = page.locator('text=Browse Amazon');
          if (await browseAmazonBtn.isVisible()) {
            console.log('✅ Browse Amazon button found!');
            await browseAmazonBtn.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'test-results/amazon-modal.png' });
            
            // Check if Amazon modal opened
            const modalTitle = page.locator('text=Browse Amazon Products');
            if (await modalTitle.isVisible()) {
              console.log('✅ Amazon browser modal opened successfully!');
              
              // Test the search functionality
              const searchInput = page.locator('input[placeholder="Search for products..."]');
              if (await searchInput.isVisible()) {
                await searchInput.fill('toy');
                await page.click('text=Search');
                await page.waitForTimeout(1000);
                await page.screenshot({ path: 'test-results/amazon-search-results.png' });
                
                // Check if products are displayed
                const productCards = page.locator('.grid > div');
                const productCount = await productCards.count();
                console.log(`✅ Found ${productCount} products in search results`);
                
                if (productCount > 0) {
                  // Try to select the first product
                  const firstSelectBtn = page.locator('text=Select').first();
                  if (await firstSelectBtn.isVisible()) {
                    await firstSelectBtn.click();
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: 'test-results/after-product-selection.png' });
                    
                    // Check if form was populated
                    const titleInput = page.locator('input[placeholder="Enter reward title"]');
                    const titleValue = await titleInput.inputValue();
                    console.log(`✅ Form populated with title: ${titleValue}`);
                    
                    if (titleValue.length > 0) {
                      console.log('🎉 Amazon browser feature is working correctly!');
                    }
                  }
                }
              }
            } else {
              console.log('❌ Amazon modal did not open');
            }
          } else {
            console.log('❌ Browse Amazon button not found');
          }
        } else {
          console.log('❌ Create Reward button not found');
        }
      } else {
        console.log('❌ Reward Management button not found');
      }
    }
  } else {
    console.log('❌ Login form not found');
    const pageContent = await page.textContent('body');
    console.log('Current page content:', pageContent);
  }
  
  // Check console logs for any errors
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(`ERROR: ${msg.text()}`);
    }
  });
  
  if (logs.length > 0) {
    console.log('Console errors:', logs);
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/final-state.png' });
});
