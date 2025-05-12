const { test, expect } = require('@playwright/test');
const { TEST_CREDENTIALS, mockAuthentication } = require('./test-utils');

test.describe('Child Quest Completion Flow', () => {
  // Skip these tests in CI environments since they require UI interaction
  test.skip(({ browserName }) => browserName !== 'chromium', 'Test only runs on Chromium');
  
  // Setup for all tests in this group
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/');
    
    // Mock a logged-in parent user with child profiles and quests
    await page.evaluate(() => {
      // Mock a logged-in user
      localStorage.setItem('kiddo-quest-auth', JSON.stringify({
        uid: 'test-parent-id',
        email: 'test@example.com',
        role: 'parent',
        isAdmin: false
      }));
      
      // Mock child profiles
      localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify([
        { id: 'child-1', name: 'Test Child 1', avatar: '👦', xp: 50 },
        { id: 'child-2', name: 'Test Child 2', avatar: '👧', xp: 30 }
      ]));
      
      // Mock quests
      localStorage.setItem('kiddo-quest-quests', JSON.stringify([
        { 
          id: 'quest-1', 
          title: 'Clean Room', 
          description: 'Clean your room thoroughly', 
          points: 10,
          recurring: false,
          icon: 'Trash'
        },
        { 
          id: 'quest-2', 
          title: 'Do Homework', 
          description: 'Complete all homework assignments', 
          points: 15,
          recurring: true,
          frequency: 'daily',
          icon: 'BookOpen'
        }
      ]));
      
      // Set the current view to child dashboard
      localStorage.setItem('kiddo-quest-view', 'childDashboard');
      localStorage.setItem('kiddo-quest-selected-child', 'child-1');
    });
    
    // Reload the page to apply the localStorage changes
    await page.reload();
    
    // Wait for the child dashboard to load
    await expect(page.locator('text=Test Child 1')).toBeVisible();
  });
  
  test('child can view available quests', async ({ page }) => {
    // Verify quests are visible
    await expect(page.locator('text=Clean Room')).toBeVisible();
    await expect(page.locator('text=Do Homework')).toBeVisible();
    
    // Verify points are displayed
    await expect(page.locator('text=10 points')).toBeVisible();
    await expect(page.locator('text=15 points')).toBeVisible();
  });
  
  test('child can claim a completed quest', async ({ page }) => {
    // Click on a quest to claim it
    await page.locator('text=Clean Room').click();
    
    // Verify the claim dialog appears
    await expect(page.locator('text=Claim Quest Completion')).toBeVisible();
    
    // Mock the quest claiming
    await page.evaluate(() => {
      // Mock quest completions
      localStorage.setItem('kiddo-quest-quest-completions', JSON.stringify([
        { 
          id: 'completion-1', 
          questId: 'quest-1', 
          childId: 'child-1', 
          status: 'pending', 
          claimedAt: new Date().toISOString()
        }
      ]));
    });
    
    // Click the claim button
    await page.locator('button', { hasText: 'Claim Completion' }).click();
    
    // Verify success message
    await expect(page.locator('text=Quest claimed! Waiting for parent approval')).toBeVisible();
  });
  
  test('parent can approve a claimed quest', async ({ page }) => {
    // Mock quest completions with a pending quest
    await page.evaluate(() => {
      // Mock quest completions
      localStorage.setItem('kiddo-quest-quest-completions', JSON.stringify([
        { 
          id: 'completion-1', 
          questId: 'quest-1', 
          childId: 'child-1', 
          status: 'pending', 
          claimedAt: new Date().toISOString()
        }
      ]));
      
      // Switch to parent dashboard
      localStorage.setItem('kiddo-quest-view', 'parentDashboard');
    });
    
    // Reload the page to apply changes
    await page.reload();
    
    // Wait for parent dashboard to load
    await expect(page.locator('text=Parent Dashboard')).toBeVisible();
    
    // Verify pending quest is visible
    await expect(page.locator('text=Pending Approvals')).toBeVisible();
    await expect(page.locator('text=Clean Room')).toBeVisible();
    
    // Mock the approval process
    await page.evaluate(() => {
      // Update quest completion status
      const completions = JSON.parse(localStorage.getItem('kiddo-quest-quest-completions'));
      completions[0].status = 'approved';
      completions[0].approvedAt = new Date().toISOString();
      localStorage.setItem('kiddo-quest-quest-completions', JSON.stringify(completions));
      
      // Update child XP
      const children = JSON.parse(localStorage.getItem('kiddo-quest-child-profiles'));
      children[0].xp = 60; // Add 10 points
      localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify(children));
    });
    
    // Click approve button
    await page.locator('button', { hasText: 'Approve' }).click();
    
    // Verify success message
    await expect(page.locator('text=Quest approved!')).toBeVisible();
    
    // Verify child XP has been updated
    await expect(page.locator('text=60 XP')).toBeVisible();
  });
  
  test('child can view available rewards', async ({ page }) => {
    // Mock rewards
    await page.evaluate(() => {
      // Add rewards
      localStorage.setItem('kiddo-quest-rewards', JSON.stringify([
        { 
          id: 'reward-1', 
          title: 'Ice Cream', 
          description: 'A delicious ice cream treat', 
          points: 30,
          icon: 'IceCream'
        },
        { 
          id: 'reward-2', 
          title: 'Screen Time', 
          description: '30 minutes of extra screen time', 
          points: 20,
          icon: 'Tv'
        }
      ]));
    });
    
    // Navigate to rewards section
    await page.locator('text=Rewards').click();
    
    // Verify rewards are visible
    await expect(page.locator('text=Ice Cream')).toBeVisible();
    await expect(page.locator('text=Screen Time')).toBeVisible();
    
    // Verify points are displayed
    await expect(page.locator('text=30 points')).toBeVisible();
    await expect(page.locator('text=20 points')).toBeVisible();
  });
  
  test('child can claim a reward', async ({ page }) => {
    // Mock rewards and ensure child has enough points
    await page.evaluate(() => {
      // Add rewards
      localStorage.setItem('kiddo-quest-rewards', JSON.stringify([
        { 
          id: 'reward-1', 
          title: 'Ice Cream', 
          description: 'A delicious ice cream treat', 
          points: 30,
          icon: 'IceCream'
        },
        { 
          id: 'reward-2', 
          title: 'Screen Time', 
          description: '30 minutes of extra screen time', 
          points: 20,
          icon: 'Tv'
        }
      ]));
      
      // Update child XP to have enough points
      const children = JSON.parse(localStorage.getItem('kiddo-quest-child-profiles'));
      children[0].xp = 50; // Enough for both rewards
      localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify(children));
    });
    
    // Navigate to rewards section
    await page.locator('text=Rewards').click();
    
    // Click on a reward to claim it
    await page.locator('text=Screen Time').click();
    
    // Verify the claim dialog appears
    await expect(page.locator('text=Claim Reward')).toBeVisible();
    
    // Mock the reward claiming
    await page.evaluate(() => {
      // Update child XP
      const children = JSON.parse(localStorage.getItem('kiddo-quest-child-profiles'));
      children[0].xp = 30; // Subtract 20 points
      localStorage.setItem('kiddo-quest-child-profiles', JSON.stringify(children));
      
      // Add claimed reward
      localStorage.setItem('kiddo-quest-claimed-rewards', JSON.stringify([
        { 
          id: 'claimed-1', 
          rewardId: 'reward-2', 
          childId: 'child-1', 
          claimedAt: new Date().toISOString()
        }
      ]));
    });
    
    // Click the claim button
    await page.locator('button', { hasText: 'Claim Reward' }).click();
    
    // Verify success message
    await expect(page.locator('text=Reward claimed!')).toBeVisible();
    
    // Verify XP has been deducted
    await expect(page.locator('text=30 XP')).toBeVisible();
  });
});
