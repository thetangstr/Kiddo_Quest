# Test info

- Name: Quest Management Features >> parent can edit a quest to add penalties and limits
- Location: /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/quest-management.spec.js:115:3

# Error details

```
Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
    1) <button type="submit" class="flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 px-4 py-2  w-full mt-2">…</button> aka getByRole('button', { name: 'Sign In with Email' })
    2) <button type="button" class="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm">…</button> aka getByRole('button', { name: 'Sign in with Google' })

Call log:
  - waiting for locator('button').filter({ hasText: 'Sign In' })

    at /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/quest-management.spec.js:15:58
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
   4 | test.describe('Quest Management Features', () => {
   5 |   // Setup for all tests in this group
   6 |   test.beforeEach(async ({ page }) => {
   7 |     // Navigate to the login page
   8 |     await page.goto('/');
   9 |     
   10 |     // Fill in the login form with regular user credentials
   11 |     await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.user.email);
   12 |     await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.user.password);
   13 |     
   14 |     // Click the sign in button
>  15 |     await page.locator('button', { hasText: 'Sign In' }).click();
      |                                                          ^ Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
   16 |     
   17 |     // Mock a logged-in parent user
   18 |     await page.evaluate(({ email }) => {
   19 |       // Mock a logged-in user
   20 |       localStorage.setItem('kiddo-quest-auth', JSON.stringify({
   21 |         uid: 'test-parent-id',
   22 |         email: email,
   23 |         role: 'parent',
   24 |         isAdmin: false
   25 |       }));
   26 |       
   27 |       // Mock child profiles
   28 |       localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
   29 |         { id: 'child-1', name: 'Test Child 1', points: 50, iconName: 'User' },
   30 |         { id: 'child-2', name: 'Test Child 2', points: 30, iconName: 'User' }
   31 |       ]));
   32 |       
   33 |       // Set the current view to quest management
   34 |       localStorage.setItem('kiddo-quest-view', 'manageQuests');
   35 |     }, TEST_CREDENTIALS.user);
   36 |     
   37 |     // Reload the page to apply the localStorage changes
   38 |     await page.reload();
   39 |     
   40 |     // Wait for the quest management page to load
   41 |     await expect(page.locator('text=Manage Quests')).toBeVisible();
   42 |   });
   43 |   
   44 |   // Test creating a new quest
   45 |   test('parent can create a new one-time quest', async ({ page }) => {
   46 |     // Click on the "Add Quest" button
   47 |     await page.locator('button', { hasText: 'Add Quest' }).click();
   48 |     
   49 |     // Wait for the quest form to load
   50 |     await expect(page.locator('text=Create New Quest')).toBeVisible();
   51 |     
   52 |     // Fill in the quest form for a one-time quest
   53 |     await page.locator('input[name="title"]').fill('Clean Garage');
   54 |     await page.locator('textarea[name="description"]').fill('Clean and organize the garage');
   55 |     await page.locator('input[name="xp"]').fill('25');
   56 |     
   57 |     // Select one-time quest type (should be default)
   58 |     await page.locator('select[name="type"]').selectOption('one-time');
   59 |     
   60 |     // Assign to a child
   61 |     await page.locator('input[type="checkbox"]').first().check();
   62 |     
   63 |     // Take a screenshot of the form
   64 |     await page.screenshot({ path: 'test-results/one-time-quest-form.png' });
   65 |     
   66 |     // Submit the form
   67 |     await page.locator('button', { hasText: 'Create Quest' }).click();
   68 |     
   69 |     // In a real test, we would verify the quest was created
   70 |     // For this mock test, we'll just verify we return to the quest list
   71 |     await expect(page.locator('text=Manage Quests')).toBeVisible();
   72 |   });
   73 |   
   74 |   // Test creating a recurring quest with penalties and limits
   75 |   test('parent can create a recurring quest with penalties and limits', async ({ page }) => {
   76 |     // Click on the "Add Quest" button
   77 |     await page.locator('button', { hasText: 'Add Quest' }).click();
   78 |     
   79 |     // Wait for the quest form to load
   80 |     await expect(page.locator('text=Create New Quest')).toBeVisible();
   81 |     
   82 |     // Fill in the quest form for a recurring quest
   83 |     await page.locator('input[name="title"]').fill('Weekly Homework');
   84 |     await page.locator('textarea[name="description"]').fill('Complete all homework assignments');
   85 |     await page.locator('input[name="xp"]').fill('20');
   86 |     
   87 |     // Select recurring quest type
   88 |     await page.locator('select[name="type"]').selectOption('recurring');
   89 |     
   90 |     // Select weekly frequency
   91 |     await page.locator('select[name="frequency"]').selectOption('weekly');
   92 |     
   93 |     // Set penalty points
   94 |     await page.locator('input[name="penaltyPoints"]').fill('10');
   95 |     
   96 |     // Set max times per week
   97 |     await page.locator('input[name="maxPerCadence"]').fill('3');
   98 |     
   99 |     // Assign to both children
  100 |     await page.locator('input[type="checkbox"]').first().check();
  101 |     await page.locator('input[type="checkbox"]').nth(1).check();
  102 |     
  103 |     // Take a screenshot of the form
  104 |     await page.screenshot({ path: 'test-results/recurring-quest-form-complete.png' });
  105 |     
  106 |     // Submit the form
  107 |     await page.locator('button', { hasText: 'Create Quest' }).click();
  108 |     
  109 |     // In a real test, we would verify the quest was created
  110 |     // For this mock test, we'll just verify we return to the quest list
  111 |     await expect(page.locator('text=Manage Quests')).toBeVisible();
  112 |   });
  113 |   
  114 |   // Test editing an existing quest to add penalties and limits
  115 |   test('parent can edit a quest to add penalties and limits', async ({ page }) => {
```