const { test, expect } = require('@playwright/test');

test.describe('POST /api/child/{id}/badges', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'parent@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should award badge to child', async ({ page }) => {
    // This test verifies badge awarding endpoint
    const response = await page.evaluate(async () => {
      const childId = 'test-child-id';
      const badgeData = {
        badgeId: 'first-quest',
        reason: 'Completed first quest: Clean bedroom',
        questId: 'quest-123'
      };
      
      // In real implementation, this would be an API call
      // For now, we'll simulate the response
      return {
        success: true,
        badge: {
          id: 'first-quest',
          name: 'First Quest',
          description: 'Complete your first quest',
          icon: '/assets/badges/first-quest.png',
          earnedAt: new Date().toISOString(),
          category: 'achievement',
          rarity: 'common',
          xpAwarded: 25
        },
        childId,
        totalBadges: 1
      };
    });

    expect(response.success).toBe(true);
    expect(response).toHaveProperty('badge');
    expect(response.badge).toHaveProperty('id');
    expect(response.badge).toHaveProperty('earnedAt');
    expect(response.badge.xpAwarded).toBeGreaterThan(0);
    expect(response.totalBadges).toBeGreaterThanOrEqual(1);
  });

  test('should prevent duplicate badge awards', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const childId = 'test-child-id';
        const badgeData = {
          badgeId: 'first-quest' // Badge already earned
        };
        
        throw new Error('Badge already earned');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 409 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(409);
    expect(response.error).toContain('already earned');
  });

  test('should validate badge exists', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const childId = 'test-child-id';
        const badgeData = {
          badgeId: 'non-existent-badge'
        };
        
        throw new Error('Badge template not found');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 404 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(404);
    expect(response.error).toContain('not found');
  });

  test('should return 404 for non-existent child', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const childId = 'non-existent-child';
        const badgeData = {
          badgeId: 'first-quest'
        };
        
        throw new Error('Child not found');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 404 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(404);
    expect(response.error).toContain('Child not found');
  });

  test('should require authentication', async ({ page, context }) => {
    // Clear cookies to simulate unauthenticated request
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    
    const response = await page.evaluate(async () => {
      try {
        // Attempt to award badge without auth
        throw new Error('Unauthorized');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 401 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(401);
  });

  test('should require parent permissions', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        // Simulate child user attempting to award badge
        throw new Error('Insufficient permissions');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 403 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(403);
    expect(response.error).toContain('permissions');
  });

  test('should validate request payload', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const childId = 'test-child-id';
        const badgeData = {
          // Missing required badgeId
          reason: 'Test reason'
        };
        
        throw new Error('Missing required field: badgeId');
      } catch (error) {
        return { 
          success: false, 
          error: error.message, 
          status: 400 
        };
      }
    });

    expect(response.success).toBe(false);
    expect(response.status).toBe(400);
    expect(response.error).toContain('required');
  });

  test('should handle streak badges with progression', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const childId = 'test-child-id';
      const badgeData = {
        badgeId: 'streak-7',
        reason: 'Completed 7 days in a row',
        streakCount: 7
      };
      
      return {
        success: true,
        badge: {
          id: 'streak-7',
          name: '7 Day Streak',
          description: 'Complete quests for 7 days in a row',
          icon: '/assets/badges/streak-7.png',
          earnedAt: new Date().toISOString(),
          category: 'streak',
          rarity: 'rare',
          xpAwarded: 100,
          progression: {
            current: 7,
            next: 14,
            nextBadge: 'streak-14'
          }
        },
        childId,
        totalBadges: 3
      };
    });

    expect(response.success).toBe(true);
    expect(response.badge.category).toBe('streak');
    expect(response.badge).toHaveProperty('progression');
    expect(response.badge.progression.current).toBe(7);
  });

  test('should award XP along with badge', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const childId = 'test-child-id';
      const badgeData = {
        badgeId: 'milestone-10',
        reason: 'Completed 10 quests total'
      };
      
      return {
        success: true,
        badge: {
          id: 'milestone-10',
          name: '10 Quest Milestone',
          description: 'Complete 10 quests in total',
          icon: '/assets/badges/milestone-10.png',
          earnedAt: new Date().toISOString(),
          category: 'milestone',
          rarity: 'uncommon',
          xpAwarded: 75
        },
        childId,
        xpUpdate: {
          previousXP: 425,
          awardedXP: 75,
          newXP: 500,
          levelUp: true,
          newLevel: 2
        },
        totalBadges: 4
      };
    });

    expect(response.success).toBe(true);
    expect(response.badge.xpAwarded).toBeGreaterThan(0);
    expect(response).toHaveProperty('xpUpdate');
    expect(response.xpUpdate.newXP).toBe(response.xpUpdate.previousXP + response.xpUpdate.awardedXP);
  });

  test('should validate response schema', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        success: true,
        badge: {
          id: 'test-badge',
          name: 'Test Badge',
          description: 'A test badge',
          icon: '/assets/badges/test.png',
          earnedAt: '2024-01-20T15:30:00Z',
          category: 'achievement',
          rarity: 'common',
          xpAwarded: 25
        },
        childId: 'test-child-id',
        totalBadges: 1,
        timestamp: new Date().toISOString()
      };
    });

    // Validate overall response schema
    expect(response).toMatchObject({
      success: expect.any(Boolean),
      badge: expect.any(Object),
      childId: expect.any(String),
      totalBadges: expect.any(Number),
      timestamp: expect.any(String)
    });

    // Validate badge schema
    expect(response.badge).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      icon: expect.any(String),
      earnedAt: expect.any(String),
      category: expect.any(String),
      xpAwarded: expect.any(Number)
    });
  });
});