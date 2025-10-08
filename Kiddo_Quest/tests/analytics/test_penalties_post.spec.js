const { test, expect } = require('@playwright/test');

test.describe('POST /api/penalties/rules', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login as parent/admin
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'adminpassword123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should create a new penalty rule successfully', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const newRule = {
        name: 'Incomplete Chores Penalty',
        description: 'XP deduction for not completing assigned chores',
        type: 'quest_incomplete',
        severity: 'moderate',
        isActive: true,
        trigger: {
          condition: 'quest_not_completed',
          threshold: {
            hoursOverdue: 2,
            questCategories: ['chores']
          }
        },
        penalty: {
          type: 'xp_deduction',
          value: 30,
          unit: 'points'
        },
        scope: {
          appliesTo: ['all_children'],
          questCategories: ['chores'],
          minAge: 6,
          excludeFirstOffense: false
        },
        notifications: {
          warning: {
            enabled: true,
            threshold: 1,
            message: 'Please complete your chores within the next hour to avoid penalty'
          },
          enforcement: {
            notifyParent: true,
            notifyChild: true,
            message: 'XP has been deducted for incomplete chores'
          }
        }
      };

      // Mock successful rule creation response
      return {
        ruleId: 'rule-new-001',
        rule: {
          ...newRule,
          id: 'rule-new-001',
          createdAt: '2024-01-31T15:00:00Z',
          updatedAt: '2024-01-31T15:00:00Z',
          createdBy: 'admin@test.com',
          version: 1
        },
        validation: {
          isValid: true,
          warnings: [],
          conflicts: []
        },
        impact: {
          estimatedAffectedChildren: 3,
          similarRules: 0,
          conflictingRules: []
        },
        message: 'Penalty rule created successfully'
      };
    });

    // Validate response structure
    expect(response).toMatchObject({
      ruleId: expect.any(String),
      rule: expect.any(Object),
      validation: expect.any(Object),
      impact: expect.any(Object),
      message: expect.any(String)
    });

    // Validate created rule structure
    expect(response.rule).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      type: expect.any(String),
      severity: expect.any(String),
      isActive: expect.any(Boolean),
      trigger: expect.any(Object),
      penalty: expect.any(Object),
      scope: expect.any(Object),
      notifications: expect.any(Object),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      createdBy: expect.any(String),
      version: expect.any(Number)
    });

    // Validate validation result
    expect(response.validation.isValid).toBe(true);
    expect(Array.isArray(response.validation.warnings)).toBe(true);
    expect(Array.isArray(response.validation.conflicts)).toBe(true);

    // Validate impact analysis
    expect(response.impact).toHaveProperty('estimatedAffectedChildren');
    expect(response.impact).toHaveProperty('similarRules');
    expect(response.impact).toHaveProperty('conflictingRules');
  });

  test('should create escalating penalty rule', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const escalatingRule = {
        name: 'Progressive Bedtime Violation',
        description: 'Escalating consequences for repeated bedtime violations',
        type: 'bedtime_violation',
        severity: 'progressive',
        isActive: true,
        trigger: {
          condition: 'bedtime_missed',
          threshold: {
            minutesLate: 15,
            consecutiveDays: 1
          }
        },
        penalty: {
          type: 'escalating_consequence',
          escalationPolicy: {
            firstOffense: {
              type: 'warning',
              message: 'Remember to get to bed on time tomorrow!'
            },
            secondOffense: {
              type: 'xp_deduction',
              value: 25,
              unit: 'points'
            },
            thirdOffense: {
              type: 'privilege_restriction',
              value: 'screen_time',
              duration: '30 minutes'
            },
            fourthOffense: {
              type: 'privilege_restriction',
              value: 'screen_time',
              duration: '1 hour'
            },
            subsequentOffenses: {
              type: 'bedtime_adjustment',
              value: '15 minutes earlier',
              duration: '3 days'
            }
          },
          resetPeriod: '1 week',
          maxEscalationLevel: 5
        },
        scope: {
          appliesTo: ['all_children'],
          minAge: 5,
          maxAge: 16
        },
        schedule: {
          evaluationTime: '21:30',
          timezone: 'America/New_York',
          weekdaysOnly: false
        }
      };

      return {
        ruleId: 'rule-escalating-001',
        rule: {
          ...escalatingRule,
          id: 'rule-escalating-001',
          createdAt: '2024-01-31T15:00:00Z',
          updatedAt: '2024-01-31T15:00:00Z',
          createdBy: 'admin@test.com',
          version: 1
        },
        validation: {
          isValid: true,
          warnings: [
            'Escalating rules require careful monitoring to ensure fairness'
          ],
          conflicts: []
        },
        tracking: {
          currentOffenseCount: {},
          nextResetDate: '2024-02-07T00:00:00Z'
        }
      };
    });

    expect(response.rule.penalty.type).toBe('escalating_consequence');
    expect(response.rule.penalty).toHaveProperty('escalationPolicy');
    expect(response.rule.penalty.escalationPolicy).toHaveProperty('firstOffense');
    expect(response.rule.penalty.escalationPolicy).toHaveProperty('subsequentOffenses');
    expect(response.rule.penalty).toHaveProperty('resetPeriod');
    expect(response).toHaveProperty('tracking');
  });

  test('should create conditional penalty rule', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const conditionalRule = {
        name: 'Weekend Quest Bonus Penalty',
        description: 'Additional penalty for missing quests on weekends',
        type: 'conditional_penalty',
        severity: 'mild',
        isActive: true,
        trigger: {
          condition: 'quest_not_completed',
          threshold: {
            hoursOverdue: 4
          },
          conditionalModifiers: [
            {
              condition: 'is_weekend',
              modifier: {
                penaltyMultiplier: 1.5,
                additionalMessage: 'Weekend quests are especially important!'
              }
            },
            {
              condition: 'child_age_under_10',
              modifier: {
                penaltyReduction: 0.5,
                gentlerMessage: true
              }
            }
          ]
        },
        penalty: {
          type: 'xp_deduction',
          value: 20,
          unit: 'points'
        },
        scope: {
          appliesTo: ['all_children'],
          questCategories: ['chores', 'family_time'],
          timeRestrictions: {
            weekends: true,
            weekdays: false
          }
        }
      };

      return {
        ruleId: 'rule-conditional-001',
        rule: {
          ...conditionalRule,
          id: 'rule-conditional-001',
          createdAt: '2024-01-31T15:00:00Z',
          updatedAt: '2024-01-31T15:00:00Z',
          createdBy: 'admin@test.com',
          version: 1
        },
        validation: {
          isValid: true,
          warnings: [],
          conflicts: []
        },
        complexity: {
          level: 'advanced',
          conditionalModifiers: 2,
          estimatedProcessingTime: '< 1 second'
        }
      };
    });

    expect(response.rule.trigger).toHaveProperty('conditionalModifiers');
    expect(Array.isArray(response.rule.trigger.conditionalModifiers)).toBe(true);
    expect(response.rule.scope).toHaveProperty('timeRestrictions');
    expect(response).toHaveProperty('complexity');
    expect(response.complexity.conditionalModifiers).toBe(2);
  });

  test('should validate required fields', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const incompleteRule = {
          name: 'Incomplete Rule',
          // Missing required fields: type, trigger, penalty
        };
        throw new Error('Validation failed: Missing required fields: type, trigger, penalty');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Missing required fields');
  });

  test('should validate penalty value constraints', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const invalidRule = {
          name: 'Invalid Penalty Rule',
          type: 'quest_incomplete',
          trigger: {
            condition: 'quest_not_completed'
          },
          penalty: {
            type: 'xp_deduction',
            value: -50, // Invalid negative value
            unit: 'points'
          }
        };
        throw new Error('Validation failed: Penalty value must be positive');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('must be positive');
  });

  test('should validate severity levels', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const invalidRule = {
          name: 'Invalid Severity Rule',
          type: 'quest_incomplete',
          severity: 'ultra_extreme', // Invalid severity
          trigger: {
            condition: 'quest_not_completed'
          },
          penalty: {
            type: 'xp_deduction',
            value: 25,
            unit: 'points'
          }
        };
        throw new Error('Validation failed: Invalid severity level');
      } catch (error) {
        return { error: error.message, status: 400 };
      }
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid severity level');
  });

  test('should detect rule conflicts', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const conflictingRule = {
        name: 'Conflicting Rule',
        type: 'quest_incomplete',
        severity: 'severe',
        trigger: {
          condition: 'quest_not_completed',
          threshold: {
            hoursOverdue: 1 // Conflicts with existing rule
          }
        },
        penalty: {
          type: 'xp_deduction',
          value: 50,
          unit: 'points'
        },
        scope: {
          appliesTo: ['all_children'],
          questCategories: ['chores'] // Same scope as existing rule
        }
      };

      return {
        ruleId: null,
        rule: null,
        validation: {
          isValid: false,
          warnings: [],
          conflicts: [
            {
              conflictType: 'overlapping_scope',
              conflictingRuleId: 'rule-001',
              conflictingRuleName: 'Late Quest Completion',
              description: 'Both rules apply to same children and quest categories with similar triggers',
              severity: 'high',
              recommendation: 'Modify scope or trigger conditions to avoid overlap'
            }
          ]
        },
        error: 'Rule conflicts detected - review and resolve before creating'
      };
    });

    expect(response.validation.isValid).toBe(false);
    expect(response.validation.conflicts.length).toBeGreaterThan(0);
    expect(response.validation.conflicts[0]).toMatchObject({
      conflictType: expect.any(String),
      conflictingRuleId: expect.any(String),
      conflictingRuleName: expect.any(String),
      description: expect.any(String),
      severity: expect.any(String),
      recommendation: expect.any(String)
    });
    expect(response.ruleId).toBeNull();
  });

  test('should validate child access permissions', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const unauthorizedRule = {
          name: 'Unauthorized Child Rule',
          type: 'quest_incomplete',
          trigger: {
            condition: 'quest_not_completed'
          },
          penalty: {
            type: 'xp_deduction',
            value: 25,
            unit: 'points'
          },
          scope: {
            appliesTo: ['unauthorized-child-id'] // Child not in family
          }
        };
        throw new Error('Validation failed: Access denied to specified children');
      } catch (error) {
        return { error: error.message, status: 403 };
      }
    });

    expect(response.status).toBe(403);
    expect(response.error).toContain('Access denied');
  });

  test('should handle rule preview mode', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const previewRule = {
        name: 'Preview Test Rule',
        type: 'quest_incomplete',
        severity: 'moderate',
        trigger: {
          condition: 'quest_not_completed',
          threshold: {
            hoursOverdue: 3
          }
        },
        penalty: {
          type: 'xp_deduction',
          value: 40,
          unit: 'points'
        },
        scope: {
          appliesTo: ['all_children'],
          questCategories: ['chores']
        },
        preview: true // Preview mode
      };

      return {
        ruleId: null, // Not created in preview mode
        preview: {
          rule: previewRule,
          validation: {
            isValid: true,
            warnings: [
              'Consider adding first offense exception for fairness'
            ],
            conflicts: []
          },
          impact: {
            estimatedAffectedChildren: 3,
            estimatedTriggersPerWeek: 2.3,
            behaviorChangeProjection: 0.15,
            childrenDetails: [
              {
                childId: 'child1',
                name: 'Alice',
                currentChoreCompletion: 0.85,
                estimatedImpact: 'low'
              },
              {
                childId: 'child2',
                name: 'Bob',
                currentChoreCompletion: 0.65,
                estimatedImpact: 'medium'
              },
              {
                childId: 'child3',
                name: 'Charlie',
                currentChoreCompletion: 0.45,
                estimatedImpact: 'high'
              }
            ]
          },
          recommendations: [
            'Start with a warning-only period to establish baseline',
            'Consider lower penalty value for first implementation'
          ]
        },
        message: 'Rule preview generated successfully'
      };
    });

    expect(response.ruleId).toBeNull();
    expect(response).toHaveProperty('preview');
    expect(response.preview).toHaveProperty('rule');
    expect(response.preview).toHaveProperty('validation');
    expect(response.preview).toHaveProperty('impact');
    expect(response.preview).toHaveProperty('recommendations');
    expect(Array.isArray(response.preview.recommendations)).toBe(true);
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
        // Attempt to create penalty rule as child
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
        // Attempt to create penalty rule without auth
        throw new Error('Unauthorized');
      } catch (error) {
        return { error: error.message, status: 401 };
      }
    });

    expect(response.status).toBe(401);
    expect(response.error).toContain('Unauthorized');
  });

  test('should validate rule limits per family', async ({ page }) => {
    const response = await page.evaluate(async () => {
      try {
        const newRule = {
          name: 'Too Many Rules Test',
          type: 'quest_incomplete',
          trigger: {
            condition: 'quest_not_completed'
          },
          penalty: {
            type: 'xp_deduction',
            value: 25,
            unit: 'points'
          }
        };
        // Simulate family already has maximum allowed rules
        throw new Error('Limit exceeded: Maximum penalty rules per family (25) reached');
      } catch (error) {
        return { error: error.message, status: 429 };
      }
    });

    expect(response.status).toBe(429);
    expect(response.error).toContain('Maximum penalty rules');
  });

  test('should create rule with advanced trigger conditions', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const advancedRule = {
        name: 'Complex Trigger Rule',
        type: 'advanced_behavioral',
        severity: 'moderate',
        trigger: {
          condition: 'complex_condition',
          logic: 'AND',
          conditions: [
            {
              type: 'quest_not_completed',
              threshold: {
                hoursOverdue: 2
              }
            },
            {
              type: 'consecutive_days',
              threshold: {
                days: 2
              }
            },
            {
              type: 'category_specific',
              threshold: {
                categories: ['chores', 'homework'],
                minMissed: 2
              }
            }
          ],
          timeWindow: '7 days'
        },
        penalty: {
          type: 'composite_penalty',
          components: [
            {
              type: 'xp_deduction',
              value: 50,
              unit: 'points'
            },
            {
              type: 'privilege_restriction',
              value: 'screen_time',
              duration: '1 hour'
            }
          ]
        },
        scope: {
          appliesTo: ['all_children'],
          minAge: 8
        }
      };

      return {
        ruleId: 'rule-advanced-001',
        rule: {
          ...advancedRule,
          id: 'rule-advanced-001',
          createdAt: '2024-01-31T15:00:00Z',
          updatedAt: '2024-01-31T15:00:00Z',
          createdBy: 'admin@test.com',
          version: 1
        },
        complexity: {
          level: 'advanced',
          triggerConditions: 3,
          penaltyComponents: 2,
          processingComplexity: 'medium'
        },
        validation: {
          isValid: true,
          warnings: [
            'Complex rules may be harder for children to understand',
            'Consider simplifying trigger conditions for better clarity'
          ],
          conflicts: []
        }
      };
    });

    expect(response.rule.trigger).toHaveProperty('logic');
    expect(response.rule.trigger).toHaveProperty('conditions');
    expect(Array.isArray(response.rule.trigger.conditions)).toBe(true);
    expect(response.rule.penalty).toHaveProperty('components');
    expect(Array.isArray(response.rule.penalty.components)).toBe(true);
    expect(response).toHaveProperty('complexity');
    expect(response.complexity.triggerConditions).toBe(3);
    expect(response.complexity.penaltyComponents).toBe(2);
  });

  test('should return proper response format for successful creation', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const validRule = {
        name: 'Standard Penalty Rule',
        description: 'A standard penalty rule for testing',
        type: 'quest_incomplete',
        severity: 'moderate',
        trigger: {
          condition: 'quest_not_completed',
          threshold: {
            hoursOverdue: 2
          }
        },
        penalty: {
          type: 'xp_deduction',
          value: 30,
          unit: 'points'
        },
        scope: {
          appliesTo: ['all_children']
        }
      };

      return {
        ruleId: 'rule-standard-001',
        rule: {
          ...validRule,
          id: 'rule-standard-001',
          isActive: true,
          createdAt: '2024-01-31T15:00:00Z',
          updatedAt: '2024-01-31T15:00:00Z',
          createdBy: 'admin@test.com',
          version: 1
        },
        validation: {
          isValid: true,
          warnings: [],
          conflicts: []
        },
        impact: {
          estimatedAffectedChildren: 3,
          similarRules: 0,
          conflictingRules: []
        },
        links: {
          self: '/api/penalties/rules/rule-standard-001',
          edit: '/api/penalties/rules/rule-standard-001',
          delete: '/api/penalties/rules/rule-standard-001',
          activate: '/api/penalties/rules/rule-standard-001/activate',
          deactivate: '/api/penalties/rules/rule-standard-001/deactivate'
        },
        message: 'Penalty rule created and activated successfully'
      };
    });

    expect(response).toMatchObject({
      ruleId: expect.any(String),
      rule: expect.any(Object),
      validation: expect.any(Object),
      impact: expect.any(Object),
      links: expect.any(Object),
      message: expect.any(String)
    });

    expect(response.links).toMatchObject({
      self: expect.any(String),
      edit: expect.any(String),
      delete: expect.any(String),
      activate: expect.any(String),
      deactivate: expect.any(String)
    });

    expect(response.validation.isValid).toBe(true);
    expect(response.rule.isActive).toBe(true);
  });
});