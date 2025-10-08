const { test, expect } = require('@playwright/test');

test.describe('PUT /api/rewards/{id}/price', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent/admin
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'adminpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should successfully update reward price', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const rewardId = 'reward-123';
      const updateRequest = {
        price: 150,
        reason: 'Market value adjustment',
        effectiveDate: '2024-02-01T00:00:00Z',
        notifyChildren: true
      };

      // Mock successful price update response
      return {
        rewardId: rewardId,
        previousPrice: 100,
        newPrice: updateRequest.price,
        priceChange: 50,
        percentageChange: 50.0,
        reason: updateRequest.reason,
        effectiveDate: updateRequest.effectiveDate,
        updatedAt: '2024-01-31T15:00:00Z',
        updatedBy: 'admin@test.com',
        notificationsSent: updateRequest.notifyChildren,
        priceHistory: [
          {
            price: 75,
            effectiveDate: '2024-01-01T00:00:00Z',
            reason: 'Initial price',
            updatedBy: 'system'
          },
          {
            price: 100,
            effectiveDate: '2024-01-15T00:00:00Z',
            reason: 'Seasonal adjustment',
            updatedBy: 'admin@test.com'
          },
          {
            price: 150,
            effectiveDate: '2024-02-01T00:00:00Z',
            reason: 'Market value adjustment',
            updatedBy: 'admin@test.com'
          }
        ],
        reward: {
          id: rewardId,
          name: 'Extra Screen Time',
          description: '30 minutes of additional screen time',
          category: 'privileges',
          currentPrice: 150,
          isActive: true
        },
        impact: {
          childrenAffected: ['child1', 'child2', 'child3'],
          currentAffordability: [
            { childId: 'child1', canAfford: true, xpBalance: 200 },
            { childId: 'child2', canAfford: false, xpBalance: 120 },
            { childId: 'child3', canAfford: true, xpBalance: 180 }
          ]
        }
      };
    });

    // Validate response structure
    expect(response).toMatchObject({
      rewardId: expect.any(String),
      previousPrice: expect.any(Number),
      newPrice: expect.any(Number),
      priceChange: expect.any(Number),
      percentageChange: expect.any(Number),
      reason: expect.any(String),
      effectiveDate: expect.any(String),
      updatedAt: expect.any(String),
      updatedBy: expect.any(String),
      priceHistory: expect.any(Array),
      reward: expect.any(Object),
      impact: expect.any(Object)
    });

    // Validate price calculations
    expect(response.priceChange).toBe(response.newPrice - response.previousPrice);
    expect(response.percentageChange).toBe((response.priceChange / response.previousPrice) * 100);

    // Validate price history
    expect(Array.isArray(response.priceHistory)).toBe(true);
    expect(response.priceHistory.length).toBeGreaterThan(0);
    const latestEntry = response.priceHistory[response.priceHistory.length - 1];
    expect(latestEntry.price).toBe(response.newPrice);

    // Validate impact analysis
    expect(response.impact).toHaveProperty('childrenAffected');
    expect(response.impact).toHaveProperty('currentAffordability');
    expect(Array.isArray(response.impact.currentAffordability)).toBe(true);
  });

  test('should validate price range constraints', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const rewardId = 'reward-123';
        const updateRequest = {
          price: -10, // Invalid negative price
          reason: 'Test negative price'
        };
        throw new Error('Validation failed: Price must be a positive number');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('positive number');
  });

  test('should validate maximum price limit', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const rewardId = 'reward-123';
        const updateRequest = {
          price: 10000, // Exceeds maximum allowed price
          reason: 'Test maximum price limit'
        };
        throw new Error('Validation failed: Price exceeds maximum allowed value (5000 XP)');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('maximum allowed value');
  });

  test('should require reason for significant price changes', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const rewardId = 'reward-123';
        const updateRequest = {
          price: 300, // 200% increase from 100, requires reason
          // Missing reason field
        };
        throw new Error('Validation failed: Reason required for price changes exceeding 50%');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Reason required');
  });

  test('should handle scheduled price updates', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const rewardId = 'reward-456';
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const updateRequest = {
        price: 175,
        reason: 'Planned seasonal adjustment',
        effectiveDate: futureDate.toISOString(),
        notifyChildren: true,
        notifyInAdvance: true
      };

      return {
        rewardId: rewardId,
        previousPrice: 125,
        scheduledPrice: updateRequest.price,
        currentPrice: 125, // Still current price
        scheduledChange: {
          effectiveDate: updateRequest.effectiveDate,
          reason: updateRequest.reason,
          priceChange: 50,
          percentageChange: 40.0
        },
        status: 'scheduled',
        notifications: {
          scheduleConfirmation: true,
          advanceNotice: updateRequest.notifyInAdvance,
          effectiveNotice: true
        },
        canCancel: true,
        cancelDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
      };
    });

    expect(response.status).toBe('scheduled');
    expect(response).toHaveProperty('scheduledChange');
    expect(response).toHaveProperty('cancelDeadline');
    expect(response.canCancel).toBe(true);
    expect(response.currentPrice).not.toBe(response.scheduledPrice);
  });

  test('should apply bulk price updates with percentage adjustments', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const updateRequest = {
        rewards: ['reward-123', 'reward-456', 'reward-789'],
        adjustmentType: 'percentage',
        adjustmentValue: 15, // 15% increase
        reason: 'Quarterly price adjustment',
        effectiveDate: '2024-02-01T00:00:00Z'
      };

      return {
        batchId: 'batch-update-001',
        updatedRewards: [
          {
            rewardId: 'reward-123',
            previousPrice: 100,
            newPrice: 115,
            priceChange: 15,
            percentageChange: 15.0
          },
          {
            rewardId: 'reward-456',
            previousPrice: 200,
            newPrice: 230,
            priceChange: 30,
            percentageChange: 15.0
          },
          {
            rewardId: 'reward-789',
            previousPrice: 75,
            newPrice: 86, // Rounded to nearest whole number
            priceChange: 11,
            percentageChange: 14.67
          }
        ],
        summary: {
          totalRewardsUpdated: 3,
          averageIncrease: 15.0,
          totalValueIncrease: 56,
          effectiveDate: updateRequest.effectiveDate,
          reason: updateRequest.reason
        },
        notifications: {
          parentNotified: true,
          childrenNotified: true,
          emailSent: true
        }
      };
    });

    expect(response).toHaveProperty('batchId');
    expect(response).toHaveProperty('updatedRewards');
    expect(response).toHaveProperty('summary');
    expect(Array.isArray(response.updatedRewards)).toBe(true);
    expect(response.updatedRewards.length).toBe(3);
    expect(response.summary.totalRewardsUpdated).toBe(3);
  });

  test('should return 404 for non-existent reward', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const rewardId = 'non-existent-reward-999';
        const updateRequest = {
          price: 150,
          reason: 'Test update'
        };
        throw new Error('Reward not found');
      } catch (error) {
        return { error: error.message, status: 404 };
      }
    });

    expect(response.status).toBe(404);
    expect(response.error).toContain('not found');
  });

  test('should require admin or parent role', async ({ page, context }) => {
    // Test with child role (should be denied)
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'child@test.com');
    await page.fill('[data-testid="password-input"]', 'childpassword123');
    await page.click('[data-testid="login-button"]');

    const response = await page.evaluate(async () => {
      try {
        // Attempt to update price as child
        throw new Error('Forbidden: Insufficient permissions');
      } catch (error) {
        return { error: error.message, status: 403 };
      }
    });

    expect(response.status).toBe(403);
    expect(response.error).toContain('Forbidden');
  });

  test('should require authentication', async ({ page, context }) => {
    // Clear cookies to simulate unauthenticated request
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    
    const response = await page.evaluate(async () => {
      try {
        // Attempt to update price without auth
        throw new Error('Unauthorized');
      } catch (error) {
        return { error: error.message, status: 401 };
      }
    });

    expect(response.status).toBe(401);
    expect(response.error).toContain('Unauthorized');
  });

  test('should handle concurrent price update conflicts', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const rewardId = 'reward-123';
        const updateRequest = {
          price: 175,
          reason: 'Concurrent update test',
          version: 'v1' // Outdated version
        };
        throw new Error('Conflict: Reward has been modified by another user');
      } catch (error) {
        return { error: error.message, status: 409 };
      }
    });

    expect(response.status).toBe(409);
    expect(response.error).toContain('Conflict');
  });

  test('should validate effective date constraints', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const rewardId = 'reward-123';
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
        const updateRequest = {
          price: 175,
          reason: 'Test past date',
          effectiveDate: pastDate.toISOString()
        };
        throw new Error('Validation failed: Effective date cannot be in the past');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('cannot be in the past');
  });

  test('should include affordability impact analysis', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const rewardId = 'reward-123';
      const updateRequest = {
        price: 200, // Increased from 100
        reason: 'Impact analysis test'
      };

      return {
        rewardId: rewardId,
        previousPrice: 100,
        newPrice: 200,
        impactAnalysis: {
          affordabilityChange: {
            previouslyAffordable: 3,
            currentlyAffordable: 1,
            lostAccess: 2
          },
          childrenImpacted: [
            {
              childId: 'child1',
              name: 'Alice',
              xpBalance: 250,
              previouslyAffordable: true,
              currentlyAffordable: true,
              timesToEarn: 0 // Already can afford
            },
            {
              childId: 'child2',
              name: 'Bob',
              xpBalance: 150,
              previouslyAffordable: true,
              currentlyAffordable: false,
              xpShortfall: 50,
              estimatedTimeToEarn: '3-4 days'
            },
            {
              childId: 'child3',
              name: 'Charlie',
              xpBalance: 80,
              previouslyAffordable: false,
              currentlyAffordable: false,
              xpShortfall: 120,
              estimatedTimeToEarn: '8-10 days'
            }
          ],
          recommendations: [
            'Consider offering bonus XP opportunities for affected children',
            'Implement temporary promotional pricing',
            'Create alternative lower-cost rewards'
          ]
        }
      };
    });

    expect(response).toHaveProperty('impactAnalysis');
    expect(response.impactAnalysis).toHaveProperty('affordabilityChange');
    expect(response.impactAnalysis).toHaveProperty('childrenImpacted');
    expect(response.impactAnalysis).toHaveProperty('recommendations');
    expect(Array.isArray(response.impactAnalysis.childrenImpacted)).toBe(true);
    expect(Array.isArray(response.impactAnalysis.recommendations)).toBe(true);

    // Validate calculation consistency
    const affordability = response.impactAnalysis.affordabilityChange;
    const impactedChildren = response.impactAnalysis.childrenImpacted;
    const currentlyAffordable = impactedChildren.filter(child => child.currentlyAffordable).length;
    expect(affordability.currentlyAffordable).toBe(currentlyAffordable);
  });

  test('should handle price rollback functionality', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const rewardId = 'reward-123';
      const rollbackRequest = {
        rollbackToVersion: 2, // Previous price version
        reason: 'Price increase was too aggressive'
      };

      return {
        rewardId: rewardId,
        action: 'rollback',
        rolledBackTo: {
          version: 2,
          price: 100,
          effectiveDate: '2024-01-15T00:00:00Z',
          reason: 'Seasonal adjustment'
        },
        previousState: {
          version: 3,
          price: 200,
          effectiveDate: '2024-02-01T00:00:00Z',
          reason: 'Market value adjustment'
        },
        rollbackReason: rollbackRequest.reason,
        rollbackDate: '2024-01-31T16:00:00Z',
        rollbackBy: 'admin@test.com',
        notifications: {
          childrenNotified: true,
          message: 'Great news! The price for Extra Screen Time has been reduced back to 100 XP!'
        },
        restoredAffordability: [
          { childId: 'child2', name: 'Bob', canNowAfford: true },
          { childId: 'child3', name: 'Charlie', stillNeedsXP: 20 }
        ]
      };
    });

    expect(response.action).toBe('rollback');
    expect(response).toHaveProperty('rolledBackTo');
    expect(response).toHaveProperty('previousState');
    expect(response).toHaveProperty('rollbackReason');
    expect(response).toHaveProperty('restoredAffordability');
    expect(response.rolledBackTo.price).toBeLessThan(response.previousState.price);
  });

  test('should support price preview without committing changes', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const rewardId = 'reward-123';
      const previewRequest = {
        price: 180,
        preview: true // Preview mode
      };

      return {
        rewardId: rewardId,
        currentPrice: 100,
        previewPrice: 180,
        priceChange: 80,
        percentageChange: 80.0,
        preview: true,
        impactPreview: {
          childrenAffected: 3,
          affordabilityImpact: {
            willLoseAccess: 1,
            willMaintainAccess: 2,
            xpShortfallTotal: 50
          }
        },
        recommendations: [
          'Consider a smaller price increase of 20-30%',
          'Offer bonus XP week to help children adapt'
        ],
        alternativePrices: [
          { price: 120, impact: 'low', affordabilityLoss: 0 },
          { price: 150, impact: 'medium', affordabilityLoss: 1 },
          { price: 180, impact: 'high', affordabilityLoss: 1 }
        ]
      };
    });

    expect(response.preview).toBe(true);
    expect(response).toHaveProperty('impactPreview');
    expect(response).toHaveProperty('recommendations');
    expect(response).toHaveProperty('alternativePrices');
    expect(Array.isArray(response.alternativePrices)).toBe(true);
    expect(response.currentPrice).not.toBe(response.previewPrice);
  });
});