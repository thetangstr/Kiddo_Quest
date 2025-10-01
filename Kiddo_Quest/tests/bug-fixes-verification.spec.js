const { test, expect } = require('@playwright/test');

test.describe('Bug Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('Edit Child Profile - no indexOf error', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page or already logged in
    const isLoginPage = await page.locator('button:has-text("Sign In with Email")').isVisible();
    
    if (isLoginPage) {
      // Try to login with test credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }

    // Navigate to Parent Dashboard if not already there
    const dashboardExists = await page.locator('text=Parent Dashboard').isVisible();
    if (!dashboardExists) {
      await page.click('text=Dashboard');
    }

    // Look for existing child profile or create one
    const editButton = await page.locator('text=Edit').first();
    const hasChild = await editButton.isVisible();
    
    if (!hasChild) {
      // Create a child first
      await page.click('text=Add Child');
      await page.fill('input[placeholder*="name"]', 'Test Child');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);
    }

    // Click edit on a child profile
    await page.click('text=Edit');
    
    // Wait for edit page to load
    await page.waitForSelector('text=Edit Child Profile');
    
    // Check that no error message appears
    const errorMessage = page.locator('text=Cannot read properties of undefined');
    await expect(errorMessage).not.toBeVisible();
    
    // Verify the page loaded correctly
    await expect(page.locator('text=Edit Child Profile')).toBeVisible();
    await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
  });

  test('Feedback Modal - successful submission', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page or already logged in
    const isLoginPage = await page.locator('button:has-text("Sign In with Email")').isVisible();
    
    if (isLoginPage) {
      // Try to login with test credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }

    // Look for and click the feedback button
    const feedbackButton = page.locator('text=Feedback');
    if (await feedbackButton.isVisible()) {
      await feedbackButton.click();
    } else {
      // Try alternative ways to access feedback
      await page.click('[data-testid="feedback-button"]');
    }
    
    // Wait for feedback modal to appear
    await page.waitForSelector('text=Feedback / Bug Report');
    
    // Fill out the feedback form
    await page.fill('textarea[required]', 'Test feedback to verify bug fix');
    await page.fill('textarea:not([required])', 'Steps: Open feedback modal, fill form, submit');
    await page.selectOption('select', 'medium');
    
    // Submit the form
    await page.click('button:has-text("Submit")');
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Check that submission was successful (no permission error)
    const permissionError = page.locator('text=Missing or insufficient permissions');
    await expect(permissionError).not.toBeVisible();
    
    // Check for success message
    const successMessage = page.locator('text=Thank you for your feedback');
    await expect(successMessage).toBeVisible();
  });

  test('General app stability - no console errors', async ({ page }) => {
    const errors = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate through key pages
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page
    const isLoginPage = await page.locator('text=Sign In').isVisible();
    
    if (isLoginPage) {
      // Try to login
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to various sections
    const sections = ['Dashboard', 'Quests', 'Rewards'];
    
    for (const section of sections) {
      const sectionLink = page.locator(`text=${section}`).first();
      if (await sectionLink.isVisible()) {
        await sectionLink.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(error => 
      error.includes('indexOf') || 
      error.includes('permissions') ||
      error.includes('undefined')
    );
    
    // Expect no critical errors
    expect(criticalErrors).toEqual([]);
  });
});