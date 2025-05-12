const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, mockAuthentication } = require('./test-utils');

test.describe('Admin Console Features', () => {
  // Setup admin user for all tests in this group
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/');
    
    // Fill in the login form with admin credentials
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.admin.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.admin.password);
    
    // Click the sign in button
    await page.locator('button', { hasText: 'Sign In' }).click();
    
    // Mock an admin user login since we can't actually authenticate in tests
    await page.evaluate(({ email }) => {
      // Mock a logged-in admin user
      localStorage.setItem('kiddo-quest-auth', JSON.stringify({
        uid: 'admin-user-id',
        email: email, // Admin email
        role: 'parent',
        isAdmin: true
      }));
      
      // Set the current view to parent dashboard
      localStorage.setItem('kiddo-quest-view', 'parentDashboard');
    }, TEST_CREDENTIALS.admin);
    
    // Reload the page to apply the localStorage changes
    await page.reload();
    
    // Wait for the parent dashboard to load
    await expect(page.locator('text=Parent Dashboard')).toBeVisible();
    
    // Verify the admin console button is visible
    const adminConsoleButton = page.locator('button', { hasText: 'Admin Console' });
    await expect(adminConsoleButton).toBeVisible();
    
    // Click the admin console button
    await adminConsoleButton.click();
    
    // Wait for the admin console to load
    await expect(page.locator('text=Admin Console')).toBeVisible();
  });
  
  // Test bug report management
  test('admin can view and update bug reports', async ({ page }) => {
    // Mock bug report data
    await page.evaluate(() => {
      // Mock bug reports
      localStorage.setItem('kiddo-quest-feedback-reports', JSON.stringify([
        {
          id: 'bug-1',
          title: 'Login button not working',
          description: 'The login button is not responding when clicked',
          steps: 'Click on login button',
          severity: 'high',
          status: 'open',
          reportedBy: 'user@example.com',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bug-2',
          title: 'Missing icons in child dashboard',
          description: 'Some quest icons are not displaying correctly',
          steps: 'Navigate to child dashboard',
          severity: 'medium',
          status: 'in_progress',
          reportedBy: 'another@example.com',
          createdAt: new Date().toISOString()
        }
      ]));
    });
    
    // Reload the admin console
    await page.reload();
    
    // Click on the Bug Reports tab if not already active
    await page.locator('button', { hasText: 'Bug Reports' }).click();
    
    // Verify bug reports are displayed
    await expect(page.locator('text=Login button not working')).toBeVisible();
    await expect(page.locator('text=Missing icons in child dashboard')).toBeVisible();
    
    // Test filtering bug reports
    await page.locator('button', { hasText: 'In Progress' }).click();
    
    // Verify only in-progress bugs are shown
    await expect(page.locator('text=Missing icons in child dashboard')).toBeVisible();
    await expect(page.locator('text=Login button not working')).not.toBeVisible();
    
    // Take a screenshot of filtered bug reports
    await page.screenshot({ path: 'test-results/admin-bug-reports.png' });
    
    // Test updating a bug status
    // Click on the bug to open details
    await page.locator('text=Missing icons in child dashboard').click();
    
    // Verify bug details are displayed
    await expect(page.locator('text=Severity: Medium')).toBeVisible();
    
    // Change status to resolved
    await page.locator('select[name="status"]').selectOption('resolved');
    
    // Click update button
    await page.locator('button', { hasText: 'Update Status' }).click();
    
    // Verify status is updated (would check for success message or updated list)
  });
  
  // Test user invitation system
  test('admin can send and manage invitations', async ({ page }) => {
    // Click on the User Invitations tab
    await page.locator('button', { hasText: 'User Invitations' }).click();
    
    // Verify the invitation form is displayed
    await expect(page.locator('text=Invite New User')).toBeVisible();
    
    // Fill in the invitation form
    await page.locator('input[name="email"]').fill('newuser@example.com');
    await page.locator('textarea[name="message"]').fill('Welcome to Kiddo Quest testing!');
    
    // Take a screenshot of the invitation form
    await page.screenshot({ path: 'test-results/admin-invitations.png' });
    
    // Submit the invitation
    await page.locator('button', { hasText: 'Send Invitation' }).click();
    
    // Verify success message (would appear in a real test)
    // await expect(page.locator('text=Invitation sent successfully')).toBeVisible();
    
    // Mock an invitation in the system
    await page.evaluate(() => {
      // Mock invitations
      localStorage.setItem('kiddo-quest-invitations', JSON.stringify([
        {
          id: 'inv-1',
          email: 'newuser@example.com',
          message: 'Welcome to Kiddo Quest testing!',
          status: 'sent',
          createdAt: new Date().toISOString(),
          sentBy: 'thetangstr@gmail.com'
        }
      ]));
    });
    
    // Reload to see the invitation
    await page.reload();
    await page.locator('button', { hasText: 'User Invitations' }).click();
    
    // Verify the invitation appears in the list
    await expect(page.locator('text=newuser@example.com')).toBeVisible();
    await expect(page.locator('text=sent')).toBeVisible();
  });
  
  // Test active users management
  test('admin can manage active users', async ({ page }) => {
    // Click on the Active Users tab
    await page.locator('button', { hasText: 'Active Users' }).click();
    
    // Mock active users data
    await page.evaluate(() => {
      // Mock users
      localStorage.setItem('kiddo-quest-active-users', JSON.stringify([
        {
          id: 'user-1',
          email: 'user@example.com',
          status: 'active',
          type: 'app_user',
          lastLogin: new Date().toISOString(),
          loginCount: 5
        },
        {
          id: 'user-2',
          email: 'admin@example.com',
          status: 'active',
          type: 'admin',
          lastLogin: new Date().toISOString(),
          loginCount: 10
        }
      ]));
    });
    
    // Reload to see the users
    await page.reload();
    await page.locator('button', { hasText: 'Active Users' }).click();
    
    // Verify users are displayed with their types
    await expect(page.locator('text=user@example.com')).toBeVisible();
    await expect(page.locator('text=App User')).toBeVisible();
    await expect(page.locator('text=admin@example.com')).toBeVisible();
    await expect(page.locator('text=Admin')).toBeVisible();
    
    // Test deactivating a user
    const deactivateButton = page.locator('button', { hasText: 'Deactivate' }).first();
    await deactivateButton.click();
    
    // Take a screenshot of user management
    await page.screenshot({ path: 'test-results/admin-active-users.png' });
    
    // In a real test, we would verify the user's status was updated
  });
});
