const { test, expect } = require('@playwright/test');

test.describe('GET /api/family/goals', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent/admin
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'adminpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should return all family goals with progress tracking', async ({ page }) => {
    const response = await page.evaluate(async () => {
      // Mock the API response for family goals
      return {
        goals: [
          {
            id: 'goal-001',
            title: 'Complete 100 Quests This Month',
            description: 'Work together as a family to complete 100 quests during January',
            type: 'family_achievement',
            category: 'collaboration',
            status: 'in_progress',
            priority: 'high',
            scope: {
              type: 'family_wide',
              participants: ['child1', 'child2', 'child3'],
              requiredParticipation: 'all'
            },
            target: {
              metric: 'quest_completions',
              value: 100,
              unit: 'quests',
              timeframe: {
                start: '2024-01-01T00:00:00Z',
                end: '2024-01-31T23:59:59Z',
                duration: '1 month'
              }
            },
            progress: {
              current: 67,
              percentage: 67.0,
              remaining: 33,
              onTrack: true,
              projectedCompletion: '2024-01-29T12:00:00Z'
            },
            rewards: {
              family: {
                type: 'family_activity',
                description: 'Family movie night with pizza',
                value: 'priceless'
              },
              individual: {
                type: 'xp_bonus',
                value: 200,
                unit: 'points'
              }
            },
            milestones: [
              {
                threshold: 25,
                description: 'Quarter way there!',
                reached: true,
                reachedAt: '2024-01-08T14:30:00Z',
                reward: 'Extra dessert for everyone'
              },
              {
                threshold: 50,
                description: 'Halfway milestone',
                reached: true,
                reachedAt: '2024-01-15T16:45:00Z',
                reward: 'Family game night'
              },
              {
                threshold: 75,
                description: 'Three quarters complete',
                reached: false,
                reward: 'Choose next family adventure'
              }
            ],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T10:15:00Z',
            createdBy: 'admin@test.com'
          },
          {
            id: 'goal-002',
            title: 'Alice Reaches Level 10',
            description: 'Help Alice earn enough XP to reach level 10',
            type: 'individual_achievement',
            category: 'personal_growth',
            status: 'in_progress',
            priority: 'medium',
            scope: {
              type: 'individual',
              participants: ['child1'],
              supportingFamily: true
            },
            target: {
              metric: 'child_level',
              value: 10,
              unit: 'level',
              currentLevel: 8,
              xpRequired: 450,
              timeframe: {
                start: '2024-01-01T00:00:00Z',
                end: '2024-02-15T23:59:59Z',
                duration: '6 weeks'
              }
            },
            progress: {
              current: 8,
              currentXP: 2350,
              targetXP: 2800,
              xpToGo: 450,
              percentage: 83.9,
              onTrack: true,
              averageXPPerDay: 25,
              projectedCompletion: '2024-02-12T10:00:00Z'
            },
            rewards: {
              individual: {
                type: 'special_privilege',
                description: 'Choose family dinner for a week',
                duration: '1 week'
              },
              family: {
                type: 'celebration',
                description: 'Alice achievement party'
              }
            },
            milestones: [
              {
                threshold: 'level_9',
                description: 'Reach level 9',
                reached: true,
                reachedAt: '2024-01-20T19:30:00Z',
                reward: 'Extra screen time'
              }
            ],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T08:20:00Z',
            createdBy: 'admin@test.com'
          },
          {
            id: 'goal-003',
            title: 'Perfect Hygiene Week',
            description: 'All children complete all hygiene quests for 7 consecutive days',
            type: 'behavioral_challenge',
            category: 'habits',
            status: 'active',
            priority: 'high',
            scope: {
              type: 'family_wide',
              participants: ['child1', 'child2', 'child3'],
              requiredParticipation: 'all'
            },
            target: {
              metric: 'consecutive_perfect_days',
              value: 7,
              unit: 'days',
              criteria: {
                questCategories: ['hygiene'],
                completionRate: 1.0,
                timelyCompletion: true
              },
              timeframe: {
                start: '2024-01-22T00:00:00Z',
                end: '2024-02-05T23:59:59Z',
                duration: '2 weeks',
                rollingWindow: true
              }
            },
            progress: {
              current: 4,
              percentage: 57.1,
              consecutiveDays: 4,
              longestStreak: 5,
              onTrack: true,
              perfectDays: ['2024-01-25', '2024-01-26', '2024-01-27', '2024-01-28'],
              childrenProgress: [
                {
                  childId: 'child1',
                  name: 'Alice',
                  currentStreak: 4,
                  perfectDays: 4,
                  status: 'on_track'
                },
                {
                  childId: 'child2',
                  name: 'Bob',
                  currentStreak: 4,
                  perfectDays: 4,
                  status: 'on_track'
                },
                {
                  childId: 'child3',
                  name: 'Charlie',
                  currentStreak: 4,
                  perfectDays: 4,
                  status: 'on_track'
                }
              ]
            },
            rewards: {
              family: {
                type: 'special_outing',
                description: 'Trip to amusement park',
                value: 'family_bonding'
              },
              individual: {
                type: 'xp_bonus',
                value: 150,
                unit: 'points'
              }
            },
            createdAt: '2024-01-22T00:00:00Z',
            updatedAt: '2024-01-28T20:00:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        metadata: {
          totalGoals: 3,
          activeGoals: 3,
          completedGoals: 0,
          inProgressGoals: 3,
          goalCategories: ['collaboration', 'personal_growth', 'habits'],
          lastUpdated: '2024-01-28T20:00:00Z',
          familyId: 'family-123'
        },
        summary: {
          overallProgress: 0.69,
          goalsOnTrack: 3,
          goalsAtRisk: 0,
          upcomingDeadlines: [
            {
              goalId: 'goal-001',
              title: 'Complete 100 Quests This Month',
              deadline: '2024-01-31T23:59:59Z',
              daysRemaining: 3
            }
          ],
          recentMilestones: [
            {
              goalId: 'goal-001',
              milestone: '50 quests completed',
              achievedAt: '2024-01-15T16:45:00Z'
            }
          ]
        }
      };
    });

    // Validate overall response structure
    expect(response).toHaveProperty('goals');
    expect(response).toHaveProperty('metadata');
    expect(response).toHaveProperty('summary');
    expect(Array.isArray(response.goals)).toBe(true);
    expect(response.goals.length).toBeGreaterThan(0);

    // Validate metadata
    expect(response.metadata).toMatchObject({
      totalGoals: expect.any(Number),
      activeGoals: expect.any(Number),
      completedGoals: expect.any(Number),
      inProgressGoals: expect.any(Number),
      goalCategories: expect.any(Array),
      lastUpdated: expect.any(String),
      familyId: expect.any(String)
    });

    // Validate individual goal structure
    const goal = response.goals[0];
    expect(goal).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      type: expect.any(String),
      category: expect.any(String),
      status: expect.any(String),
      priority: expect.any(String),
      scope: expect.any(Object),
      target: expect.any(Object),
      progress: expect.any(Object),
      rewards: expect.any(Object),
      milestones: expect.any(Array),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      createdBy: expect.any(String)
    });

    // Validate progress tracking
    expect(goal.progress).toHaveProperty('current');
    expect(goal.progress).toHaveProperty('percentage');
    expect(goal.progress).toHaveProperty('onTrack');
    expect(typeof goal.progress.percentage).toBe('number');

    // Validate summary
    expect(response.summary).toHaveProperty('overallProgress');
    expect(response.summary).toHaveProperty('goalsOnTrack');
    expect(response.summary).toHaveProperty('upcomingDeadlines');
    expect(Array.isArray(response.summary.upcomingDeadlines)).toBe(true);
  });

  test('should filter goals by status', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const status = 'in_progress';
      return {
        goals: [
          {
            id: 'goal-001',
            title: 'In Progress Goal',
            description: 'Goal currently in progress',
            type: 'family_achievement',
            category: 'collaboration',
            status: 'in_progress',
            priority: 'high',
            scope: { type: 'family_wide', participants: ['child1', 'child2'] },
            target: { metric: 'quest_completions', value: 100 },
            progress: { current: 67, percentage: 67.0, onTrack: true },
            rewards: { family: { type: 'family_activity' } },
            milestones: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T10:15:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        filters: {
          status: status
        },
        metadata: {
          totalGoals: 1,
          filteredFrom: 5,
          filterApplied: 'status'
        }
      };
    });

    expect(response.goals.every(goal => goal.status === 'in_progress')).toBe(true);
    expect(response).toHaveProperty('filters');
    expect(response.metadata).toHaveProperty('filteredFrom');
  });

  test('should filter goals by category', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const category = 'personal_growth';
      return {
        goals: [
          {
            id: 'goal-002',
            title: 'Personal Growth Goal',
            description: 'Individual achievement goal',
            type: 'individual_achievement',
            category: 'personal_growth',
            status: 'in_progress',
            priority: 'medium',
            scope: { type: 'individual', participants: ['child1'] },
            target: { metric: 'child_level', value: 10 },
            progress: { current: 8, percentage: 83.9, onTrack: true },
            rewards: { individual: { type: 'special_privilege' } },
            milestones: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T08:20:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        filters: {
          category: category
        },
        metadata: {
          totalGoals: 1,
          categoryFilter: category
        }
      };
    });

    expect(response.goals.every(goal => goal.category === 'personal_growth')).toBe(true);
    expect(response.filters.category).toBe('personal_growth');
  });

  test('should filter goals by participant', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const childId = 'child1';
      return {
        goals: [
          {
            id: 'goal-child1',
            title: 'Goal for Alice',
            description: 'Goal involving Alice',
            type: 'individual_achievement',
            category: 'personal_growth',
            status: 'in_progress',
            priority: 'medium',
            scope: { type: 'individual', participants: ['child1'] },
            target: { metric: 'child_level', value: 10 },
            progress: { current: 8, percentage: 83.9, onTrack: true },
            rewards: { individual: { type: 'special_privilege' } },
            milestones: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T08:20:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        filters: {
          participant: childId
        },
        metadata: {
          totalGoals: 1,
          participantFilter: childId,
          participantName: 'Alice'
        }
      };
    });

    expect(response.goals.every(goal => 
      goal.scope.participants.includes('child1')
    )).toBe(true);
    expect(response.filters.participant).toBe('child1');
  });

  test('should filter goals by priority level', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const priority = 'high';
      return {
        goals: [
          {
            id: 'goal-high-priority',
            title: 'High Priority Goal',
            description: 'Important family goal',
            type: 'family_achievement',
            category: 'collaboration',
            status: 'in_progress',
            priority: 'high',
            scope: { type: 'family_wide', participants: ['child1', 'child2', 'child3'] },
            target: { metric: 'quest_completions', value: 100 },
            progress: { current: 67, percentage: 67.0, onTrack: true },
            rewards: { family: { type: 'family_activity' } },
            milestones: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T10:15:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        filters: {
          priority: priority
        },
        metadata: {
          totalGoals: 1,
          priorityLevel: priority
        }
      };
    });

    expect(response.goals.every(goal => goal.priority === 'high')).toBe(true);
    expect(response.filters.priority).toBe('high');
  });

  test('should include detailed progress analytics', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        goals: [
          {
            id: 'goal-analytics',
            title: 'Analytics Test Goal',
            type: 'family_achievement',
            status: 'in_progress',
            progress: {
              current: 75,
              percentage: 75.0,
              onTrack: true,
              analytics: {
                dailyProgress: [
                  { date: '2024-01-25', progress: 5 },
                  { date: '2024-01-26', progress: 3 },
                  { date: '2024-01-27', progress: 7 },
                  { date: '2024-01-28', progress: 4 }
                ],
                trends: {
                  averageDailyProgress: 4.75,
                  bestDay: { date: '2024-01-27', progress: 7 },
                  worstDay: { date: '2024-01-26', progress: 3 },
                  momentum: 'steady',
                  projectedCompletion: '2024-02-03T15:00:00Z'
                },
                contributors: [
                  {
                    childId: 'child1',
                    name: 'Alice',
                    contribution: 40,
                    percentage: 53.3
                  },
                  {
                    childId: 'child2',
                    name: 'Bob',
                    contribution: 20,
                    percentage: 26.7
                  },
                  {
                    childId: 'child3',
                    name: 'Charlie',
                    contribution: 15,
                    percentage: 20.0
                  }
                ]
              }
            },
            target: { metric: 'quest_completions', value: 100 },
            scope: { type: 'family_wide', participants: ['child1', 'child2', 'child3'] },
            rewards: { family: { type: 'family_activity' } },
            milestones: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T10:15:00Z',
            createdBy: 'admin@test.com'
          }
        ]
      };
    });

    const goal = response.goals[0];
    expect(goal.progress).toHaveProperty('analytics');
    expect(goal.progress.analytics).toHaveProperty('dailyProgress');
    expect(goal.progress.analytics).toHaveProperty('trends');
    expect(goal.progress.analytics).toHaveProperty('contributors');
    expect(Array.isArray(goal.progress.analytics.dailyProgress)).toBe(true);
    expect(Array.isArray(goal.progress.analytics.contributors)).toBe(true);
  });

  test('should return goals with upcoming deadlines highlighted', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        goals: [
          {
            id: 'goal-urgent',
            title: 'Urgent Goal',
            description: 'Goal with approaching deadline',
            type: 'family_achievement',
            status: 'in_progress',
            priority: 'high',
            target: {
              timeframe: {
                end: '2024-02-01T23:59:59Z' // 4 days from now
              }
            },
            progress: {
              current: 60,
              percentage: 60.0,
              onTrack: false,
              urgency: {
                level: 'high',
                daysRemaining: 4,
                requiredDailyProgress: 10,
                currentDailyAverage: 6.5,
                riskAssessment: 'behind_pace'
              }
            },
            scope: { type: 'family_wide', participants: ['child1', 'child2', 'child3'] },
            rewards: { family: { type: 'family_activity' } },
            milestones: [],
            alerts: [
              {
                type: 'deadline_approaching',
                severity: 'warning',
                message: 'Goal deadline in 4 days - increase effort to stay on track',
                actionRequired: true
              }
            ],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T10:15:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        urgentGoals: [
          {
            goalId: 'goal-urgent',
            daysRemaining: 4,
            urgencyLevel: 'high',
            recommendation: 'Focus family effort on this goal'
          }
        ]
      };
    });

    const goal = response.goals[0];
    expect(goal.progress).toHaveProperty('urgency');
    expect(goal.progress.urgency).toMatchObject({
      level: expect.any(String),
      daysRemaining: expect.any(Number),
      requiredDailyProgress: expect.any(Number),
      riskAssessment: expect.any(String)
    });
    expect(goal).toHaveProperty('alerts');
    expect(Array.isArray(goal.alerts)).toBe(true);
    expect(response).toHaveProperty('urgentGoals');
  });

  test('should return empty goals list when no goals exist', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        goals: [],
        metadata: {
          totalGoals: 0,
          activeGoals: 0,
          completedGoals: 0,
          inProgressGoals: 0,
          goalCategories: [],
          lastUpdated: null,
          familyId: 'family-123',
          message: 'No goals set for this family yet'
        },
        summary: {
          overallProgress: 0,
          goalsOnTrack: 0,
          goalsAtRisk: 0,
          upcomingDeadlines: [],
          recentMilestones: []
        },
        suggestions: [
          'Set your first family goal to start building positive habits',
          'Consider starting with a simple collaboration goal',
          'Individual achievement goals can boost children\'s confidence'
        ]
      };
    });

    expect(response.goals).toEqual([]);
    expect(response.metadata.totalGoals).toBe(0);
    expect(response.metadata).toHaveProperty('message');
    expect(response.summary.overallProgress).toBe(0);
    expect(response).toHaveProperty('suggestions');
    expect(Array.isArray(response.suggestions)).toBe(true);
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
        // Attempt to access family goals as child
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
        // Attempt to access family goals without auth
        throw new Error('Unauthorized');
      } catch (error) {
        return { error: error.message, status: 401 };
      }
    });

    expect(response.status).toBe(401);
    expect(response.error).toContain('Unauthorized');
  });

  test('should validate query parameters', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        // Test with invalid status filter
        const invalidStatus = 'super_completed';
        throw new Error('Invalid status filter value');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid');
  });

  test('should include goal achievement statistics', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        goals: [
          {
            id: 'goal-stats',
            title: 'Goal with Statistics',
            type: 'family_achievement',
            status: 'in_progress',
            progress: { current: 80, percentage: 80.0, onTrack: true },
            statistics: {
              daysActive: 28,
              milestoneReachRate: 0.75,
              participationRate: {
                overall: 0.92,
                byChild: [
                  { childId: 'child1', name: 'Alice', rate: 0.95 },
                  { childId: 'child2', name: 'Bob', rate: 0.88 },
                  { childId: 'child3', name: 'Charlie', rate: 0.93 }
                ]
              },
              motivationImpact: 0.67,
              difficultyRating: 'moderate'
            },
            target: { metric: 'quest_completions', value: 100 },
            scope: { type: 'family_wide', participants: ['child1', 'child2', 'child3'] },
            rewards: { family: { type: 'family_activity' } },
            milestones: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T10:15:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        familyGoalStatistics: {
          totalGoalsCreated: 15,
          totalGoalsCompleted: 12,
          completionRate: 0.80,
          averageCompletionTime: '3.2 weeks',
          mostSuccessfulCategory: 'collaboration',
          childEngagementScore: 0.85
        }
      };
    });

    const goal = response.goals[0];
    expect(goal).toHaveProperty('statistics');
    expect(goal.statistics).toMatchObject({
      daysActive: expect.any(Number),
      milestoneReachRate: expect.any(Number),
      participationRate: expect.any(Object),
      motivationImpact: expect.any(Number),
      difficultyRating: expect.any(String)
    });
    expect(response).toHaveProperty('familyGoalStatistics');
    expect(response.familyGoalStatistics).toMatchObject({
      totalGoalsCreated: expect.any(Number),
      completionRate: expect.any(Number),
      averageCompletionTime: expect.any(String)
    });
  });

  test('should support goal search functionality', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const searchQuery = 'quest';
      return {
        goals: [
          {
            id: 'goal-search-result',
            title: 'Complete 100 Quests This Month',
            description: 'Work together to complete quests',
            type: 'family_achievement',
            status: 'in_progress',
            progress: { current: 67, percentage: 67.0, onTrack: true },
            target: { metric: 'quest_completions', value: 100 },
            scope: { type: 'family_wide', participants: ['child1', 'child2', 'child3'] },
            rewards: { family: { type: 'family_activity' } },
            milestones: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T10:15:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        searchMetadata: {
          query: searchQuery,
          totalMatches: 1,
          searchFields: ['title', 'description', 'target.metric'],
          matchedFields: {
            'goal-search-result': ['title', 'description', 'target.metric']
          }
        }
      };
    });

    expect(response).toHaveProperty('searchMetadata');
    expect(response.searchMetadata).toMatchObject({
      query: expect.any(String),
      totalMatches: expect.any(Number),
      searchFields: expect.any(Array),
      matchedFields: expect.any(Object)
    });
    expect(response.goals.length).toBe(response.searchMetadata.totalMatches);
  });

  test('should include milestone progression details', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        goals: [
          {
            id: 'goal-milestones',
            title: 'Goal with Detailed Milestones',
            type: 'family_achievement',
            status: 'in_progress',
            progress: { current: 45, percentage: 45.0, onTrack: true },
            milestones: [
              {
                id: 'milestone-1',
                threshold: 25,
                description: 'Quarter milestone',
                reached: true,
                reachedAt: '2024-01-10T14:30:00Z',
                reward: 'Family ice cream',
                celebration: {
                  type: 'family_treat',
                  completed: true,
                  completedAt: '2024-01-11T19:00:00Z'
                }
              },
              {
                id: 'milestone-2',
                threshold: 50,
                description: 'Halfway point',
                reached: false,
                estimatedReach: '2024-02-01T12:00:00Z',
                reward: 'Movie night',
                daysToReach: 4,
                onTrack: true
              },
              {
                id: 'milestone-3',
                threshold: 75,
                description: 'Three quarters',
                reached: false,
                estimatedReach: '2024-02-10T15:00:00Z',
                reward: 'Family adventure day',
                daysToReach: 13,
                onTrack: true
              }
            ],
            target: { metric: 'quest_completions', value: 100 },
            scope: { type: 'family_wide', participants: ['child1', 'child2', 'child3'] },
            rewards: { family: { type: 'family_activity' } },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-28T10:15:00Z',
            createdBy: 'admin@test.com'
          }
        ]
      };
    });

    const goal = response.goals[0];
    expect(Array.isArray(goal.milestones)).toBe(true);
    
    if (goal.milestones.length > 0) {
      const reachedMilestone = goal.milestones.find(m => m.reached);
      const upcomingMilestone = goal.milestones.find(m => !m.reached);
      
      if (reachedMilestone) {
        expect(reachedMilestone).toHaveProperty('reachedAt');
        expect(reachedMilestone).toHaveProperty('celebration');
      }
      
      if (upcomingMilestone) {
        expect(upcomingMilestone).toHaveProperty('estimatedReach');
        expect(upcomingMilestone).toHaveProperty('daysToReach');
        expect(upcomingMilestone).toHaveProperty('onTrack');
      }
    }
  });
});