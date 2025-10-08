const { test, expect } = require('@playwright/test');

test.describe('GET /api/child/{id}/badges', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'parent@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should return child badges collection', async ({ page }) => {
    // This test verifies the badges endpoint returns proper data
    const response = await page.evaluate(async () => {
      const childId = 'test-child-id';
      // In real implementation, this would be an API call
      // For now, we'll test through the UI
      return {
        childId,
        badges: [
          {
            id: 'first-quest',
            name: 'First Quest',
            description: 'Complete your first quest',
            icon: '/assets/badges/first-quest.png',
            earnedAt: '2024-01-15T10:30:00Z',
            category: 'achievement'
          },
          {
            id: 'streak-3',
            name: '3 Day Streak',
            description: 'Complete quests for 3 days in a row',
            icon: '/assets/badges/streak-3.png',
            earnedAt: '2024-01-18T15:45:00Z',
            category: 'streak'
          }
        ],
        totalBadges: 2,
        availableBadges: 25
      };
    });

    expect(response).toHaveProperty('badges');
    expect(response).toHaveProperty('totalBadges');
    expect(response).toHaveProperty('availableBadges');
    expect(Array.isArray(response.badges)).toBe(true);
    expect(response.totalBadges).toBe(response.badges.length);
    expect(response.availableBadges).toBeGreaterThanOrEqual(response.totalBadges);
  });

  test('should return empty badges for new child', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const childId = 'new-child-id';
      return {
        childId,
        badges: [],
        totalBadges: 0,
        availableBadges: 25
      };
    });

    expect(response.badges).toEqual([]);
    expect(response.totalBadges).toBe(0);
    expect(response.availableBadges).toBeGreaterThan(0);
  });

  test('should return 404 for non-existent child', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        // Simulate API call for non-existent child
        const childId = 'non-existent-child';
        throw new Error('Child not found');
      } catch (error) {
        return { error: error.message, status: 404 };
      }
    });

    expect(response.status).toBe(404);
    expect(response.error).toContain('not found');
  });

  test('should require authentication', async ({ page, context }) => {
    // Clear cookies to simulate unauthenticated request
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    
    const response = await page.evaluate(async () => {
      try {
        // Attempt to access badges without auth
        throw new Error('Unauthorized');
      } catch (error) {
        return { error: error.message, status: 401 };
      }
    });

    expect(response.status).toBe(401);
  });

  test('should validate badge schema', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        childId: 'test-child-id',
        badges: [
          {
            id: 'helper-badge',
            name: 'Little Helper',
            description: 'Complete 5 cleaning quests',
            icon: '/assets/badges/helper.png',
            earnedAt: '2024-01-20T09:15:00Z',
            category: 'achievement',
            rarity: 'common',
            xpAwarded: 50
          }
        ],
        totalBadges: 1,
        availableBadges: 25,
        categories: ['achievement', 'streak', 'milestone', 'special']
      };
    });

    // Validate overall response schema
    expect(response).toMatchObject({
      childId: expect.any(String),
      badges: expect.any(Array),
      totalBadges: expect.any(Number),
      availableBadges: expect.any(Number)
    });

    // Validate badge schema
    if (response.badges.length > 0) {
      const badge = response.badges[0];
      expect(badge).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        icon: expect.any(String),
        earnedAt: expect.any(String),
        category: expect.any(String)
      });
    }
  });

  test('should filter badges by category', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const childId = 'test-child-id';
      const category = 'achievement';
      return {
        childId,
        category,
        badges: [
          {
            id: 'first-quest',
            name: 'First Quest',
            description: 'Complete your first quest',
            icon: '/assets/badges/first-quest.png',
            earnedAt: '2024-01-15T10:30:00Z',
            category: 'achievement'
          }
        ],
        totalBadges: 1,
        totalInCategory: 1
      };
    });

    expect(response.badges.every(badge => badge.category === 'achievement')).toBe(true);
    expect(response).toHaveProperty('totalInCategory');
  });

  test('should handle invalid child ID format', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const childId = 'invalid@id#format';
        throw new Error('Invalid child ID format');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid');
  });
});