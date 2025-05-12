const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, mockAuthentication } = require('./test-utils');

test.describe('Tutorial and First-Run Experience', () => {
  // Setup for all tests in this group
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/');
    
    // Mock a logged-in parent user (first-time user)
    await page.evaluate(({ email }) => {
      // Mock a logged-in user
      localStorage.setItem('kiddo-quest-auth', JSON.stringify({
        uid: 'test-parent-id',
        email: email,
        role: 'parent',
        isAdmin: false
      }));
      
      // Set the current view to parent dashboard
      localStorage.setItem('kiddo-quest-view', 'parentDashboard');
      
      // Clear tutorial flags to ensure it shows
      localStorage.removeItem('kiddoquest_tutorial_seen');
    }, TEST_CREDENTIALS.user);
    
    // Reload the page to apply the localStorage changes
    await page.reload();
  });
  
  test('tutorial displays for first-time users', async ({ page }) => {
    // Wait for the tutorial to be visible
    await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
    
    // Verify the welcome screen elements
    await expect(page.locator('text=Let\'s get you set up in just two simple steps')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Let\'s Get Started' })).toBeVisible();
  });
  
  test('tutorial allows child profile creation', async ({ page }) => {
    // Wait for the tutorial to be visible
    await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
    
    // Click the get started button
    await page.locator('button', { hasText: 'Let\'s Get Started' }).click();
    
    // Verify we're on the child creation step
    await expect(page.locator('text=Create Child Profile')).toBeVisible();
    
    // Fill in the child profile form
    await page.locator('input[placeholder="Enter name"]').fill('Test Child');
    
    // Select an avatar
    await page.locator('text=👦').first().click();
    
    // Mock the child creation
    await page.evaluate(() => {
      // Mock successful child creation
      localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
        { id: 'test-child-id', name: 'Test Child', avatar: '👦', xp: 0 }
      ]));
    });
    
    // Submit the form
    await page.locator('button', { hasText: 'Create Child Profile' }).click();
    
    // Verify success message
    await expect(page.locator('text=Child profile created successfully!')).toBeVisible();
  });
  
  test('tutorial allows PIN setup', async ({ page }) => {
    // Wait for the tutorial to be visible
    await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
    
    // Mock that we've already created a child and moved to PIN step
    await page.evaluate(() => {
      // Mock child profiles
      localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
        { id: 'test-child-id', name: 'Test Child', avatar: '👦', xp: 0 }
      ]));
    });
    
    // Click the get started button
    await page.locator('button', { hasText: 'Let\'s Get Started' }).click();
    
    // Click continue to move to PIN setup (since we've mocked having a child)
    await page.locator('button', { hasText: 'Create Child Profile' }).click();
    
    // Verify we're on the PIN setup step
    await expect(page.locator('text=Set Parent PIN')).toBeVisible();
    
    // Fill in the PIN form
    await page.locator('input[placeholder="Enter PIN"]').fill('1234');
    await page.locator('input[placeholder="Confirm PIN"]').fill('1234');
    
    // Mock successful PIN setup
    await page.evaluate(() => {
      // Mock PIN setup in user data
      localStorage.setItem('kiddo-quest-user-data', JSON.stringify({
        parentPin: true,
        pinVersion: 'sha256'
      }));
    });
    
    // Submit the form
    await page.locator('button', { hasText: 'Set PIN' }).click();
    
    // Verify success message
    await expect(page.locator('text=PIN Setup Complete!')).toBeVisible();
  });
  
  test('tutorial shows quest assignment prompt', async ({ page }) => {
    // Wait for the tutorial to be visible
    await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
    
    // Mock that we've already created a child and set PIN
    await page.evaluate(() => {
      // Mock child profiles
      localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
        { id: 'test-child-id', name: 'Test Child', avatar: '👦', xp: 0 }
      ]));
      
      // Mock PIN setup in user data
      localStorage.setItem('kiddo-quest-user-data', JSON.stringify({
        parentPin: true,
        pinVersion: 'sha256'
      }));
    });
    
    // Click through to the final dialog
    await page.locator('button', { hasText: 'Let\'s Get Started' }).click();
    await page.locator('button', { hasText: 'Create Child Profile' }).click();
    await page.locator('button', { hasText: 'Set PIN' }).click();
    await page.locator('button', { hasText: 'Continue' }).click();
    
    // Verify we see the quest assignment prompt
    await expect(page.locator('text=Ready for Adventure!')).toBeVisible();
    await expect(page.locator('text=assign your first quest')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Assign a Quest' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Go to Dashboard' })).toBeVisible();
  });
  
  test('tutorial can be skipped', async ({ page }) => {
    // Wait for the tutorial to be visible
    await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
    
    // Mock the confirmation dialog to return true
    await page.evaluate(() => {
      window.confirm = () => true;
    });
    
    // Click the skip button
    await page.locator('button[aria-label="Skip tutorial"]').click();
    
    // Verify the tutorial is no longer visible
    await expect(page.locator('text=Welcome to Kiddo Quest!')).not.toBeVisible();
    
    // Verify the tutorial is marked as seen in localStorage
    const tutorialSeen = await page.evaluate(() => {
      return localStorage.getItem('kiddoquest_tutorial_seen');
    });
    expect(tutorialSeen).toBe('true');
  });
});
