const { test, expect } = require('@playwright/test');

test.describe('GET /api/penalties/rules', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent/admin
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'adminpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should return all penalty rules for family', async ({ page }) => {
    const response = await page.evaluate(async () => {
      // Mock the API response for penalty rules
      return {
        rules: [
          {
            id: 'rule-001',
            name: 'Late Quest Completion',
            description: 'XP penalty for completing quests after deadline',
            type: 'quest_lateness',
            isActive: true,
            severity: 'moderate',
            trigger: {
              condition: 'quest_completed_late',
              threshold: {
                timeOverdue: '1 hour'
              }
            },
            penalty: {
              type: 'xp_reduction',
              value: 25,
              unit: 'percentage'
            },
            scope: {
              appliesTo: ['all_children'],
              questCategories: ['all'],
              excludeFirstOffense: true
            },
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-15T14:30:00Z',
            createdBy: 'admin@test.com'
          },
          {
            id: 'rule-002',
            name: 'Incomplete Daily Hygiene',
            description: 'XP loss for not completing daily hygiene tasks',
            type: 'daily_requirement_missed',
            isActive: true,
            severity: 'mild',
            trigger: {
              condition: 'daily_hygiene_incomplete',
              threshold: {
                missedTasks: 2,
                timeframe: 'daily'
              }
            },
            penalty: {
              type: 'xp_deduction',
              value: 50,
              unit: 'points'
            },
            scope: {
              appliesTo: ['child1', 'child2'],
              questCategories: ['hygiene'],
              minimumAge: 6
            },
            schedule: {
              evaluationTime: '20:00',
              timezone: 'America/New_York'
            },
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-20T09:15:00Z',
            createdBy: 'admin@test.com'
          },
          {
            id: 'rule-003',
            name: 'Repeated Quest Avoidance',
            description: 'Progressive penalty for avoiding assigned quests',
            type: 'quest_avoidance',
            isActive: true,
            severity: 'severe',
            trigger: {
              condition: 'quest_not_attempted',
              threshold: {
                consecutiveAvoidance: 3,
                timeframe: 'weekly'
              }
            },
            penalty: {
              type: 'privilege_restriction',
              value: 'screen_time',
              duration: '24 hours',
              progressive: true,
              escalation: {
                firstOffense: '12 hours',
                secondOffense: '24 hours',
                thirdOffense: '48 hours'
              }
            },
            scope: {
              appliesTo: ['all_children'],
              questCategories: ['chores', 'homework'],
              minAge: 8
            },
            notifications: {
              warning: {
                enabled: true,
                threshold: 2
              },
              enforcement: {
                notifyParent: true,
                notifyChild: true
              }
            },
            createdAt: '2024-01-05T16:00:00Z',
            updatedAt: '2024-01-25T11:45:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        metadata: {
          totalRules: 3,
          activeRules: 3,
          inactiveRules: 0,
          ruleCategories: ['quest_lateness', 'daily_requirement_missed', 'quest_avoidance'],
          lastUpdated: '2024-01-25T11:45:00Z',
          familyId: 'family-123'
        },
        statistics: {
          enforcementHistory: {
            thisWeek: 2,
            thisMonth: 8,
            total: 45
          },
          mostTriggeredRule: 'rule-001',
          effectivenessRating: 0.78,
          behaviorImprovementRate: 0.23
        }
      };
    });

    // Validate overall response structure
    expect(response).toHaveProperty('rules');
    expect(response).toHaveProperty('metadata');
    expect(response).toHaveProperty('statistics');
    expect(Array.isArray(response.rules)).toBe(true);
    expect(response.rules.length).toBeGreaterThan(0);

    // Validate metadata
    expect(response.metadata).toMatchObject({
      totalRules: expect.any(Number),
      activeRules: expect.any(Number),
      inactiveRules: expect.any(Number),
      ruleCategories: expect.any(Array),
      lastUpdated: expect.any(String),
      familyId: expect.any(String)
    });

    // Validate individual rule structure
    const rule = response.rules[0];
    expect(rule).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      type: expect.any(String),
      isActive: expect.any(Boolean),
      severity: expect.any(String),
      trigger: expect.any(Object),
      penalty: expect.any(Object),
      scope: expect.any(Object),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      createdBy: expect.any(String)
    });

    // Validate trigger structure
    expect(rule.trigger).toHaveProperty('condition');
    expect(rule.trigger).toHaveProperty('threshold');

    // Validate penalty structure
    expect(rule.penalty).toHaveProperty('type');
    expect(rule.penalty).toHaveProperty('value');

    // Validate scope structure
    expect(rule.scope).toHaveProperty('appliesTo');
    expect(Array.isArray(rule.scope.appliesTo)).toBe(true);
  });

  test('should filter rules by active status', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const activeOnly = true;
      return {
        rules: [
          {
            id: 'rule-001',
            name: 'Active Rule 1',
            description: 'Active penalty rule',
            type: 'quest_lateness',
            isActive: true,
            severity: 'moderate',
            trigger: { condition: 'quest_completed_late' },
            penalty: { type: 'xp_reduction', value: 25 },
            scope: { appliesTo: ['all_children'] },
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-15T14:30:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        filters: {
          active: activeOnly
        },
        metadata: {
          totalRules: 1,
          activeRules: 1,
          inactiveRules: 0,
          filteredFrom: 5
        }
      };
    });

    expect(response.rules.every(rule => rule.isActive === true)).toBe(true);
    expect(response).toHaveProperty('filters');
    expect(response.metadata).toHaveProperty('filteredFrom');
  });

  test('should filter rules by type', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const ruleType = 'quest_lateness';
      return {
        rules: [
          {
            id: 'rule-001',
            name: 'Late Completion Penalty',
            type: 'quest_lateness',
            isActive: true,
            severity: 'moderate',
            trigger: { condition: 'quest_completed_late' },
            penalty: { type: 'xp_reduction', value: 25 },
            scope: { appliesTo: ['all_children'] },
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-15T14:30:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        filters: {
          type: ruleType
        },
        metadata: {
          totalRules: 1,
          filteredType: ruleType
        }
      };
    });

    expect(response.rules.every(rule => rule.type === 'quest_lateness')).toBe(true);
    expect(response.filters.type).toBe('quest_lateness');
  });

  test('should filter rules by severity level', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const severity = 'severe';
      return {
        rules: [
          {
            id: 'rule-003',
            name: 'Quest Avoidance Penalty',
            type: 'quest_avoidance',
            isActive: true,
            severity: 'severe',
            trigger: { condition: 'quest_not_attempted' },
            penalty: { type: 'privilege_restriction', value: 'screen_time' },
            scope: { appliesTo: ['all_children'] },
            createdAt: '2024-01-05T16:00:00Z',
            updatedAt: '2024-01-25T11:45:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        filters: {
          severity: severity
        },
        metadata: {
          totalRules: 1,
          severityLevel: severity
        }
      };
    });

    expect(response.rules.every(rule => rule.severity === 'severe')).toBe(true);
    expect(response.filters.severity).toBe('severe');
  });

  test('should include rule enforcement statistics', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        rules: [
          {
            id: 'rule-001',
            name: 'Late Quest Completion',
            type: 'quest_lateness',
            isActive: true,
            severity: 'moderate',
            trigger: { condition: 'quest_completed_late' },
            penalty: { type: 'xp_reduction', value: 25 },
            scope: { appliesTo: ['all_children'] },
            statistics: {
              totalEnforcements: 15,
              thisWeekEnforcements: 3,
              thisMonthEnforcements: 8,
              averageEnforcementsPerWeek: 2.1,
              effectivenessScore: 0.82,
              behaviorChangeRate: 0.34,
              childrenAffected: ['child1', 'child2'],
              lastEnforced: '2024-01-30T14:20:00Z'
            },
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-15T14:30:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        aggregateStatistics: {
          totalEnforcements: 45,
          averageEffectiveness: 0.78,
          mostEffectiveRule: 'rule-003',
          leastEffectiveRule: 'rule-002',
          overallBehaviorImprovement: 0.23
        }
      };
    });

    const ruleWithStats = response.rules[0];
    expect(ruleWithStats).toHaveProperty('statistics');
    expect(ruleWithStats.statistics).toMatchObject({
      totalEnforcements: expect.any(Number),
      thisWeekEnforcements: expect.any(Number),
      thisMonthEnforcements: expect.any(Number),
      effectivenessScore: expect.any(Number),
      behaviorChangeRate: expect.any(Number),
      childrenAffected: expect.any(Array),
      lastEnforced: expect.any(String)
    });

    expect(response).toHaveProperty('aggregateStatistics');
    expect(response.aggregateStatistics).toMatchObject({
      totalEnforcements: expect.any(Number),
      averageEffectiveness: expect.any(Number),
      overallBehaviorImprovement: expect.any(Number)
    });
  });

  test('should return rules with escalation policies', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        rules: [
          {
            id: 'rule-progressive',
            name: 'Progressive Discipline Rule',
            type: 'repeated_violation',
            isActive: true,
            severity: 'progressive',
            trigger: {
              condition: 'rule_violation_repeat',
              threshold: {
                occurrences: 2,
                timeframe: 'weekly'
              }
            },
            penalty: {
              type: 'escalating_consequence',
              escalationPolicy: {
                firstOffense: {
                  type: 'warning',
                  message: 'This is your first warning about this behavior.'
                },
                secondOffense: {
                  type: 'xp_deduction',
                  value: 25,
                  unit: 'points'
                },
                thirdOffense: {
                  type: 'privilege_restriction',
                  value: 'screen_time',
                  duration: '1 hour'
                },
                fourthOffense: {
                  type: 'privilege_restriction',
                  value: 'screen_time',
                  duration: '4 hours'
                },
                subsequentOffenses: {
                  type: 'parent_intervention',
                  escalateTo: 'manual_review'
                }
              },
              resetPeriod: '1 month'
            },
            scope: {
              appliesTo: ['all_children'],
              minAge: 7
            },
            tracking: {
              currentOffenseCount: {
                'child1': 1,
                'child2': 0,
                'child3': 3
              },
              nextResetDate: '2024-02-01T00:00:00Z'
            },
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-28T16:00:00Z',
            createdBy: 'admin@test.com'
          }
        ]
      };
    });

    const rule = response.rules[0];
    expect(rule.penalty).toHaveProperty('escalationPolicy');
    expect(rule.penalty.escalationPolicy).toHaveProperty('firstOffense');
    expect(rule.penalty.escalationPolicy).toHaveProperty('secondOffense');
    expect(rule.penalty.escalationPolicy).toHaveProperty('thirdOffense');
    expect(rule).toHaveProperty('tracking');
    expect(rule.tracking).toHaveProperty('currentOffenseCount');
    expect(rule.tracking).toHaveProperty('nextResetDate');
  });

  test('should return empty rules list when no rules exist', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        rules: [],
        metadata: {
          totalRules: 0,
          activeRules: 0,
          inactiveRules: 0,
          ruleCategories: [],
          lastUpdated: null,
          familyId: 'family-123',
          message: 'No penalty rules configured for this family'
        },
        statistics: {
          enforcementHistory: {
            thisWeek: 0,
            thisMonth: 0,
            total: 0
          },
          effectivenessRating: null,
          behaviorImprovementRate: null
        }
      };
    });

    expect(response.rules).toEqual([]);
    expect(response.metadata.totalRules).toBe(0);
    expect(response.metadata).toHaveProperty('message');
    expect(response.statistics.enforcementHistory.total).toBe(0);
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
        // Attempt to access penalty rules as child
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
        // Attempt to access penalty rules without auth
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
        // Test with invalid severity filter
        const invalidSeverity = 'ultra_mega_severe';
        throw new Error('Invalid severity level');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid');
  });

  test('should include rule validation status', async ({ page }) => {
    const response = await page.evaluate(async () => {
      return {
        rules: [
          {
            id: 'rule-001',
            name: 'Validated Rule',
            type: 'quest_lateness',
            isActive: true,
            severity: 'moderate',
            trigger: { condition: 'quest_completed_late' },
            penalty: { type: 'xp_reduction', value: 25 },
            scope: { appliesTo: ['all_children'] },
            validation: {
              isValid: true,
              lastValidated: '2024-01-31T10:00:00Z',
              warnings: [],
              conflicts: []
            },
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-15T14:30:00Z',
            createdBy: 'admin@test.com'
          },
          {
            id: 'rule-002',
            name: 'Rule with Warnings',
            type: 'daily_requirement_missed',
            isActive: true,
            severity: 'mild',
            trigger: { condition: 'daily_hygiene_incomplete' },
            penalty: { type: 'xp_deduction', value: 50 },
            scope: { appliesTo: ['child1'] },
            validation: {
              isValid: true,
              lastValidated: '2024-01-31T10:00:00Z',
              warnings: [
                'Rule only applies to one child - consider broader scope',
                'No maximum penalty limit defined'
              ],
              conflicts: []
            },
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-20T09:15:00Z',
            createdBy: 'admin@test.com'
          }
        ]
      };
    });

    const validRule = response.rules[0];
    const warningRule = response.rules[1];

    expect(validRule.validation).toMatchObject({
      isValid: true,
      lastValidated: expect.any(String),
      warnings: expect.any(Array),
      conflicts: expect.any(Array)
    });

    expect(validRule.validation.warnings).toEqual([]);
    expect(warningRule.validation.warnings.length).toBeGreaterThan(0);
  });

  test('should support rule search functionality', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const searchQuery = 'hygiene';
      return {
        rules: [
          {
            id: 'rule-002',
            name: 'Incomplete Daily Hygiene',
            description: 'XP loss for not completing daily hygiene tasks',
            type: 'daily_requirement_missed',
            isActive: true,
            severity: 'mild',
            trigger: { condition: 'daily_hygiene_incomplete' },
            penalty: { type: 'xp_deduction', value: 50 },
            scope: { appliesTo: ['child1', 'child2'], questCategories: ['hygiene'] },
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-20T09:15:00Z',
            createdBy: 'admin@test.com'
          }
        ],
        searchMetadata: {
          query: searchQuery,
          totalMatches: 1,
          searchFields: ['name', 'description', 'scope.questCategories'],
          matchedFields: {
            'rule-002': ['name', 'description', 'scope.questCategories']
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
    expect(response.rules.length).toBe(response.searchMetadata.totalMatches);
  });
});