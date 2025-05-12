# Test info

- Name: PIN Protection System >> PIN verification is required when accessing parent dashboard from child view
- Location: /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/pin-protection.spec.js:63:3

# Error details

```
Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
    1) <button type="submit" class="flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 px-4 py-2  w-full mt-2">…</button> aka getByRole('button', { name: 'Sign In with Email' })
    2) <button type="button" class="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm">…</button> aka getByRole('button', { name: 'Sign in with Google' })

Call log:
  - waiting for locator('button').filter({ hasText: 'Sign In' })

    at /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/pin-protection.spec.js:72:58
```

# Page snapshot

```yaml
- heading "Kiddo Quest" [level=1]
- paragraph: Sign in to manage quests and rewards
- text: Email *
- textbox "Enter your email": user@example.com
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
   4 | test.describe('PIN Protection System', () => {
   5 |   // Test PIN setup in parent dashboard
   6 |   test('parent can set up a PIN', async ({ page }) => {
   7 |     // Navigate to the login page
   8 |     await page.goto('/');
   9 |     
   10 |     // Fill in the login form with regular user credentials
   11 |     await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.user.email);
   12 |     await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.user.password);
   13 |     
   14 |     // Click the sign in button
   15 |     await page.locator('button', { hasText: 'Sign In' }).click();
   16 |     
   17 |     // Since we can't actually log in during tests, we'll mock the authenticated state
   18 |     // by setting localStorage values that would normally be set after login
   19 |     await page.evaluate(({ email }) => {
   20 |       // Mock a logged-in user
   21 |       localStorage.setItem('kiddo-quest-auth', JSON.stringify({
   22 |         uid: 'test-user-id',
   23 |         email: email,
   24 |         role: 'parent',
   25 |         isAdmin: false
   26 |       }));
   27 |       
   28 |       // Set the current view to parent dashboard
   29 |       localStorage.setItem('kiddo-quest-view', 'parentDashboard');
   30 |     }, TEST_CREDENTIALS.user);
   31 |     
   32 |     // Reload the page to apply the localStorage changes
   33 |     await page.reload();
   34 |     
   35 |     // Wait for the parent dashboard to load
   36 |     await expect(page.locator('text=Parent Dashboard')).toBeVisible();
   37 |     
   38 |     // Look for the PIN setup button
   39 |     const pinSetupButton = page.locator('button', { hasText: /Set Up PIN|Change PIN/ });
   40 |     await expect(pinSetupButton).toBeVisible();
   41 |     
   42 |     // Click the PIN setup button
   43 |     await pinSetupButton.click();
   44 |     
   45 |     // Verify the PIN setup form is displayed
   46 |     await expect(page.locator('text=Parent PIN Setup')).toBeVisible();
   47 |     
   48 |     // Fill in the PIN form
   49 |     await page.locator('input[placeholder="Enter 4-digit PIN"]').fill('1234');
   50 |     await page.locator('input[placeholder="Confirm PIN"]').fill('1234');
   51 |     
   52 |     // Submit the form
   53 |     await page.locator('button', { hasText: 'Set PIN' }).click();
   54 |     
   55 |     // Verify success message appears
   56 |     await expect(page.locator('text=PIN successfully set')).toBeVisible();
   57 |     
   58 |     // Take a screenshot for verification
   59 |     await page.screenshot({ path: 'test-results/pin-setup-success.png' });
   60 |   });
   61 |   
   62 |   // Test PIN verification when accessing parent dashboard from child view
   63 |   test('PIN verification is required when accessing parent dashboard from child view', async ({ page }) => {
   64 |     // Navigate to the login page
   65 |     await page.goto('/');
   66 |     
   67 |     // Fill in the login form with regular user credentials
   68 |     await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.user.email);
   69 |     await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.user.password);
   70 |     
   71 |     // Click the sign in button
>  72 |     await page.locator('button', { hasText: 'Sign In' }).click();
      |                                                          ^ Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
   73 |     
   74 |     // Mock a logged-in user with a child selected
   75 |     await page.evaluate(({ email }) => {
   76 |       // Mock a logged-in user
   77 |       localStorage.setItem('kiddo-quest-auth', JSON.stringify({
   78 |         uid: 'test-user-id',
   79 |         email: email,
   80 |         role: 'parent',
   81 |         isAdmin: false
   82 |       }));
   83 |       
   84 |       // Set the current view to child dashboard
   85 |       localStorage.setItem('kiddo-quest-view', 'childDashboard');
   86 |       
   87 |       // Set a selected child ID
   88 |       localStorage.setItem('kiddo-quest-selected-child', 'test-child-id');
   89 |       
   90 |       // Mock that a PIN has been set
   91 |       localStorage.setItem('kiddo-quest-has-pin', 'true');
   92 |     }, TEST_CREDENTIALS.user);
   93 |     
   94 |     // Reload the page to apply the localStorage changes
   95 |     await page.reload();
   96 |     
   97 |     // Wait for the child dashboard to load
   98 |     await expect(page.locator('text=Child Dashboard')).toBeVisible({ timeout: 10000 });
   99 |     
  100 |     // Look for the parent access button (lock icon)
  101 |     const parentAccessButton = page.locator('button[aria-label="Parent Access"]');
  102 |     await expect(parentAccessButton).toBeVisible();
  103 |     
  104 |     // Click the parent access button
  105 |     await parentAccessButton.click();
  106 |     
  107 |     // Verify the PIN verification modal is displayed
  108 |     await expect(page.locator('text=Parent Access Required')).toBeVisible();
  109 |     await expect(page.locator('text=Please enter your 4-digit PIN')).toBeVisible();
  110 |     
  111 |     // Take a screenshot for verification
  112 |     await page.screenshot({ path: 'test-results/pin-verification-modal.png' });
  113 |     
  114 |     // Enter the PIN
  115 |     await page.locator('input[placeholder="Enter 4-digit PIN"]').fill('1234');
  116 |     
  117 |     // Click the verify button
  118 |     await page.locator('button', { hasText: 'Verify PIN' }).click();
  119 |     
  120 |     // This would normally transition to the parent dashboard, but in our test
  121 |     // we can just verify the PIN verification process
  122 |   });
  123 | });
  124 |
```