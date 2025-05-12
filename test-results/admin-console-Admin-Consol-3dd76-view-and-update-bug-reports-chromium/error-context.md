# Test info

- Name: Admin Console Features >> admin can view and update bug reports
- Location: /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/admin-console.spec.js:49:3

# Error details

```
Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
    1) <button type="submit" class="flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 px-4 py-2  w-full mt-2">…</button> aka getByRole('button', { name: 'Sign In with Email' })
    2) <button type="button" class="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm">…</button> aka getByRole('button', { name: 'Sign in with Google' })

Call log:
  - waiting for locator('button').filter({ hasText: 'Sign In' })

    at /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/admin-console.spec.js:15:58
```

# Page snapshot

```yaml
- heading "Kiddo Quest" [level=1]
- paragraph: Sign in to manage quests and rewards
- text: Email *
- textbox "Enter your email": admin@example.com
- text: Password *
- textbox "Enter your password": password
- button "Sign In with Email"
- text: OR
- button "Sign in with Google":
  - img
  - text: Sign in with Google
- paragraph:
  - text: Don't have an account?
  - button "Register"
- button "Send Feedback or Report Bug":
  - img "bug": 🐞
  - text: Feedback
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 | const { TEST_CREDENTIALS, mockAuthentication } = require('./test-utils');
   3 |
   4 | test.describe('Admin Console Features', () => {
   5 |   // Setup admin user for all tests in this group
   6 |   test.beforeEach(async ({ page }) => {
   7 |     // Navigate to the login page
   8 |     await page.goto('/');
   9 |     
   10 |     // Fill in the login form with admin credentials
   11 |     await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.admin.email);
   12 |     await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.admin.password);
   13 |     
   14 |     // Click the sign in button
>  15 |     await page.locator('button', { hasText: 'Sign In' }).click();
      |                                                          ^ Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
   16 |     
   17 |     // Mock an admin user login since we can't actually authenticate in tests
   18 |     await page.evaluate(({ email }) => {
   19 |       // Mock a logged-in admin user
   20 |       localStorage.setItem('kiddo-quest-auth', JSON.stringify({
   21 |         uid: 'admin-user-id',
   22 |         email: email, // Admin email
   23 |         role: 'parent',
   24 |         isAdmin: true
   25 |       }));
   26 |       
   27 |       // Set the current view to parent dashboard
   28 |       localStorage.setItem('kiddo-quest-view', 'parentDashboard');
   29 |     }, TEST_CREDENTIALS.admin);
   30 |     
   31 |     // Reload the page to apply the localStorage changes
   32 |     await page.reload();
   33 |     
   34 |     // Wait for the parent dashboard to load
   35 |     await expect(page.locator('text=Parent Dashboard')).toBeVisible();
   36 |     
   37 |     // Verify the admin console button is visible
   38 |     const adminConsoleButton = page.locator('button', { hasText: 'Admin Console' });
   39 |     await expect(adminConsoleButton).toBeVisible();
   40 |     
   41 |     // Click the admin console button
   42 |     await adminConsoleButton.click();
   43 |     
   44 |     // Wait for the admin console to load
   45 |     await expect(page.locator('text=Admin Console')).toBeVisible();
   46 |   });
   47 |   
   48 |   // Test bug report management
   49 |   test('admin can view and update bug reports', async ({ page }) => {
   50 |     // Mock bug report data
   51 |     await page.evaluate(() => {
   52 |       // Mock bug reports
   53 |       localStorage.setItem('kiddo-quest-feedback-reports', JSON.stringify([
   54 |         {
   55 |           id: 'bug-1',
   56 |           title: 'Login button not working',
   57 |           description: 'The login button is not responding when clicked',
   58 |           steps: 'Click on login button',
   59 |           severity: 'high',
   60 |           status: 'open',
   61 |           reportedBy: 'user@example.com',
   62 |           createdAt: new Date().toISOString()
   63 |         },
   64 |         {
   65 |           id: 'bug-2',
   66 |           title: 'Missing icons in child dashboard',
   67 |           description: 'Some quest icons are not displaying correctly',
   68 |           steps: 'Navigate to child dashboard',
   69 |           severity: 'medium',
   70 |           status: 'in_progress',
   71 |           reportedBy: 'another@example.com',
   72 |           createdAt: new Date().toISOString()
   73 |         }
   74 |       ]));
   75 |     });
   76 |     
   77 |     // Reload the admin console
   78 |     await page.reload();
   79 |     
   80 |     // Click on the Bug Reports tab if not already active
   81 |     await page.locator('button', { hasText: 'Bug Reports' }).click();
   82 |     
   83 |     // Verify bug reports are displayed
   84 |     await expect(page.locator('text=Login button not working')).toBeVisible();
   85 |     await expect(page.locator('text=Missing icons in child dashboard')).toBeVisible();
   86 |     
   87 |     // Test filtering bug reports
   88 |     await page.locator('button', { hasText: 'In Progress' }).click();
   89 |     
   90 |     // Verify only in-progress bugs are shown
   91 |     await expect(page.locator('text=Missing icons in child dashboard')).toBeVisible();
   92 |     await expect(page.locator('text=Login button not working')).not.toBeVisible();
   93 |     
   94 |     // Take a screenshot of filtered bug reports
   95 |     await page.screenshot({ path: 'test-results/admin-bug-reports.png' });
   96 |     
   97 |     // Test updating a bug status
   98 |     // Click on the bug to open details
   99 |     await page.locator('text=Missing icons in child dashboard').click();
  100 |     
  101 |     // Verify bug details are displayed
  102 |     await expect(page.locator('text=Severity: Medium')).toBeVisible();
  103 |     
  104 |     // Change status to resolved
  105 |     await page.locator('select[name="status"]').selectOption('resolved');
  106 |     
  107 |     // Click update button
  108 |     await page.locator('button', { hasText: 'Update Status' }).click();
  109 |     
  110 |     // Verify status is updated (would check for success message or updated list)
  111 |   });
  112 |   
  113 |   // Test user invitation system
  114 |   test('admin can send and manage invitations', async ({ page }) => {
  115 |     // Click on the User Invitations tab
```