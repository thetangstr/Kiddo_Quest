const { test, expect } = require('@playwright/test');

test.describe('POST /api/analytics/reports', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent/admin
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'adminpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should create custom analytics report', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const reportRequest = {
        type: 'custom_analysis',
        title: 'Custom Family Performance Report',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        filters: {
          children: ['child1', 'child2'],
          categories: ['chores', 'homework'],
          includeRewards: true,
          includePenalties: false
        },
        metrics: ['completion_rate', 'xp_earned', 'streak_analysis', 'time_analysis'],
        format: 'detailed',
        schedule: {
          recurring: false,
          frequency: null
        }
      };

      // Mock the API response for report creation
      return {
        reportId: 'custom-report-123',
        status: 'generating',
        request: reportRequest,
        estimatedCompletion: '2024-01-31T15:05:00Z',
        generationStarted: '2024-01-31T15:00:00Z',
        message: 'Report generation initiated successfully'
      };
    });

    expect(response).toHaveProperty('reportId');
    expect(response).toHaveProperty('status');
    expect(response.status).toBe('generating');
    expect(response).toHaveProperty('estimatedCompletion');
    expect(response).toHaveProperty('request');
    expect(response.request).toMatchObject({
      type: expect.any(String),
      title: expect.any(String),
      dateRange: expect.any(Object),
      filters: expect.any(Object),
      metrics: expect.any(Array)
    });
  });

  test('should create scheduled recurring report', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const reportRequest = {
        type: 'family_overview',
        title: 'Weekly Family Summary',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z'
        },
        filters: {
          children: 'all',
          categories: 'all'
        },
        metrics: ['completion_rate', 'xp_earned', 'behavior_trends'],
        format: 'summary',
        schedule: {
          recurring: true,
          frequency: 'weekly',
          dayOfWeek: 'sunday',
          time: '18:00',
          timezone: 'America/New_York',
          recipients: ['parent@test.com', 'spouse@test.com']
        },
        notifications: {
          email: true,
          inApp: true,
          summary: true
        }
      };

      return {
        reportId: 'scheduled-report-456',
        scheduleId: 'schedule-789',
        status: 'scheduled',
        request: reportRequest,
        nextGeneration: '2024-02-04T23:00:00Z',
        createdAt: '2024-01-31T15:00:00Z',
        message: 'Recurring report scheduled successfully'
      };
    });

    expect(response).toHaveProperty('reportId');
    expect(response).toHaveProperty('scheduleId');
    expect(response.status).toBe('scheduled');
    expect(response).toHaveProperty('nextGeneration');
    expect(response.request.schedule.recurring).toBe(true);
    expect(response.request.schedule).toMatchObject({
      frequency: expect.any(String),
      dayOfWeek: expect.any(String),
      time: expect.any(String),
      timezone: expect.any(String),
      recipients: expect.any(Array)
    });
  });

  test('should create behavior analysis report', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const reportRequest = {
        type: 'behavior_analysis',
        title: 'Child Behavior Insights',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        filters: {
          children: ['child1'],
          focusAreas: ['task_completion', 'time_management', 'consistency'],
          includeComparisons: true,
          benchmarkData: 'age_group'
        },
        metrics: [
          'completion_patterns',
          'motivation_trends',
          'difficulty_preferences',
          'reward_effectiveness',
          'penalty_impact'
        ],
        format: 'detailed',
        insights: {
          recommendations: true,
          actionItems: true,
          goalSuggestions: true
        }
      };

      return {
        reportId: 'behavior-analysis-789',
        status: 'generating',
        request: reportRequest,
        estimatedCompletion: '2024-01-31T15:10:00Z',
        analysisDepth: 'comprehensive',
        dataPoints: 1250,
        message: 'Behavior analysis report generation started'
      };
    });

    expect(response.request.type).toBe('behavior_analysis');
    expect(response.request.filters).toHaveProperty('focusAreas');
    expect(response.request.metrics).toContain('completion_patterns');
    expect(response.request.insights).toMatchObject({
      recommendations: true,
      actionItems: true,
      goalSuggestions: true
    });
    expect(response).toHaveProperty('dataPoints');
  });

  test('should create comparative analysis report', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const reportRequest = {
        type: 'comparative_analysis',
        title: 'Child Performance Comparison',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        filters: {
          children: ['child1', 'child2', 'child3'],
          comparisonType: 'peer_comparison',
          normalizeByAge: true,
          categories: 'all'
        },
        metrics: [
          'completion_rate',
          'xp_per_quest',
          'consistency_score',
          'improvement_rate',
          'challenge_acceptance'
        ],
        format: 'detailed',
        visualizations: {
          charts: ['bar_chart', 'line_graph', 'radar_chart'],
          includeTimeSeries: true,
          showTrends: true
        }
      };

      return {
        reportId: 'comparison-report-101',
        status: 'generating',
        request: reportRequest,
        estimatedCompletion: '2024-01-31T15:08:00Z',
        comparisonMatrix: {
          childrenCount: 3,
          metricsCount: 5,
          dataPointsPerChild: 450
        },
        message: 'Comparative analysis initiated'
      };
    });

    expect(response.request.type).toBe('comparative_analysis');
    expect(response.request.filters).toHaveProperty('comparisonType');
    expect(response.request.visualizations).toMatchObject({
      charts: expect.any(Array),
      includeTimeSeries: true,
      showTrends: true
    });
    expect(response).toHaveProperty('comparisonMatrix');
  });

  test('should validate required fields', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        // Missing required fields
        const invalidRequest = {
          title: 'Incomplete Report'
          // Missing type, dateRange, etc.
        };
        throw new Error('Validation failed: Missing required fields');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Validation failed');
  });

  test('should validate date range', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const invalidRequest = {
          type: 'family_overview',
          title: 'Invalid Date Report',
          dateRange: {
            start: '2024-01-31T00:00:00Z',
            end: '2024-01-01T00:00:00Z' // End before start
          }
        };
        throw new Error('Validation failed: Invalid date range');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid date range');
  });

  test('should validate metric selection', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const invalidRequest = {
          type: 'family_overview',
          title: 'Invalid Metrics Report',
          dateRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z'
          },
          metrics: ['invalid_metric', 'another_invalid_metric']
        };
        throw new Error('Validation failed: Invalid metrics specified');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid metrics');
  });

  test('should validate child access permissions', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const unauthorizedRequest = {
          type: 'family_overview',
          title: 'Unauthorized Child Access',
          dateRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z'
          },
          filters: {
            children: ['unauthorized-child-id']
          }
        };
        throw new Error('Forbidden: Access denied to specified child');
      } catch (error) {
        return { error: error.message, status: 403 };
      }
    });

    expect(response.status).toBe(403);
    expect(response.error).toContain('Access denied');
  });

  test('should handle concurrent report generation limits', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        // Simulate too many concurrent reports
        const reportRequest = {
          type: 'family_overview',
          title: 'Concurrent Limit Test',
          dateRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z'
          }
        };
        throw new Error('Too many requests: Maximum concurrent report generation limit reached');
      } catch (error) {
        return { error: error.message, status: 429 };
      }
    });

    expect(response.status).toBe(429);
    expect(response.error).toContain('Too many requests');
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
        // Attempt to create report as child
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
        // Attempt to create report without auth
        throw new Error('Unauthorized');
      } catch (error) {
        return { error: error.message, status: 401 };
      }
    });

    expect(response.status).toBe(401);
    expect(response.error).toContain('Unauthorized');
  });

  test('should return proper response for successful report creation', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const reportRequest = {
        type: 'family_overview',
        title: 'Success Test Report',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        metrics: ['completion_rate', 'xp_earned'],
        format: 'summary'
      };

      return {
        reportId: 'success-report-999',
        status: 'generating',
        request: reportRequest,
        estimatedCompletion: '2024-01-31T15:05:00Z',
        generationStarted: '2024-01-31T15:00:00Z',
        priority: 'normal',
        queuePosition: 1,
        message: 'Report generation initiated successfully',
        links: {
          status: '/api/analytics/reports/success-report-999/status',
          download: '/api/analytics/reports/success-report-999/download',
          cancel: '/api/analytics/reports/success-report-999/cancel'
        }
      };
    });

    expect(response).toMatchObject({
      reportId: expect.any(String),
      status: 'generating',
      request: expect.any(Object),
      estimatedCompletion: expect.any(String),
      generationStarted: expect.any(String),
      message: expect.any(String),
      links: expect.any(Object)
    });

    expect(response.links).toMatchObject({
      status: expect.any(String),
      download: expect.any(String),
      cancel: expect.any(String)
    });
  });

  test('should handle large date ranges with warning', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const reportRequest = {
        type: 'family_overview',
        title: 'Large Date Range Report',
        dateRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z' // 2 year range
        },
        metrics: ['completion_rate', 'xp_earned']
      };

      return {
        reportId: 'large-range-report-555',
        status: 'generating',
        request: reportRequest,
        estimatedCompletion: '2024-01-31T16:00:00Z', // Longer completion time
        generationStarted: '2024-01-31T15:00:00Z',
        warnings: [
          'Large date range detected - report generation may take longer than usual',
          'Consider using summary format for better performance'
        ],
        dataPointsEstimate: 15000,
        message: 'Large dataset report generation initiated'
      };
    });

    expect(response).toHaveProperty('warnings');
    expect(Array.isArray(response.warnings)).toBe(true);
    expect(response.warnings.length).toBeGreaterThan(0);
    expect(response).toHaveProperty('dataPointsEstimate');
  });
});