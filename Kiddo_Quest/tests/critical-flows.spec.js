const { test, expect } = require('@playwright/test');

/**
 * Critical User Flows Test Suite
 * 
 * These tests verify the most important user flows in KiddoQuest.
 * They run automatically whenever code changes are made.
 */

const BASE_URL = process.env.BASE_URL || 'https://kiddo-quest-beta.web.app';

// Test configuration
test.use({
  baseURL: BASE_URL,
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure'
});

// Helper function to generate unique test emails
function generateTestEmail(prefix = 'autotest') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}@example.com`;
}

// Helper to monitor console for specific errors
async function setupErrorMonitoring(page) {
  const errors = {
    sourceField: [],
    firestore: [],
    general: []
  };

  page.on('console', msg => {
    const text = msg.text();
    
    if (msg.type() === 'error') {
      errors.general.push(text);
      
      // Check for the specific source field error
      if (text.includes('Unsupported field value: undefined') && 
          text.includes('found in field source')) {
        errors.sourceField.push(text);
      }
      
      // Check for any Firestore errors
      if (text.includes('FirebaseError') || text.includes('addDoc')) {
        errors.firestore.push(text);
      }
    }
  });

  return errors;
}

test.describe('Critical User Flows', () => {
  
  test('User Registration and Initial Setup', async ({ page }) => {
    const errors = await setupErrorMonitoring(page);
    const testEmail = generateTestEmail('register');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click register
    await page.click('button:has-text("Register"), a:has-text("Register")');
    await page.waitForTimeout(1000);
    
    // Fill registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    
    // Handle password confirmation if present
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length > 1) {
      await passwordFields[1].fill('TestPass123!');
    }
    
    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Verify we reached dashboard
    const dashboardVisible = await page.locator('text=/Dashboard|Welcome/i').isVisible()
      .catch(() => false);
    
    expect(dashboardVisible).toBeTruthy();
    expect(errors.general.length).toBe(0);
  });

  test('Create Child Profile', async ({ page }) => {
    const errors = await setupErrorMonitoring(page);
    const testEmail = generateTestEmail('child');
    
    // Register first
    await page.goto('/');
    await page.click('button:has-text("Register"), a:has-text("Register")');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length > 1) {
      await passwordFields[1].fill('TestPass123!');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Skip tutorial if present
    const skipButton = await page.locator('button:has-text("Skip")').first();
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
    // Add child
    const addChildButton = await page.locator('button:has-text("Add Child"), button:has-text("Add Your First Child")').first();
    if (await addChildButton.isVisible()) {
      await addChildButton.click();
      await page.waitForTimeout(1000);
      
      // Fill child form
      await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test Child');
      
      const ageInput = await page.locator('input[name="age"], input[type="number"]').first();
      if (await ageInput.isVisible()) {
        await ageInput.fill('10');
      }
      
      // Submit
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(2000);
    }
    
    expect(errors.general.length).toBe(0);
  });

  test('Create Reward Without Source Field Error', async ({ page }) => {
    const errors = await setupErrorMonitoring(page);
    const testEmail = generateTestEmail('reward');
    
    // Register and setup
    await page.goto('/');
    await page.click('button:has-text("Register"), a:has-text("Register")');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length > 1) {
      await passwordFields[1].fill('TestPass123!');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Skip tutorial
    const skipButton = await page.locator('button:has-text("Skip")').first();
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
    // Navigate to rewards
    await page.click('button:has-text("Manage Rewards")');
    await page.waitForTimeout(1000);
    
    // Try to create reward
    const createButton = await page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Fill reward form
      await page.fill('input[name="title"]', 'Auto Test Reward');
      await page.fill('textarea[name="description"]', 'Testing automated reward creation');
      await page.fill('input[name="cost"]', '50');
      
      // Submit
      await page.click('button[type="submit"], button:has-text("Create")');
      await page.waitForTimeout(3000);
    }
    
    // CRITICAL: Check for source field error
    expect(errors.sourceField.length).toBe(0);
    
    if (errors.sourceField.length > 0) {
      console.error('❌ SOURCE FIELD ERROR DETECTED:', errors.sourceField[0]);
    }
  });

  test('Create Quest', async ({ page }) => {
    const errors = await setupErrorMonitoring(page);
    const testEmail = generateTestEmail('quest');
    
    // Register and setup
    await page.goto('/');
    await page.click('button:has-text("Register"), a:has-text("Register")');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length > 1) {
      await passwordFields[1].fill('TestPass123!');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Skip tutorial
    const skipButton = await page.locator('button:has-text("Skip")').first();
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
    // Navigate to quests
    await page.click('button:has-text("Manage Quests")');
    await page.waitForTimeout(1000);
    
    // Try to create quest
    const createButton = await page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Fill quest form
      await page.fill('input[name="title"]', 'Auto Test Quest');
      await page.fill('textarea[name="description"]', 'Testing automated quest creation');
      await page.fill('input[name="xpReward"]', '25');
      
      // Submit
      await page.click('button[type="submit"], button:has-text("Create")');
      await page.waitForTimeout(3000);
    }
    
    expect(errors.firestore.length).toBe(0);
  });

  test('Navigation Between Screens', async ({ page }) => {
    const errors = await setupErrorMonitoring(page);
    const testEmail = generateTestEmail('nav');
    
    // Register
    await page.goto('/');
    await page.click('button:has-text("Register"), a:has-text("Register")');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    
    const passwordFields = await page.locator('input[type="password"]').all();
    if (passwordFields.length > 1) {
      await passwordFields[1].fill('TestPass123!');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Skip tutorial
    const skipButton = await page.locator('button:has-text("Skip")').first();
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
    // Test navigation
    const navigationTests = [
      { button: 'Manage Quests', expectedText: /Quest|Task/ },
      { button: 'Manage Rewards', expectedText: /Reward/ },
      { button: 'Back to Dashboard', expectedText: /Dashboard|Parent/ }
    ];
    
    for (const navTest of navigationTests) {
      const button = await page.locator(`button:has-text("${navTest.button}")`).first();
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(1000);
        
        const expectedVisible = await page.locator(`text=${navTest.expectedText}`).isVisible()
          .catch(() => false);
        
        if (!expectedVisible) {
          console.log(`⚠️ Navigation to ${navTest.button} may have failed`);
        }
      }
    }
    
    expect(errors.general.length).toBe(0);
  });
});

// Summary test to ensure no critical errors
test('No Critical Errors in Console', async ({ page }) => {
  const errors = await setupErrorMonitoring(page);
  const testEmail = generateTestEmail('summary');
  
  // Do a simple registration and navigation
  await page.goto('/');
  await page.click('button:has-text("Register"), a:has-text("Register")');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', 'TestPass123!');
  
  const passwordFields = await page.locator('input[type="password"]').all();
  if (passwordFields.length > 1) {
    await passwordFields[1].fill('TestPass123!');
  }
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  // Check for critical errors
  if (errors.sourceField.length > 0) {
    console.error('❌ CRITICAL: Source field errors detected:', errors.sourceField);
  }
  
  if (errors.firestore.length > 0) {
    console.error('⚠️ Firestore errors detected:', errors.firestore);
  }
  
  // This is the most important assertion
  expect(errors.sourceField.length).toBe(0);
});