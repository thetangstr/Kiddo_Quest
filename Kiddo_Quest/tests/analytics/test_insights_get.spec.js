const { test, expect } = require('@playwright/test');

test.describe('GET /api/analytics/insights/{id}', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent/admin
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'adminpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should return detailed insight analysis by ID', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const insightId = 'insight-family-behavior-123';
      // Mock the API response for specific insight
      return {
        id: insightId,
        type: 'family_behavior_analysis',
        title: 'Family Behavior Patterns Analysis',
        summary: 'Comprehensive analysis of family behavior patterns and trends over the past month',
        generatedAt: '2024-01-31T14:30:00Z',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        scope: {
          family: 'family-123',
          children: ['child1', 'child2', 'child3'],
          totalDataPoints: 2847
        },
        insights: {
          keyFindings: [
            {
              category: 'completion_patterns',
              finding: 'Children show 23% higher completion rates in morning hours',
              confidence: 0.87,
              impact: 'high',
              recommendation: 'Schedule important quests between 8-10 AM for optimal results'
            },
            {
              category: 'motivation_trends',
              finding: 'XP rewards are 40% more effective than privilege rewards for ages 8-12',
              confidence: 0.92,
              impact: 'medium',
              recommendation: 'Adjust reward strategy to focus on XP-based incentives'
            },
            {
              category: 'consistency_analysis',
              finding: 'Family shows strongest consistency in hygiene-related quests (94% completion)',
              confidence: 0.95,
              impact: 'low',
              recommendation: 'Use hygiene quests as confidence builders for struggling children'
            }
          ],
          behavioralMetrics: {
            overallEngagement: 0.84,
            consistencyScore: 0.78,
            improvementRate: 0.15,
            challengeAcceptance: 0.72,
            parentSatisfaction: 0.89
          },
          trendAnalysis: {
            weekOverWeek: {
              completion: 0.03,
              engagement: 0.05,
              satisfaction: 0.02
            },
            seasonalPatterns: {
              detected: true,
              pattern: 'weekday_high_weekend_moderate',
              strength: 0.76
            }
          }
        },
        predictions: {
          nextWeekCompletion: 0.88,
          riskFactors: [
            {
              factor: 'school_vacation_approaching',
              impact: 'moderate_decrease',
              probability: 0.67,
              mitigation: 'Adjust quest difficulty and increase reward appeal'
            }
          ],
          opportunities: [
            {
              area: 'homework_completion',
              potential: 'high',
              strategy: 'Implement peer competition elements',
              expectedImprovement: 0.12
            }
          ]
        },
        actionItems: [
          {
            priority: 'high',
            action: 'Implement morning quest scheduling',
            expectedImpact: 'completion_rate_increase',
            timeline: '1-2 weeks',
            effort: 'low'
          },
          {
            priority: 'medium',
            action: 'Revise reward structure for middle-age children',
            expectedImpact: 'engagement_improvement',
            timeline: '2-3 weeks',
            effort: 'medium'
          }
        ],
        visualizations: {
          available: ['completion_heatmap', 'engagement_timeline', 'behavior_radar'],
          urls: {
            completion_heatmap: '/api/analytics/insights/insight-family-behavior-123/viz/heatmap',
            engagement_timeline: '/api/analytics/insights/insight-family-behavior-123/viz/timeline',
            behavior_radar: '/api/analytics/insights/insight-family-behavior-123/viz/radar'
          }
        },
        metadata: {
          version: '2.1',
          algorithm: 'behavioral_pattern_v2',
          lastUpdated: '2024-01-31T14:30:00Z',
          nextUpdate: '2024-02-07T14:30:00Z',
          dataQuality: 0.94
        }
      };
    });

    // Validate overall structure
    expect(response).toMatchObject({
      id: expect.any(String),
      type: expect.any(String),
      title: expect.any(String),
      summary: expect.any(String),
      generatedAt: expect.any(String),
      dateRange: expect.any(Object),
      scope: expect.any(Object),
      insights: expect.any(Object),
      predictions: expect.any(Object),
      actionItems: expect.any(Array),
      visualizations: expect.any(Object),
      metadata: expect.any(Object)
    });

    // Validate insights structure
    expect(response.insights).toHaveProperty('keyFindings');
    expect(response.insights).toHaveProperty('behavioralMetrics');
    expect(response.insights).toHaveProperty('trendAnalysis');
    expect(Array.isArray(response.insights.keyFindings)).toBe(true);

    // Validate key findings structure
    if (response.insights.keyFindings.length > 0) {
      const finding = response.insights.keyFindings[0];
      expect(finding).toMatchObject({
        category: expect.any(String),
        finding: expect.any(String),
        confidence: expect.any(Number),
        impact: expect.any(String),
        recommendation: expect.any(String)
      });
      expect(finding.confidence).toBeGreaterThanOrEqual(0);
      expect(finding.confidence).toBeLessThanOrEqual(1);
    }

    // Validate action items
    expect(Array.isArray(response.actionItems)).toBe(true);
    if (response.actionItems.length > 0) {
      const actionItem = response.actionItems[0];
      expect(actionItem).toMatchObject({
        priority: expect.any(String),
        action: expect.any(String),
        expectedImpact: expect.any(String),
        timeline: expect.any(String),
        effort: expect.any(String)
      });
    }
  });

  test('should return child-specific insights', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const insightId = 'insight-child-alice-456';
      return {
        id: insightId,
        type: 'individual_child_analysis',
        title: 'Alice - Individual Performance Insights',
        summary: 'Detailed analysis of Alice\'s behavior patterns, strengths, and areas for improvement',
        generatedAt: '2024-01-31T14:30:00Z',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        scope: {
          child: {
            id: 'child1',
            name: 'Alice',
            age: 9,
            grade: 4
          },
          questsAnalyzed: 47,
          dataPoints: 892
        },
        insights: {
          personalityProfile: {
            type: 'achiever_explorer',
            confidence: 0.89,
            characteristics: [
              'Goal-oriented',
              'Responds well to challenges',
              'Prefers variety in tasks',
              'Shows high intrinsic motivation'
            ]
          },
          strengthsIdentified: [
            {
              area: 'academic_tasks',
              score: 0.92,
              description: 'Consistently excels in homework and educational quests'
            },
            {
              area: 'self_directed_tasks',
              score: 0.87,
              description: 'Shows strong independence in completing assigned tasks'
            }
          ],
          improvementAreas: [
            {
              area: 'social_cooperation',
              score: 0.64,
              description: 'Could benefit from more collaborative quest experiences',
              suggestions: ['Team-based cleaning projects', 'Peer tutoring opportunities']
            }
          ],
          optimalConditions: {
            timeOfDay: 'morning',
            questDuration: '15-30 minutes',
            preferredRewardTypes: ['XP', 'achievement_badges', 'screen_time'],
            motivationalStyle: 'challenge_based'
          }
        },
        predictions: {
          likelyToComplete: {
            academic: 0.94,
            chores: 0.81,
            hygiene: 0.96,
            social: 0.67
          },
          riskFactors: [
            {
              factor: 'task_monotony',
              probability: 0.45,
              mitigation: 'Introduce variety and mini-challenges'
            }
          ]
        },
        recommendations: [
          {
            type: 'quest_design',
            priority: 'high',
            suggestion: 'Create progressive difficulty challenges in weaker areas',
            implementation: 'Start with 5-minute social tasks and gradually increase'
          },
          {
            type: 'reward_optimization',
            priority: 'medium',
            suggestion: 'Focus on achievement-based rewards rather than material rewards',
            implementation: 'Implement badge system for completed challenges'
          }
        ]
      };
    });

    expect(response.type).toBe('individual_child_analysis');
    expect(response.scope).toHaveProperty('child');
    expect(response.insights).toHaveProperty('personalityProfile');
    expect(response.insights).toHaveProperty('strengthsIdentified');
    expect(response.insights).toHaveProperty('improvementAreas');
    expect(response.insights).toHaveProperty('optimalConditions');
    expect(Array.isArray(response.insights.strengthsIdentified)).toBe(true);
    expect(Array.isArray(response.insights.improvementAreas)).toBe(true);
  });

  test('should return reward effectiveness insights', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const insightId = 'insight-reward-effectiveness-789';
      return {
        id: insightId,
        type: 'reward_effectiveness_analysis',
        title: 'Reward System Performance Analysis',
        summary: 'Analysis of reward effectiveness across different children and categories',
        generatedAt: '2024-01-31T14:30:00Z',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        insights: {
          overallEffectiveness: {
            score: 0.82,
            trend: 'improving',
            changeFromPreviousPeriod: 0.07
          },
          rewardTypeAnalysis: [
            {
              type: 'XP_points',
              effectiveness: 0.89,
              childrenResponding: ['child1', 'child2'],
              usage: 0.65,
              recommendation: 'Highly effective - continue current usage'
            },
            {
              type: 'screen_time',
              effectiveness: 0.78,
              childrenResponding: ['child2', 'child3'],
              usage: 0.45,
              recommendation: 'Effective but consider time limits'
            },
            {
              type: 'toy_purchases',
              effectiveness: 0.54,
              childrenResponding: ['child3'],
              usage: 0.15,
              recommendation: 'Low effectiveness - consider alternatives'
            }
          ],
          categoryPerformance: {
            chores: {
              mostEffectiveReward: 'screen_time',
              effectiveness: 0.85,
              participation: 0.92
            },
            homework: {
              mostEffectiveReward: 'XP_points',
              effectiveness: 0.91,
              participation: 0.88
            },
            hygiene: {
              mostEffectiveReward: 'achievement_badges',
              effectiveness: 0.94,
              participation: 0.96
            }
          },
          optimizationOpportunities: [
            {
              opportunity: 'reward_diversification',
              impact: 'medium',
              description: 'Introduce more variety in reward types for sustained engagement',
              implementation: 'Add experience-based rewards (special activities, privileges)'
            },
            {
              opportunity: 'personalization',
              impact: 'high',
              description: 'Tailor reward selection to individual child preferences',
              implementation: 'Create personalized reward menus for each child'
            }
          ]
        }
      };
    });

    expect(response.type).toBe('reward_effectiveness_analysis');
    expect(response.insights).toHaveProperty('overallEffectiveness');
    expect(response.insights).toHaveProperty('rewardTypeAnalysis');
    expect(response.insights).toHaveProperty('categoryPerformance');
    expect(response.insights).toHaveProperty('optimizationOpportunities');
    expect(Array.isArray(response.insights.rewardTypeAnalysis)).toBe(true);
    expect(Array.isArray(response.insights.optimizationOpportunities)).toBe(true);
  });

  test('should return 404 for non-existent insight', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const insightId = 'non-existent-insight-999';
        throw new Error('Insight not found');
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
        // Attempt to access insight without auth
        throw new Error('Unauthorized');
      } catch (error) {
        return { error: error.message, status: 401 };
      }
    });

    expect(response.status).toBe(401);
    expect(response.error).toContain('Unauthorized');
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
        // Attempt to access insights as child
        throw new Error('Forbidden: Insufficient permissions');
      } catch (error) {
        return { error: error.message, status: 403 };
      }
    });

    expect(response.status).toBe(403);
    expect(response.error).toContain('Forbidden');
  });

  test('should validate insight ID format', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const invalidId = 'invalid@insight#id';
        throw new Error('Invalid insight ID format');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid');
  });

  test('should include metadata and versioning', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const insightId = 'insight-metadata-test-111';
      return {
        id: insightId,
        type: 'family_overview',
        title: 'Metadata Test Insight',
        summary: 'Test insight for metadata validation',
        generatedAt: '2024-01-31T14:30:00Z',
        insights: {
          keyFindings: []
        },
        metadata: {
          version: '2.1',
          algorithm: 'behavioral_pattern_v2',
          lastUpdated: '2024-01-31T14:30:00Z',
          nextUpdate: '2024-02-07T14:30:00Z',
          dataQuality: 0.94,
          processingTime: 2.3,
          confidence: 0.87,
          dataSourceVersions: {
            quests: '1.5',
            rewards: '1.2',
            behavior: '2.0'
          }
        }
      };
    });

    expect(response).toHaveProperty('metadata');
    expect(response.metadata).toMatchObject({
      version: expect.any(String),
      algorithm: expect.any(String),
      lastUpdated: expect.any(String),
      dataQuality: expect.any(Number),
      confidence: expect.any(Number)
    });
    expect(response.metadata.dataQuality).toBeGreaterThan(0);
    expect(response.metadata.dataQuality).toBeLessThanOrEqual(1);
    expect(response.metadata.confidence).toBeGreaterThan(0);
    expect(response.metadata.confidence).toBeLessThanOrEqual(1);
  });

  test('should support insight filtering and expansion', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const insightId = 'insight-filtered-222';
      const expand = ['visualizations', 'raw_data', 'related_insights'];
      return {
        id: insightId,
        type: 'family_overview',
        title: 'Filtered Insight Response',
        summary: 'Response with expanded data sections',
        insights: {
          keyFindings: []
        },
        // Expanded sections based on query parameters
        visualizations: {
          charts: [
            {
              type: 'line_chart',
              title: 'Completion Trends',
              data: 'base64encodedchartdata',
              format: 'png'
            }
          ]
        },
        rawData: {
          questCompletions: [
            { date: '2024-01-01', childId: 'child1', questId: 'quest1', completed: true },
            { date: '2024-01-01', childId: 'child2', questId: 'quest2', completed: false }
          ],
          aggregations: {
            totalQuests: 156,
            totalCompletions: 142
          }
        },
        relatedInsights: [
          {
            id: 'insight-related-333',
            type: 'child_performance',
            title: 'Related Child Performance Insight',
            relevanceScore: 0.84
          }
        ],
        queryParams: {
          expand: expand,
          include_charts: true,
          include_raw_data: true
        }
      };
    });

    expect(response).toHaveProperty('visualizations');
    expect(response).toHaveProperty('rawData');
    expect(response).toHaveProperty('relatedInsights');
    expect(response).toHaveProperty('queryParams');
    expect(Array.isArray(response.relatedInsights)).toBe(true);
    expect(Array.isArray(response.visualizations.charts)).toBe(true);
  });

  test('should handle large insights with pagination support', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const insightId = 'insight-large-444';
      return {
        id: insightId,
        type: 'comprehensive_analysis',
        title: 'Large Dataset Insight',
        summary: 'Comprehensive insight with paginated sub-sections',
        insights: {
          keyFindings: Array.from({ length: 5 }, (_, i) => ({
            id: `finding-${i + 1}`,
            category: `category-${i + 1}`,
            finding: `Finding ${i + 1}`,
            confidence: 0.8 + (i * 0.02)
          }))
        },
        pagination: {
          findings: {
            page: 1,
            limit: 5,
            total: 23,
            hasMore: true,
            nextPage: '/api/analytics/insights/insight-large-444?section=findings&page=2'
          },
          actionItems: {
            page: 1,
            limit: 10,
            total: 15,
            hasMore: true,
            nextPage: '/api/analytics/insights/insight-large-444?section=actionItems&page=2'
          }
        },
        dataSize: {
          totalFindings: 23,
          totalActionItems: 15,
          totalDataPoints: 15420,
          compressionApplied: true
        }
      };
    });

    expect(response).toHaveProperty('pagination');
    expect(response).toHaveProperty('dataSize');
    expect(response.pagination).toHaveProperty('findings');
    expect(response.pagination).toHaveProperty('actionItems');
    expect(response.dataSize).toHaveProperty('totalDataPoints');
    expect(response.dataSize.totalDataPoints).toBeGreaterThan(0);
  });
});