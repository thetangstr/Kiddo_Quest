# Test info

- Name: Authentication >> admin can login with admin credentials
- Location: /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/auth.spec.js:69:3

# Error details

```
Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
    1) <button type="submit" class="flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 px-4 py-2  w-full mt-2">…</button> aka getByRole('button', { name: 'Sign In with Email' })
    2) <button type="button" class="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm">…</button> aka getByRole('button', { name: 'Sign in with Google' })

Call log:
  - waiting for locator('button').filter({ hasText: 'Sign In' })

    at /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/auth.spec.js:80:58
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
   2 | const { TEST_CREDENTIALS } = require('./test-utils');
   3 |
   4 | test.describe('Authentication', () => {
   5 |   test('login page loads correctly', async ({ page }) => {
   6 |     await page.goto('/');
   7 |     
   8 |     // Verify the login page elements are visible
   9 |     await expect(page.locator('text=Sign in with Google')).toBeVisible();
   10 |     await expect(page.locator('text=Kiddo Quest')).toBeVisible();
   11 |     
   12 |     // Verify email/password fields are visible
   13 |     await expect(page.locator('input[type="email"]')).toBeVisible();
   14 |     await expect(page.locator('input[type="password"]')).toBeVisible();
   15 |   });
   16 |
   17 |   test('login page has Google sign-in button', async ({ page }) => {
   18 |     // This test verifies that the login page has Google sign-in functionality
   19 |     // which is part of our authentication flow with allowlist validation
   20 |     
   21 |     await page.goto('/');
   22 |     
   23 |     // Check that we're showing the login screen with Google sign-in button
   24 |     await expect(page.locator('text=Sign in with Google')).toBeVisible();
   25 |     
   26 |     // Verify that the app has authentication elements
   27 |     const content = await page.evaluate(() => {
   28 |       return document.documentElement.outerHTML;
   29 |     });
   30 |     
   31 |     // Check for elements that definitely exist on the login page
   32 |     expect(content).toContain('Sign in');
   33 |   });
   34 |   
   35 |   test('user can login with test credentials', async ({ page }) => {
   36 |     await page.goto('/');
   37 |     
   38 |     // Fill in the login form with regular user credentials
   39 |     await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.user.email);
   40 |     await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.user.password);
   41 |     
   42 |     // Take a screenshot before login
   43 |     await page.screenshot({ path: 'test-results/before-login.png' });
   44 |     
   45 |     // Click the sign in button
   46 |     await page.locator('button', { hasText: 'Sign In' }).click();
   47 |     
   48 |     // Since we can't actually authenticate in tests, we'll mock the authenticated state
   49 |     await page.evaluate(({ email }) => {
   50 |       localStorage.setItem('kiddo-quest-auth', JSON.stringify({
   51 |         uid: 'test-user-id',
   52 |         email: email,
   53 |         role: 'parent',
   54 |         isAdmin: false
   55 |       }));
   56 |       localStorage.setItem('kiddo-quest-view', 'parentDashboard');
   57 |     }, TEST_CREDENTIALS.user);
   58 |     
   59 |     // Reload the page to apply the localStorage changes
   60 |     await page.reload();
   61 |     
   62 |     // Verify we're on the parent dashboard
   63 |     await expect(page.locator('text=Parent Dashboard')).toBeVisible();
   64 |     
   65 |     // Take a screenshot after login
   66 |     await page.screenshot({ path: 'test-results/after-login.png' });
   67 |   });
   68 |   
   69 |   test('admin can login with admin credentials', async ({ page }) => {
   70 |     await page.goto('/');
   71 |     
   72 |     // Fill in the login form with admin credentials
   73 |     await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.admin.email);
   74 |     await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.admin.password);
   75 |     
   76 |     // Take a screenshot before login
   77 |     await page.screenshot({ path: 'test-results/before-admin-login.png' });
   78 |     
   79 |     // Click the sign in button
>  80 |     await page.locator('button', { hasText: 'Sign In' }).click();
      |                                                          ^ Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
   81 |     
   82 |     // Since we can't actually authenticate in tests, we'll mock the authenticated state
   83 |     await page.evaluate(({ email }) => {
   84 |       localStorage.setItem('kiddo-quest-auth', JSON.stringify({
   85 |         uid: 'admin-user-id',
   86 |         email: email,
   87 |         role: 'parent',
   88 |         isAdmin: true
   89 |       }));
   90 |       localStorage.setItem('kiddo-quest-view', 'adminDashboard');
   91 |     }, TEST_CREDENTIALS.admin);
   92 |     
   93 |     // Reload the page to apply the localStorage changes
   94 |     await page.reload();
   95 |     
   96 |     // Verify we're on the admin dashboard or have access to admin features
   97 |     await expect(page.locator('text=Admin Console')).toBeVisible();
   98 |     
   99 |     // Take a screenshot after login
  100 |     await page.screenshot({ path: 'test-results/after-admin-login.png' });
  101 |   });
  102 | });
  103 |
```