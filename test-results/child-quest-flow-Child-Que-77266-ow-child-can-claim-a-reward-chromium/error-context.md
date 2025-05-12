# Test info

- Name: Child Quest Completion Flow >> child can claim a reward
- Location: /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/child-quest-flow.spec.js:186:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=Test Child 1')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('text=Test Child 1')

    at /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/child-quest-flow.spec.js:59:53
```

# Page snapshot

```yaml
- heading "Kiddo Quest" [level=1]
- paragraph: Sign in to manage quests and rewards
- text: Email *
- textbox "Enter your email"
- text: Password *
- textbox "Enter your password"
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
   4 | test.describe('Child Quest Completion Flow', () => {
   5 |   // Skip these tests in CI environments since they require UI interaction
   6 |   test.skip(({ browserName }) => browserName !== 'chromium', 'Test only runs on Chromium');
   7 |   
   8 |   // Setup for all tests in this group
   9 |   test.beforeEach(async ({ page }) => {
   10 |     // Navigate to the login page
   11 |     await page.goto('/');
   12 |     
   13 |     // Mock a logged-in parent user with child profiles and quests
   14 |     await page.evaluate(() => {
   15 |       // Mock a logged-in user
   16 |       localStorage.setItem('kiddo-quest-auth', JSON.stringify({
   17 |         uid: 'test-parent-id',
   18 |         email: 'test@example.com',
   19 |         role: 'parent',
   20 |         isAdmin: false
   21 |       }));
   22 |       
   23 |       // Mock child profiles
   24 |       localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
   25 |         { id: 'child-1', name: 'Test Child 1', avatar: '👦', xp: 50 },
   26 |         { id: 'child-2', name: 'Test Child 2', avatar: '👧', xp: 30 }
   27 |       ]));
   28 |       
   29 |       // Mock quests
   30 |       localStorage.setItem('kiddo-quest-quests', JSON.stringify([
   31 |         { 
   32 |           id: 'quest-1', 
   33 |           title: 'Clean Room', 
   34 |           description: 'Clean your room thoroughly', 
   35 |           points: 10,
   36 |           recurring: false,
   37 |           icon: 'Trash'
   38 |         },
   39 |         { 
   40 |           id: 'quest-2', 
   41 |           title: 'Do Homework', 
   42 |           description: 'Complete all homework assignments', 
   43 |           points: 15,
   44 |           recurring: true,
   45 |           frequency: 'daily',
   46 |           icon: 'BookOpen'
   47 |         }
   48 |       ]));
   49 |       
   50 |       // Set the current view to child dashboard
   51 |       localStorage.setItem('kiddo-quest-view', 'childDashboard');
   52 |       localStorage.setItem('kiddo-quest-selected-child', 'child-1');
   53 |     });
   54 |     
   55 |     // Reload the page to apply the localStorage changes
   56 |     await page.reload();
   57 |     
   58 |     // Wait for the child dashboard to load
>  59 |     await expect(page.locator('text=Test Child 1')).toBeVisible();
      |                                                     ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
   60 |   });
   61 |   
   62 |   test('child can view available quests', async ({ page }) => {
   63 |     // Verify quests are visible
   64 |     await expect(page.locator('text=Clean Room')).toBeVisible();
   65 |     await expect(page.locator('text=Do Homework')).toBeVisible();
   66 |     
   67 |     // Verify points are displayed
   68 |     await expect(page.locator('text=10 points')).toBeVisible();
   69 |     await expect(page.locator('text=15 points')).toBeVisible();
   70 |   });
   71 |   
   72 |   test('child can claim a completed quest', async ({ page }) => {
   73 |     // Click on a quest to claim it
   74 |     await page.locator('text=Clean Room').click();
   75 |     
   76 |     // Verify the claim dialog appears
   77 |     await expect(page.locator('text=Claim Quest Completion')).toBeVisible();
   78 |     
   79 |     // Mock the quest claiming
   80 |     await page.evaluate(() => {
   81 |       // Mock quest completions
   82 |       localStorage.setItem('kiddo-quest-quest-completions', JSON.stringify([
   83 |         { 
   84 |           id: 'completion-1', 
   85 |           questId: 'quest-1', 
   86 |           childId: 'child-1', 
   87 |           status: 'pending', 
   88 |           claimedAt: new Date().toISOString()
   89 |         }
   90 |       ]));
   91 |     });
   92 |     
   93 |     // Click the claim button
   94 |     await page.locator('button', { hasText: 'Claim Completion' }).click();
   95 |     
   96 |     // Verify success message
   97 |     await expect(page.locator('text=Quest claimed! Waiting for parent approval')).toBeVisible();
   98 |   });
   99 |   
  100 |   test('parent can approve a claimed quest', async ({ page }) => {
  101 |     // Mock quest completions with a pending quest
  102 |     await page.evaluate(() => {
  103 |       // Mock quest completions
  104 |       localStorage.setItem('kiddo-quest-quest-completions', JSON.stringify([
  105 |         { 
  106 |           id: 'completion-1', 
  107 |           questId: 'quest-1', 
  108 |           childId: 'child-1', 
  109 |           status: 'pending', 
  110 |           claimedAt: new Date().toISOString()
  111 |         }
  112 |       ]));
  113 |       
  114 |       // Switch to parent dashboard
  115 |       localStorage.setItem('kiddo-quest-view', 'parentDashboard');
  116 |     });
  117 |     
  118 |     // Reload the page to apply changes
  119 |     await page.reload();
  120 |     
  121 |     // Wait for parent dashboard to load
  122 |     await expect(page.locator('text=Parent Dashboard')).toBeVisible();
  123 |     
  124 |     // Verify pending quest is visible
  125 |     await expect(page.locator('text=Pending Approvals')).toBeVisible();
  126 |     await expect(page.locator('text=Clean Room')).toBeVisible();
  127 |     
  128 |     // Mock the approval process
  129 |     await page.evaluate(() => {
  130 |       // Update quest completion status
  131 |       const completions = JSON.parse(localStorage.getItem('kiddo-quest-quest-completions'));
  132 |       completions[0].status = 'approved';
  133 |       completions[0].approvedAt = new Date().toISOString();
  134 |       localStorage.setItem('kiddo-quest-quest-completions', JSON.stringify(completions));
  135 |       
  136 |       // Update child XP
  137 |       const children = JSON.parse(localStorage.getItem('kiddo-quest-child-profiles'));
  138 |       children[0].xp = 60; // Add 10 points
  139 |       localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify(children));
  140 |     });
  141 |     
  142 |     // Click approve button
  143 |     await page.locator('button', { hasText: 'Approve' }).click();
  144 |     
  145 |     // Verify success message
  146 |     await expect(page.locator('text=Quest approved!')).toBeVisible();
  147 |     
  148 |     // Verify child XP has been updated
  149 |     await expect(page.locator('text=60 XP')).toBeVisible();
  150 |   });
  151 |   
  152 |   test('child can view available rewards', async ({ page }) => {
  153 |     // Mock rewards
  154 |     await page.evaluate(() => {
  155 |       // Add rewards
  156 |       localStorage.setItem('kiddo-quest-rewards', JSON.stringify([
  157 |         { 
  158 |           id: 'reward-1', 
  159 |           title: 'Ice Cream', 
```