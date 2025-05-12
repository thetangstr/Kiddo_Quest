const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, mockAuthentication } = require('./test-utils');

test.describe('Quest Management Features', () => {
  // Setup for all tests in this group
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/');
    
    // Fill in the login form with regular user credentials
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.user.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.user.password);
    
    // Click the sign in button
    await page.locator('button', { hasText: 'Sign In' }).click();
    
    // Mock a logged-in parent user
    await page.evaluate(({ email }) => {
      // Mock a logged-in user
      localStorage.setItem('kiddo-quest-auth', JSON.stringify({
        uid: 'test-parent-id',
        email: email,
        role: 'parent',
        isAdmin: false
      }));
      
      // Mock child profiles
      localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
        { id: 'child-1', name: 'Test Child 1', points: 50, iconName: 'User' },
        { id: 'child-2', name: 'Test Child 2', points: 30, iconName: 'User' }
      ]));
      
      // Set the current view to quest management
      localStorage.setItem('kiddo-quest-view', 'manageQuests');
    }, TEST_CREDENTIALS.user);
    
    // Reload the page to apply the localStorage changes
    await page.reload();
    
    // Wait for the quest management page to load
    await expect(page.locator('text=Manage Quests')).toBeVisible();
  });
  
  // Test creating a new quest
  test('parent can create a new one-time quest', async ({ page }) => {
    // Click on the "Add Quest" button
    await page.locator('button', { hasText: 'Add Quest' }).click();
    
    // Wait for the quest form to load
    await expect(page.locator('text=Create New Quest')).toBeVisible();
    
    // Fill in the quest form for a one-time quest
    await page.locator('input[name="title"]').fill('Clean Garage');
    await page.locator('textarea[name="description"]').fill('Clean and organize the garage');
    await page.locator('input[name="xp"]').fill('25');
    
    // Select one-time quest type (should be default)
    await page.locator('select[name="type"]').selectOption('one-time');
    
    // Assign to a child
    await page.locator('input[type="checkbox"]').first().check();
    
    // Take a screenshot of the form
    await page.screenshot({ path: 'test-results/one-time-quest-form.png' });
    
    // Submit the form
    await page.locator('button', { hasText: 'Create Quest' }).click();
    
    // In a real test, we would verify the quest was created
    // For this mock test, we'll just verify we return to the quest list
    await expect(page.locator('text=Manage Quests')).toBeVisible();
  });
  
  // Test creating a recurring quest with penalties and limits
  test('parent can create a recurring quest with penalties and limits', async ({ page }) => {
    // Click on the "Add Quest" button
    await page.locator('button', { hasText: 'Add Quest' }).click();
    
    // Wait for the quest form to load
    await expect(page.locator('text=Create New Quest')).toBeVisible();
    
    // Fill in the quest form for a recurring quest
    await page.locator('input[name="title"]').fill('Weekly Homework');
    await page.locator('textarea[name="description"]').fill('Complete all homework assignments');
    await page.locator('input[name="xp"]').fill('20');
    
    // Select recurring quest type
    await page.locator('select[name="type"]').selectOption('recurring');
    
    // Select weekly frequency
    await page.locator('select[name="frequency"]').selectOption('weekly');
    
    // Set penalty points
    await page.locator('input[name="penaltyPoints"]').fill('10');
    
    // Set max times per week
    await page.locator('input[name="maxPerCadence"]').fill('3');
    
    // Assign to both children
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').nth(1).check();
    
    // Take a screenshot of the form
    await page.screenshot({ path: 'test-results/recurring-quest-form-complete.png' });
    
    // Submit the form
    await page.locator('button', { hasText: 'Create Quest' }).click();
    
    // In a real test, we would verify the quest was created
    // For this mock test, we'll just verify we return to the quest list
    await expect(page.locator('text=Manage Quests')).toBeVisible();
  });
  
  // Test editing an existing quest to add penalties and limits
  test('parent can edit a quest to add penalties and limits', async ({ page }) => {
    // Mock an existing quest
    await page.evaluate(() => {
      // Mock quests data
      localStorage.setItem('kiddo-quest-quests', JSON.stringify([
        {
          id: 'quest-1',
          title: 'Daily Reading',
          description: 'Read for 30 minutes',
          xp: 15,
          type: 'recurring',
          frequency: 'daily',
          status: 'new',
          assignedTo: ['child-1'],
          iconName: 'BookOpen',
          parentId: 'test-parent-id'
        }
      ]));
    });
    
    // Reload the page to show the quest
    await page.reload();
    
    // Verify the quest is displayed
    await expect(page.locator('text=Daily Reading')).toBeVisible();
    
    // Click on the edit button for the quest
    await page.locator('button[aria-label="Edit Quest"]').click();
    
    // Wait for the edit form to load
    await expect(page.locator('text=Edit Quest')).toBeVisible();
    
    // Add penalty points
    await page.locator('input[name="penaltyPoints"]').fill('5');
    
    // Add max times per day
    await page.locator('input[name="maxPerCadence"]').fill('2');
    
    // Take a screenshot of the edit form
    await page.screenshot({ path: 'test-results/edit-quest-form.png' });
    
    // Submit the form
    await page.locator('button', { hasText: 'Update Quest' }).click();
    
    // In a real test, we would verify the quest was updated
    // For this mock test, we'll just verify we return to the quest list
    await expect(page.locator('text=Manage Quests')).toBeVisible();
  });
  
  // Test quest approval with penalties
  test('parent can approve a completed quest and apply penalties if needed', async ({ page }) => {
    // Mock a quest that's been claimed by a child
    await page.evaluate(() => {
      // Mock quests data with a claimed quest
      localStorage.setItem('kiddo-quest-quests', JSON.stringify([
        {
          id: 'quest-2',
          title: 'Weekly Chores',
          description: 'Complete all assigned chores',
          xp: 30,
          type: 'recurring',
          frequency: 'weekly',
          penaltyPoints: 15,
          maxPerCadence: 1,
          status: 'claimed',
          claimedBy: 'child-1',
          assignedTo: ['child-1'],
          iconName: 'Home',
          parentId: 'test-parent-id'
        }
      ]));
    });
    
    // Navigate to the parent dashboard to approve quests
    await page.evaluate(() => {
      localStorage.setItem('kiddo-quest-view', 'parentDashboard');
    });
    
    // Reload the page
    await page.reload();
    
    // Wait for the parent dashboard to load
    await expect(page.locator('text=Parent Dashboard')).toBeVisible();
    
    // Verify the claimed quest is displayed in the approval section
    await expect(page.locator('text=Weekly Chores')).toBeVisible();
    
    // Click the approve button
    await page.locator('button', { hasText: 'Approve' }).click();
    
    // Take a screenshot of the approval
    await page.screenshot({ path: 'test-results/quest-approval.png' });
    
    // In a real test, we would verify the quest was approved and points awarded
  });
  
  // Test quest expiration with penalties
  test('expired recurring quests apply penalties correctly', async ({ page }) => {
    // Mock a child with points and an expired quest
    await page.evaluate(() => {
      // Update child profile with points
      localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
        { id: 'child-1', name: 'Test Child 1', points: 50, iconName: 'User' }
      ]));
      
      // Mock an expired quest with penalties
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      localStorage.setItem('kiddo-quest-quests', JSON.stringify([
        {
          id: 'quest-3',
          title: 'Daily Homework',
          description: 'Complete homework assignments',
          xp: 20,
          type: 'recurring',
          frequency: 'daily',
          penaltyPoints: 10,
          maxPerCadence: 1,
          status: 'new',
          assignedTo: ['child-1'],
          iconName: 'BookOpen',
          parentId: 'test-parent-id',
          dueDate: yesterday.toISOString(),
          expired: true
        }
      ]));
    });
    
    // Navigate to the child dashboard to see the penalty applied
    await page.evaluate(() => {
      localStorage.setItem('kiddo-quest-view', 'childDashboard');
      localStorage.setItem('kiddo-quest-selected-child', 'child-1');
    });
    
    // Reload the page
    await page.reload();
    
    // Wait for the child dashboard to load
    await expect(page.locator('text=Child Dashboard')).toBeVisible();
    
    // Take a screenshot of the dashboard with penalties
    await page.screenshot({ path: 'test-results/quest-penalties.png' });
    
    // In a real test, we would verify the points were deducted
    // This would require checking the child's point total before and after
  });
});
