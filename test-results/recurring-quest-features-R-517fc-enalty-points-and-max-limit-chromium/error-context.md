# Test info

- Name: Recurring Quest Enhancements >> recurring quest displays penalty points and max limit
- Location: /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/recurring-quest-features.spec.js:74:3

# Error details

```
Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
    1) <button type="submit" class="flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 px-4 py-2  w-full mt-2">…</button> aka getByRole('button', { name: 'Sign In with Email' })
    2) <button type="button" class="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 shadow-sm">…</button> aka getByRole('button', { name: 'Sign in with Google' })

Call log:
  - waiting for locator('button').filter({ hasText: 'Sign In' })

    at /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/recurring-quest-features.spec.js:83:58
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
   4 | test.describe('Recurring Quest Enhancements', () => {
   5 |   // Test creating a recurring quest with penalty points
   6 |   test('parent can create a recurring quest with penalty points', async ({ page }) => {
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
   17 |     // Mock a logged-in user
   18 |     await page.evaluate(({ email }) => {
   19 |       // Mock a logged-in user
   20 |       localStorage.setItem('kiddo-quest-auth', JSON.stringify({
   21 |         uid: 'test-user-id',
   22 |         email: email,
   23 |         role: 'parent',
   24 |         isAdmin: false
   25 |       }));
   26 |       
   27 |       // Set the current view to quest form
   28 |       localStorage.setItem('kiddo-quest-view', 'questForm');
   29 |       
   30 |       // Mock child profiles for assignment
   31 |       localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
   32 |         { id: 'child-1', name: 'Test Child 1' },
   33 |         { id: 'child-2', name: 'Test Child 2' }
   34 |       ]));
   35 |     }, TEST_CREDENTIALS.user);
   36 |     
   37 |     // Reload the page to apply the localStorage changes
   38 |     await page.reload();
   39 |     
   40 |     // Wait for the quest form to load
   41 |     await expect(page.locator('text=Create New Quest')).toBeVisible();
   42 |     
   43 |     // Fill in the quest form
   44 |     await page.locator('input[name="title"]').fill('Daily Room Cleaning');
   45 |     await page.locator('textarea[name="description"]').fill('Clean your room every day');
   46 |     await page.locator('input[name="xp"]').fill('15');
   47 |     
   48 |     // Select recurring quest type
   49 |     await page.locator('select[name="type"]').selectOption('recurring');
   50 |     
   51 |     // Select daily frequency
   52 |     await page.locator('select[name="frequency"]').selectOption('daily');
   53 |     
   54 |     // Set penalty points
   55 |     await page.locator('input[name="penaltyPoints"]').fill('5');
   56 |     
   57 |     // Set max times per day
   58 |     await page.locator('input[name="maxPerCadence"]').fill('2');
   59 |     
   60 |     // Assign to a child
   61 |     await page.locator('input[type="checkbox"]').first().check();
   62 |     
   63 |     // Take a screenshot of the form
   64 |     await page.screenshot({ path: 'test-results/recurring-quest-form.png' });
   65 |     
   66 |     // Submit the form
   67 |     await page.locator('button', { hasText: 'Create Quest' }).click();
   68 |     
   69 |     // In a real test, we would verify the quest was created
   70 |     // For this mock test, we'll just verify the form submission
   71 |   });
   72 |   
   73 |   // Test viewing a recurring quest with penalty points and max limit
   74 |   test('recurring quest displays penalty points and max limit', async ({ page }) => {
   75 |     // Navigate to the login page
   76 |     await page.goto('/');
   77 |     
   78 |     // Fill in the login form with regular user credentials
   79 |     await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.user.email);
   80 |     await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.user.password);
   81 |     
   82 |     // Click the sign in button
>  83 |     await page.locator('button', { hasText: 'Sign In' }).click();
      |                                                          ^ Error: locator.click: Error: strict mode violation: locator('button').filter({ hasText: 'Sign In' }) resolved to 2 elements:
   84 |     
   85 |     // Mock a logged-in user with quests data
   86 |     await page.evaluate(({ email }) => {
   87 |       // Mock a logged-in user
   88 |       localStorage.setItem('kiddo-quest-auth', JSON.stringify({
   89 |         uid: 'test-user-id',
   90 |         email: email,
   91 |         role: 'parent',
   92 |         isAdmin: false
   93 |       }));
   94 |       
   95 |       // Set the current view to manage quests
   96 |       localStorage.setItem('kiddo-quest-view', 'manageQuests');
   97 |       
   98 |       // Mock quests data including a recurring quest with penalty points
   99 |       localStorage.setItem('kiddo-quest-quests', JSON.stringify([
  100 |         {
  101 |           id: 'quest-1',
  102 |           title: 'Daily Room Cleaning',
  103 |           description: 'Clean your room every day',
  104 |           xp: 15,
  105 |           type: 'recurring',
  106 |           frequency: 'daily',
  107 |           penaltyPoints: 5,
  108 |           maxPerCadence: 2,
  109 |           status: 'new',
  110 |           assignedTo: ['child-1'],
  111 |           iconName: 'Home'
  112 |         }
  113 |       ]));
  114 |       
  115 |       // Mock child profiles for display
  116 |       localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
  117 |         { id: 'child-1', name: 'Test Child 1' }
  118 |       ]));
  119 |     }, TEST_CREDENTIALS.user);
  120 |     
  121 |     // Reload the page to apply the localStorage changes
  122 |     await page.reload();
  123 |     
  124 |     // Wait for the manage quests page to load
  125 |     await expect(page.locator('text=Manage Quests')).toBeVisible();
  126 |     
  127 |     // Verify the quest is displayed
  128 |     await expect(page.locator('text=Daily Room Cleaning')).toBeVisible();
  129 |     
  130 |     // Verify the penalty points are displayed
  131 |     await expect(page.locator('text=-5 points if missed')).toBeVisible();
  132 |     
  133 |     // Verify the max limit is displayed
  134 |     await expect(page.locator('text=Max 2x per day')).toBeVisible();
  135 |     
  136 |     // Take a screenshot for verification
  137 |     await page.screenshot({ path: 'test-results/recurring-quest-display.png' });
  138 |   });
  139 | });
  140 |
```