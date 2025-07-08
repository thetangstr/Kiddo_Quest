// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Comprehensive regression test suite for Kiddo Quest
 * 
 * This test runs after deployment to ensure the app is functioning correctly
 * and catches issues like blank screens or uncaught errors
 */

test.describe('KiddoQuest Regression Test Suite', () => {
  // Test the home page loads correctly
  test('Home page should load without errors', async ({ page }) => {
    // Listen for uncaught errors
    let hasUncaughtErrors = false;
    page.on('pageerror', (error) => {
      console.error(`Uncaught error: ${error.message}`);
      hasUncaughtErrors = true;
    });

    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the deployed app
    await page.goto('https://kiddo-quest-de7b0.web.app/');
    
    // Verify the page has visible content (not blank)
    const contentVisible = await page.locator('body').evaluate(body => {
      return body.innerText.trim().length > 0;
    });
    
    expect(contentVisible, 'Page should not be blank').toBeTruthy();
    expect(hasUncaughtErrors, 'There should be no uncaught errors').toBeFalsy();
    expect(errors.length, 'There should be no console errors').toBe(0);
    
    // Verify key UI elements are present
    const ctaButtonExists = await page.getByText('Get Started for FREE').isVisible();
    expect(ctaButtonExists, 'CTA button should be visible').toBeTruthy();
  });

  // Test navigation to login screen
  test('Navigation to login screen works', async ({ page }) => {
    await page.goto('https://kiddo-quest-de7b0.web.app/');
    
    // Click the Get Started button
    await page.getByText('Get Started for FREE').click();
    
    // Verify we're on the login screen
    await expect(page.getByText('Log in to your account')).toBeVisible();
    
    // Check for authentication form
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });
  
  // Test Firebase initialization 
  test('Firebase initializes correctly', async ({ page }) => {
    // Listen for errors related to Firebase
    const firebaseErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('firebase')) {
        firebaseErrors.push(msg.text());
      }
    });
    
    await page.goto('https://kiddo-quest-de7b0.web.app/');
    
    // Wait for any potential Firebase initialization
    await page.waitForTimeout(2000);
    
    expect(firebaseErrors.length, 'There should be no Firebase errors').toBe(0);
  });
});
