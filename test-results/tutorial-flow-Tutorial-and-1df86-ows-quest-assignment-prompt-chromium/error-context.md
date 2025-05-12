# Test info

- Name: Tutorial and First-Run Experience >> tutorial shows quest assignment prompt
- Location: /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/tutorial-flow.spec.js:112:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=Welcome to Kiddo Quest!')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('text=Welcome to Kiddo Quest!')

    at /Users/edward/Desktop/Projects/Kiddo_Quest/kiddo-quest/tests/tutorial-flow.spec.js:114:64
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
   14 |         uid: 'test-parent-id',
   15 |         email: email,
   16 |         role: 'parent',
   17 |         isAdmin: false
   18 |       }));
   19 |       
   20 |       // Set the current view to parent dashboard
   21 |       localStorage.setItem('kiddo-quest-view', 'parentDashboard');
   22 |       
   23 |       // Clear tutorial flags to ensure it shows
   24 |       localStorage.removeItem('kiddoquest_tutorial_seen');
   25 |     }, TEST_CREDENTIALS.user);
   26 |     
   27 |     // Reload the page to apply the localStorage changes
   28 |     await page.reload();
   29 |   });
   30 |   
   31 |   test('tutorial displays for first-time users', async ({ page }) => {
   32 |     // Wait for the tutorial to be visible
   33 |     await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
   34 |     
   35 |     // Verify the welcome screen elements
   36 |     await expect(page.locator('text=Let\'s get you set up in just two simple steps')).toBeVisible();
   37 |     await expect(page.locator('button', { hasText: 'Let\'s Get Started' })).toBeVisible();
   38 |   });
   39 |   
   40 |   test('tutorial allows child profile creation', async ({ page }) => {
   41 |     // Wait for the tutorial to be visible
   42 |     await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
   43 |     
   44 |     // Click the get started button
   45 |     await page.locator('button', { hasText: 'Let\'s Get Started' }).click();
   46 |     
   47 |     // Verify we're on the child creation step
   48 |     await expect(page.locator('text=Create Child Profile')).toBeVisible();
   49 |     
   50 |     // Fill in the child profile form
   51 |     await page.locator('input[placeholder="Enter name"]').fill('Test Child');
   52 |     
   53 |     // Select an avatar
   54 |     await page.locator('text=👦').first().click();
   55 |     
   56 |     // Mock the child creation
   57 |     await page.evaluate(() => {
   58 |       // Mock successful child creation
   59 |       localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
   60 |         { id: 'test-child-id', name: 'Test Child', avatar: '👦', xp: 0 }
   61 |       ]));
   62 |     });
   63 |     
   64 |     // Submit the form
   65 |     await page.locator('button', { hasText: 'Create Child Profile' }).click();
   66 |     
   67 |     // Verify success message
   68 |     await expect(page.locator('text=Child profile created successfully!')).toBeVisible();
   69 |   });
   70 |   
   71 |   test('tutorial allows PIN setup', async ({ page }) => {
   72 |     // Wait for the tutorial to be visible
   73 |     await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
   74 |     
   75 |     // Mock that we've already created a child and moved to PIN step
   76 |     await page.evaluate(() => {
   77 |       // Mock child profiles
   78 |       localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
   79 |         { id: 'test-child-id', name: 'Test Child', avatar: '👦', xp: 0 }
   80 |       ]));
   81 |     });
   82 |     
   83 |     // Click the get started button
   84 |     await page.locator('button', { hasText: 'Let\'s Get Started' }).click();
   85 |     
   86 |     // Click continue to move to PIN setup (since we've mocked having a child)
   87 |     await page.locator('button', { hasText: 'Create Child Profile' }).click();
   88 |     
   89 |     // Verify we're on the PIN setup step
   90 |     await expect(page.locator('text=Set Parent PIN')).toBeVisible();
   91 |     
   92 |     // Fill in the PIN form
   93 |     await page.locator('input[placeholder="Enter PIN"]').fill('1234');
   94 |     await page.locator('input[placeholder="Confirm PIN"]').fill('1234');
   95 |     
   96 |     // Mock successful PIN setup
   97 |     await page.evaluate(() => {
   98 |       // Mock PIN setup in user data
   99 |       localStorage.setItem('kiddo-quest-user-data', JSON.stringify({
  100 |         parentPin: true,
  101 |         pinVersion: 'sha256'
  102 |       }));
  103 |     });
  104 |     
  105 |     // Submit the form
  106 |     await page.locator('button', { hasText: 'Set PIN' }).click();
  107 |     
  108 |     // Verify success message
  109 |     await expect(page.locator('text=PIN Setup Complete!')).toBeVisible();
  110 |   });
  111 |   
  112 |   test('tutorial shows quest assignment prompt', async ({ page }) => {
  113 |     // Wait for the tutorial to be visible
> 114 |     await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
      |                                                                ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  115 |     
  116 |     // Mock that we've already created a child and set PIN
  117 |     await page.evaluate(() => {
  118 |       // Mock child profiles
  119 |       localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
  120 |         { id: 'test-child-id', name: 'Test Child', avatar: '👦', xp: 0 }
  121 |       ]));
  122 |       
  123 |       // Mock PIN setup in user data
  124 |       localStorage.setItem('kiddo-quest-user-data', JSON.stringify({
  125 |         parentPin: true,
  126 |         pinVersion: 'sha256'
  127 |       }));
  128 |     });
  129 |     
  130 |     // Click through to the final dialog
  131 |     await page.locator('button', { hasText: 'Let\'s Get Started' }).click();
  132 |     await page.locator('button', { hasText: 'Create Child Profile' }).click();
  133 |     await page.locator('button', { hasText: 'Set PIN' }).click();
  134 |     await page.locator('button', { hasText: 'Continue' }).click();
  135 |     
  136 |     // Verify we see the quest assignment prompt
  137 |     await expect(page.locator('text=Ready for Adventure!')).toBeVisible();
  138 |     await expect(page.locator('text=assign your first quest')).toBeVisible();
  139 |     await expect(page.locator('button', { hasText: 'Assign a Quest' })).toBeVisible();
  140 |     await expect(page.locator('button', { hasText: 'Go to Dashboard' })).toBeVisible();
  141 |   });
  142 |   
  143 |   test('tutorial can be skipped', async ({ page }) => {
  144 |     // Wait for the tutorial to be visible
  145 |     await expect(page.locator('text=Welcome to Kiddo Quest!')).toBeVisible();
  146 |     
  147 |     // Mock the confirmation dialog to return true
  148 |     await page.evaluate(() => {
  149 |       window.confirm = () => true;
  150 |     });
  151 |     
  152 |     // Click the skip button
  153 |     await page.locator('button[aria-label="Skip tutorial"]').click();
  154 |     
  155 |     // Verify the tutorial is no longer visible
  156 |     await expect(page.locator('text=Welcome to Kiddo Quest!')).not.toBeVisible();
  157 |     
  158 |     // Verify the tutorial is marked as seen in localStorage
  159 |     const tutorialSeen = await page.evaluate(() => {
  160 |       return localStorage.getItem('kiddoquest_tutorial_seen');
  161 |     });
  162 |     expect(tutorialSeen).toBe('true');
  163 |   });
  164 | });
  165 |
```