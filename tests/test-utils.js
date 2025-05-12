// Test utilities for Playwright tests

/**
 * Test credentials for Kiddo Quest
 */
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@example.com',
    password: 'password',
    isAdmin: true
  },
  user: {
    email: 'user@example.com',
    password: 'password',
    isAdmin: false
  }
};

/**
 * Mock authentication for tests
 * @param {Object} page - Playwright page object
 * @param {string} userType - Type of user to authenticate as ('admin' or 'user')
 */
async function mockAuthentication(page, userType = 'user') {
  const credentials = TEST_CREDENTIALS[userType];
  
  if (!credentials) {
    throw new Error(`Unknown user type: ${userType}`);
  }
  
  // Mock a logged-in user
  await page.evaluate(({ email, isAdmin }) => {
    localStorage.setItem('kiddo-quest-auth', JSON.stringify({
      uid: email === 'admin@example.com' ? 'admin-user-id' : 'test-user-id',
      email: email,
      role: 'parent',
      isAdmin: isAdmin
    }));
    
    // Set the current view to parent dashboard
    localStorage.setItem('kiddo-quest-view', isAdmin ? 'adminDashboard' : 'parentDashboard');
  }, credentials);
  
  // Reload the page to apply the localStorage changes
  await page.reload();
}

/**
 * Attempt to login with actual credentials
 * This will only work if the app is running and connected to Firebase
 * @param {Object} page - Playwright page object
 * @param {string} userType - Type of user to login as ('admin' or 'user')
 */
async function loginWithCredentials(page, userType = 'user') {
  const credentials = TEST_CREDENTIALS[userType];
  
  if (!credentials) {
    throw new Error(`Unknown user type: ${userType}`);
  }
  
  // Navigate to login page
  await page.goto('/');
  
  // Fill in email and password
  await page.locator('input[type="email"]').fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);
  
  // Click login button
  await page.locator('button', { hasText: 'Sign In' }).click();
  
  // Wait for dashboard to load
  const expectedText = credentials.isAdmin ? 'Admin Dashboard' : 'Parent Dashboard';
  await page.waitForSelector(`text=${expectedText}`, { timeout: 10000 });
}

module.exports = {
  TEST_CREDENTIALS,
  mockAuthentication,
  loginWithCredentials
};
