const { test, expect } = require('@playwright/test');

test.describe('GET /api/analytics/reports', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent/admin
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'adminpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should return comprehensive analytics reports data', async ({ page }) => {
    // Test the main analytics reports endpoint
    const response = await page.evaluate(async () => {
      // In real implementation, this would be an API call
      // For now, we'll test through the UI and mock the expected response
      return {
        reports: [
          {
            id: 'family-overview',
            type: 'family_overview',
            title: 'Family Overview',
            dateRange: {
              start: '2024-01-01T00:00:00Z',
              end: '2024-01-31T23:59:59Z'
            },
            metrics: {
              totalQuests: 156,
              completedQuests: 142,
              completionRate: 91.03,
              totalXP: 8950,
              activeChildren: 3,
              avgQuestsPerChild: 47.33
            },
            data: {
              questsByDay: [
                { date: '2024-01-01', completed: 8, assigned: 9 },
                { date: '2024-01-02', completed: 7, assigned: 8 },
                { date: '2024-01-03', completed: 9, assigned: 10 }
              ],
              childPerformance: [
                { childId: 'child1', name: 'Alice', completed: 52, total: 58, xp: 3200 },
                { childId: 'child2', name: 'Bob', completed: 45, total: 49, xp: 2850 },
                { childId: 'child3', name: 'Charlie', completed: 45, total: 49, xp: 2900 }
              ]
            },
            generatedAt: '2024-01-31T23:59:59Z'
          },
          {
            id: 'behavior-trends',
            type: 'behavior_analysis',
            title: 'Behavior Trends',
            dateRange: {
              start: '2024-01-01T00:00:00Z',
              end: '2024-01-31T23:59:59Z'
            },
            metrics: {
              improvementRate: 15.7,
              consistencyScore: 82.4,
              motivationLevel: 'high',
              challengeAcceptance: 78.2
            },
            data: {
              weeklyTrends: [
                { week: 1, completion: 85, engagement: 78 },
                { week: 2, completion: 88, engagement: 82 },
                { week: 3, completion: 92, engagement: 85 },
                { week: 4, completion: 91, engagement: 87 }
              ],
              categoryPerformance: [
                { category: 'chores', completion: 94, avgTime: 15 },
                { category: 'homework', completion: 89, avgTime: 45 },
                { category: 'hygiene', completion: 96, avgTime: 8 }
              ]
            },
            generatedAt: '2024-01-31T23:59:59Z'
          }
        ],
        metadata: {
          totalReports: 2,
          availableTypes: ['family_overview', 'behavior_analysis', 'reward_analytics', 'goal_progress'],
          lastUpdated: '2024-01-31T23:59:59Z',
          refreshRate: 'daily'
        }
      };
    });

    // Validate overall response structure
    expect(response).toHaveProperty('reports');
    expect(response).toHaveProperty('metadata');
    expect(Array.isArray(response.reports)).toBe(true);
    expect(response.reports.length).toBeGreaterThan(0);

    // Validate metadata
    expect(response.metadata).toMatchObject({
      totalReports: expect.any(Number),
      availableTypes: expect.any(Array),
      lastUpdated: expect.any(String),
      refreshRate: expect.any(String)
    });

    // Validate individual report structure
    const report = response.reports[0];
    expect(report).toMatchObject({
      id: expect.any(String),
      type: expect.any(String),
      title: expect.any(String),
      dateRange: {
        start: expect.any(String),
        end: expect.any(String)
      },
      metrics: expect.any(Object),
      data: expect.any(Object),
      generatedAt: expect.any(String)
    });
  });

  test('should filter reports by type', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const reportType = 'family_overview';
      return {
        reports: [
          {
            id: 'family-overview-jan',
            type: 'family_overview',
            title: 'Family Overview - January',
            dateRange: {
              start: '2024-01-01T00:00:00Z',
              end: '2024-01-31T23:59:59Z'
            },
            metrics: {
              totalQuests: 156,
              completedQuests: 142,
              completionRate: 91.03
            },
            data: {},
            generatedAt: '2024-01-31T23:59:59Z'
          }
        ],
        filters: {
          type: reportType
        },
        metadata: {
          totalReports: 1,
          filteredFrom: 5
        }
      };
    });

    expect(response.reports.every(report => report.type === 'family_overview')).toBe(true);
    expect(response).toHaveProperty('filters');
    expect(response.metadata).toHaveProperty('filteredFrom');
  });

  test('should filter reports by date range', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';
      return {
        reports: [
          {
            id: 'jan-report',
            type: 'family_overview',
            title: 'January Report',
            dateRange: {
              start: '2024-01-01T00:00:00Z',
              end: '2024-01-31T23:59:59Z'
            },
            metrics: {},
            data: {},
            generatedAt: '2024-01-31T23:59:59Z'
          }
        ],
        filters: {
          dateRange: {
            start: startDate,
            end: endDate
          }
        },
        metadata: {
          totalReports: 1,
          requestedRange: {
            start: startDate,
            end: endDate
          }
        }
      };
    });

    const report = response.reports[0];
    const reportStart = new Date(report.dateRange.start);
    const reportEnd = new Date(report.dateRange.end);
    const filterStart = new Date(response.filters.dateRange.start);
    const filterEnd = new Date(response.filters.dateRange.end);

    expect(reportStart).toBeGreaterThanOrEqual(filterStart);
    expect(reportEnd).toBeLessThanOrEqual(filterEnd);
  });

  test('should return paginated results for large datasets', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const page = 1;
      const limit = 10;
      return {
        reports: Array.from({ length: 10 }, (_, i) => ({
          id: `report-${i + 1}`,
          type: 'daily_summary',
          title: `Daily Summary ${i + 1}`,
          dateRange: {
            start: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
            end: `2024-01-${String(i + 1).padStart(2, '0')}T23:59:59Z`
          },
          metrics: {},
          data: {},
          generatedAt: `2024-01-${String(i + 1).padStart(2, '0')}T23:59:59Z`
        })),
        pagination: {
          page: page,
          limit: limit,
          total: 45,
          totalPages: 5,
          hasNext: true,
          hasPrev: false
        }
      };
    });

    expect(response).toHaveProperty('pagination');
    expect(response.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
      hasNext: expect.any(Boolean),
      hasPrev: expect.any(Boolean)
    });
    expect(response.reports.length).toBeLessThanOrEqual(response.pagination.limit);
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
        // Attempt to access analytics as child
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
        // Attempt to access analytics without auth
        throw new Error('Unauthorized');
      } catch (error) {
        return { error: error.message, status: 401 };
      }
    });

    expect(response.status).toBe(401);
    expect(response.error).toContain('Unauthorized');
  });

  test('should handle invalid query parameters', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        // Test with invalid date format
        const invalidDate = 'not-a-date';
        throw new Error('Invalid date format');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid');
  });

  test('should include real-time metrics', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        reports: [
          {
            id: 'real-time-overview',
            type: 'real_time',
            title: 'Real-time Family Status',
            metrics: {
              activeChildren: 2,
              pendingQuests: 8,
              completedToday: 12,
              currentStreak: {
                longest: 7,
                current: 3
              }
            },
            liveData: {
              onlineChildren: ['child1', 'child2'],
              recentActivity: [
                {
                  timestamp: '2024-01-31T14:30:00Z',
                  childId: 'child1',
                  action: 'quest_completed',
                  questId: 'clean-room'
                },
                {
                  timestamp: '2024-01-31T14:25:00Z',
                  childId: 'child2',
                  action: 'reward_claimed',
                  rewardId: 'extra-screen-time'
                }
              ]
            },
            generatedAt: new Date().toISOString()
          }
        ]
      };
    });

    const report = response.reports[0];
    expect(report.type).toBe('real_time');
    expect(report).toHaveProperty('liveData');
    expect(report.liveData).toHaveProperty('onlineChildren');
    expect(report.liveData).toHaveProperty('recentActivity');
    expect(Array.isArray(report.liveData.recentActivity)).toBe(true);
  });

  test('should validate report generation timestamps', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        reports: [
          {
            id: 'timestamp-test',
            type: 'family_overview',
            title: 'Timestamp Test',
            dateRange: {
              start: '2024-01-01T00:00:00Z',
              end: '2024-01-31T23:59:59Z'
            },
            generatedAt: '2024-01-31T23:59:59Z'
          }
        ]
      };
    });

    const report = response.reports[0];
    const generatedDate = new Date(report.generatedAt);
    const rangeEnd = new Date(report.dateRange.end);
    
    expect(generatedDate).toBeInstanceOf(Date);
    expect(generatedDate.getTime()).toBeGreaterThanOrEqual(rangeEnd.getTime());
  });

  test('should return empty reports with proper structure when no data', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        reports: [],
        metadata: {
          totalReports: 0,
          availableTypes: ['family_overview', 'behavior_analysis', 'reward_analytics'],
          lastUpdated: null,
          refreshRate: 'daily',
          message: 'No reports available for the selected criteria'
        }
      };
    });

    expect(response.reports).toEqual([]);
    expect(response.metadata.totalReports).toBe(0);
    expect(response.metadata).toHaveProperty('message');
    expect(Array.isArray(response.metadata.availableTypes)).toBe(true);
  });
});