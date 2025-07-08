const { test, expect } = require('@playwright/test');

test.describe('Amazon Browser Feature', () => {
  test('should allow browsing Amazon products and creating rewards', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Sign in with admin credentials
    await page.fill('input[type="email"]', 'testadmin@example.com');
    await page.fill('input[type="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });
    
    // Navigate to Reward Management
    await page.click('text=Reward Management');
    
    // Wait for reward management screen
    await page.waitForSelector('text=Manage Rewards', { timeout: 5000 });
    
    // Click Create Reward button
    await page.click('text=Create Reward');
    
    // Wait for reward form
    await page.waitForSelector('text=Create New Reward', { timeout: 5000 });
    
    // Verify Browse Amazon button exists
    await expect(page.locator('text=Browse Amazon')).toBeVisible();
    
    // Click Browse Amazon button
    await page.click('text=Browse Amazon');
    
    // Wait for Amazon browser modal
    await page.waitForSelector('text=Browse Amazon Products', { timeout: 5000 });
    
    // Verify modal content
    await expect(page.locator('text=Search Amazon products')).toBeVisible();
    await expect(page.locator('input[placeholder="Search for products..."]')).toBeVisible();
    
    // Search for a product
    await page.fill('input[placeholder="Search for products..."]', 'toy');
    await page.click('text=Search');
    
    // Wait for search results
    await page.waitForSelector('.grid', { timeout: 5000 });
    
    // Verify mock products are displayed
    await expect(page.locator('text=LEGO Classic Creative Bricks')).toBeVisible();
    await expect(page.locator('text=Educational Building Toy')).toBeVisible();
    
    // Select the first product
    await page.click('text=Select >> nth=0');
    
    // Verify modal closes and form is populated
    await page.waitForSelector('text=Browse Amazon Products', { state: 'hidden', timeout: 5000 });
    
    // Check that form fields are populated
    const titleInput = page.locator('input[placeholder="Enter reward title"]');
    await expect(titleInput).toHaveValue('LEGO Classic Creative Bricks');
    
    const descriptionTextarea = page.locator('textarea[placeholder="Describe the reward"]');
    await expect(descriptionTextarea).toHaveValue('Educational Building Toy');
    
    // Verify Amazon product indicator is shown
    await expect(page.locator('text=Amazon Product')).toBeVisible();
    
    // Set XP cost
    await page.fill('input[type="number"]', '100');
    
    // Save the reward
    await page.click('text=Create Reward');
    
    // Wait for success and return to manage rewards
    await page.waitForSelector('text=Manage Rewards', { timeout: 10000 });
    
    // Verify the new reward appears in the list
    await expect(page.locator('text=LEGO Classic Creative Bricks')).toBeVisible();
    
    console.log('✅ Amazon browser feature test completed successfully');
  });
  
  test('should handle Amazon modal close without selection', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Sign in with admin credentials
    await page.fill('input[type="email"]', 'testadmin@example.com');
    await page.fill('input[type="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });
    
    // Navigate to Reward Management
    await page.click('text=Reward Management');
    
    // Wait for reward management screen
    await page.waitForSelector('text=Manage Rewards', { timeout: 5000 });
    
    // Click Create Reward button
    await page.click('text=Create Reward');
    
    // Wait for reward form
    await page.waitForSelector('text=Create New Reward', { timeout: 5000 });
    
    // Click Browse Amazon button
    await page.click('text=Browse Amazon');
    
    // Wait for Amazon browser modal
    await page.waitForSelector('text=Browse Amazon Products', { timeout: 5000 });
    
    // Close modal without selecting
    await page.click('button[aria-label="Close"]');
    
    // Verify modal is closed and form is unchanged
    await page.waitForSelector('text=Browse Amazon Products', { state: 'hidden', timeout: 5000 });
    
    const titleInput = page.locator('input[placeholder="Enter reward title"]');
    await expect(titleInput).toHaveValue('');
    
    console.log('✅ Amazon modal close test completed successfully');
  });
});
