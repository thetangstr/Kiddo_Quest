// Penalty rule model and manager for KiddoQuest behavioral management system

import { serverTimestamp } from 'firebase/firestore';

// Penalty configuration
const PENALTY_CONFIG = {
  TYPES: {
    XP_DEDUCTION: 'xp_deduction',
    STREAK_BREAK: 'streak_break',
    REWARD_RESTRICTION: 'reward_restriction',
    QUEST_LIMIT: 'quest_limit',
    TIME_BASED: 'time_based',
    PRIVILEGE_LOSS: 'privilege_loss'
  },
  SEVERITY: {
    MINOR: { name: 'Minor', multiplier: 1.0, color: '#FFC107' },
    MODERATE: { name: 'Moderate', multiplier: 1.5, color: '#FF9800' },
    MAJOR: { name: 'Major', multiplier: 2.0, color: '#F44336' },
    SEVERE: { name: 'Severe', multiplier: 3.0, color: '#B71C1C' }
  },
  TRIGGERS: {
    MISSED_QUEST: 'missed_quest',
    LATE_COMPLETION: 'late_completion',
    POOR_QUALITY: 'poor_quality',
    BEHAVIORAL_ISSUE: 'behavioral_issue',
    RULE_VIOLATION: 'rule_violation',
    STREAK_BREAK: 'streak_break',
    CUSTOM: 'custom'
  },
  STATUS: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
  },
  MAX_ACTIVE_PENALTIES: 5,
  APPEAL_WINDOW_HOURS: 24
};

// Default penalty rules
const DEFAULT_PENALTY_RULES = [
  {
    id: 'missed_quest_minor',
    name: 'Missed Quest - Minor',
    description: 'Small XP deduction for missing an easy quest',
    trigger: 'missed_quest',
    severity: 'minor',
    type: 'xp_deduction',
    conditions: { questDifficulty: 'easy' },
    consequences: { xpDeduction: 25 },
    isActive: true,
    autoApply: true
  },
  {
    id: 'missed_quest_moderate',
    name: 'Missed Quest - Moderate',
    description: 'XP deduction for missing a medium quest',
    trigger: 'missed_quest',
    severity: 'moderate',
    type: 'xp_deduction',
    conditions: { questDifficulty: 'medium' },
    consequences: { xpDeduction: 50 },
    isActive: true,
    autoApply: true
  },
  {
    id: 'missed_quest_major',
    name: 'Missed Quest - Major',
    description: 'Significant penalty for missing a hard quest',
    trigger: 'missed_quest',
    severity: 'major',
    type: 'xp_deduction',
    conditions: { questDifficulty: 'hard' },
    consequences: { xpDeduction: 100, streakBreak: true },
    isActive: true,
    autoApply: true
  },
  {
    id: 'late_completion',
    name: 'Late Quest Completion',
    description: 'Reduced XP for completing quest after deadline',
    trigger: 'late_completion',
    severity: 'minor',
    type: 'xp_deduction',
    conditions: { hoursLate: { min: 1, max: 24 } },
    consequences: { xpReduction: 0.5 }, // 50% XP reduction
    isActive: true,
    autoApply: true
  },
  {
    id: 'streak_break_penalty',
    name: 'Streak Break Penalty',
    description: 'Additional penalty for breaking a long streak',
    trigger: 'streak_break',
    severity: 'moderate',
    type: 'time_based',
    conditions: { streakLength: { min: 7 } },
    consequences: { cooldownHours: 24, xpDeduction: 100 },
    isActive: true,
    autoApply: true
  },
  {
    id: 'poor_quality_work',
    name: 'Poor Quality Work',
    description: 'Penalty for submitting low-quality quest completion',
    trigger: 'poor_quality',
    severity: 'moderate',
    type: 'xp_deduction',
    conditions: { parentRating: { max: 2 } },
    consequences: { xpDeduction: 75, redoRequired: true },
    isActive: false,
    autoApply: false
  }
];

// Penalty rule model class
export class PenaltyRule {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.familyId = data.familyId;
    this.name = data.name;
    this.description = data.description;
    this.trigger = data.trigger;
    this.severity = data.severity || 'minor';
    this.type = data.type;
    this.conditions = data.conditions || {};
    this.consequences = data.consequences || {};
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.autoApply = data.autoApply !== undefined ? data.autoApply : false;
    this.appealable = data.appealable !== undefined ? data.appealable : true;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || serverTimestamp();
    this.updatedAt = data.updatedAt || serverTimestamp();
  }

  generateId() {
    return `penalty_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if rule conditions are met
  checkConditions(eventData) {
    if (!this.isActive) return false;

    const conditions = this.conditions;
    
    // Check quest difficulty condition
    if (conditions.questDifficulty && eventData.questDifficulty !== conditions.questDifficulty) {
      return false;
    }
    
    // Check hours late condition
    if (conditions.hoursLate) {
      const hoursLate = eventData.hoursLate || 0;
      if (conditions.hoursLate.min && hoursLate < conditions.hoursLate.min) return false;
      if (conditions.hoursLate.max && hoursLate > conditions.hoursLate.max) return false;
    }
    
    // Check streak length condition
    if (conditions.streakLength) {
      const streakLength = eventData.streakLength || 0;
      if (conditions.streakLength.min && streakLength < conditions.streakLength.min) return false;
      if (conditions.streakLength.max && streakLength > conditions.streakLength.max) return false;
    }
    
    // Check parent rating condition
    if (conditions.parentRating) {
      const rating = eventData.parentRating || 5;
      if (conditions.parentRating.min && rating < conditions.parentRating.min) return false;
      if (conditions.parentRating.max && rating > conditions.parentRating.max) return false;
    }
    
    // Check custom conditions
    if (conditions.custom && typeof conditions.custom === 'function') {
      return conditions.custom(eventData);
    }
    
    return true;
  }

  // Get severity information
  getSeverityInfo() {
    return PENALTY_CONFIG.SEVERITY[this.severity.toUpperCase()] || PENALTY_CONFIG.SEVERITY.MINOR;
  }

  // Calculate consequences based on severity
  calculateConsequences(baseEventData) {
    const consequences = { ...this.consequences };
    const severityInfo = this.getSeverityInfo();
    
    // Apply severity multiplier to numeric consequences
    if (consequences.xpDeduction) {
      consequences.xpDeduction = Math.floor(consequences.xpDeduction * severityInfo.multiplier);
    }
    
    if (consequences.cooldownHours) {
      consequences.cooldownHours = Math.floor(consequences.cooldownHours * severityInfo.multiplier);
    }
    
    return consequences;
  }

  // Convert to Firebase document
  toFirestore() {
    return {
      id: this.id,
      familyId: this.familyId,
      name: this.name,
      description: this.description,
      trigger: this.trigger,
      severity: this.severity,
      type: this.type,
      conditions: this.conditions,
      consequences: this.consequences,
      isActive: this.isActive,
      autoApply: this.autoApply,
      appealable: this.appealable,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from Firebase document
  static fromFirestore(data) {
    return new PenaltyRule(data);
  }

  // Validate penalty rule data
  static validate(data) {
    const errors = [];
    
    if (!data.name) errors.push('Penalty rule name is required');
    if (!data.trigger || !Object.values(PENALTY_CONFIG.TRIGGERS).includes(data.trigger)) {
      errors.push('Valid trigger is required');
    }
    if (!data.type || !Object.values(PENALTY_CONFIG.TYPES).includes(data.type)) {
      errors.push('Valid penalty type is required');
    }
    if (!data.severity || !Object.keys(PENALTY_CONFIG.SEVERITY).includes(data.severity.toUpperCase())) {
      errors.push('Valid severity level is required');
    }
    if (!data.consequences || Object.keys(data.consequences).length === 0) {
      errors.push('At least one consequence must be defined');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.familyId,
      name: this.name,
      description: this.description,
      trigger: this.trigger,
      severity: this.severity,
      severityInfo: this.getSeverityInfo(),
      type: this.type,
      conditions: this.conditions,
      consequences: this.consequences,
      isActive: this.isActive,
      autoApply: this.autoApply,
      appealable: this.appealable,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Applied penalty instance class
export class AppliedPenalty {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.familyId = data.familyId;
    this.userId = data.userId;
    this.ruleId = data.ruleId;
    this.ruleName = data.ruleName;
    this.trigger = data.trigger;
    this.severity = data.severity;
    this.type = data.type;
    this.consequences = data.consequences || {};
    this.status = data.status || PENALTY_CONFIG.STATUS.ACTIVE;
    this.appliedAt = data.appliedAt || serverTimestamp();
    this.appliedBy = data.appliedBy;
    this.expiresAt = data.expiresAt || null;
    this.completedAt = data.completedAt || null;
    this.appealedAt = data.appealedAt || null;
    this.appealReason = data.appealReason || null;
    this.appealStatus = data.appealStatus || null;
    this.eventData = data.eventData || {};
    this.notes = data.notes || '';
  }

  generateId() {
    return `applied_penalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if penalty is currently active
  isActive() {
    if (this.status !== PENALTY_CONFIG.STATUS.ACTIVE) return false;
    if (this.expiresAt && new Date() > this.expiresAt.toDate()) {
      this.expire();
      return false;
    }
    return true;
  }

  // Check if penalty can be appealed
  canAppeal() {
    if (!this.appealable || this.appealedAt) return false;
    if (this.status !== PENALTY_CONFIG.STATUS.ACTIVE) return false;
    
    const appealWindow = PENALTY_CONFIG.APPEAL_WINDOW_HOURS * 60 * 60 * 1000;
    const appliedTime = this.appliedAt.toDate ? this.appliedAt.toDate() : new Date(this.appliedAt);
    const now = new Date();
    
    return (now - appliedTime) <= appealWindow;
  }

  // Apply the penalty consequences
  applyConsequences(userProfile) {
    const results = {
      xpDeducted: 0,
      streakBroken: false,
      privilegesLost: [],
      restrictionsApplied: [],
      cooldownApplied: false
    };
    
    const consequences = this.consequences;
    
    // Apply XP deduction
    if (consequences.xpDeduction) {
      results.xpDeducted = Math.min(consequences.xpDeduction, userProfile.totalXP);
    }
    
    // Apply XP reduction (percentage)
    if (consequences.xpReduction) {
      const reductionAmount = Math.floor(userProfile.recentXPEarned * consequences.xpReduction);
      results.xpDeducted = reductionAmount;
    }
    
    // Break streak
    if (consequences.streakBreak) {
      results.streakBroken = true;
    }
    
    // Apply restrictions
    if (consequences.restrictRewards) {
      results.restrictionsApplied.push('reward_redemption');
    }
    
    if (consequences.limitQuests) {
      results.restrictionsApplied.push('quest_acceptance');
    }
    
    // Apply cooldown
    if (consequences.cooldownHours) {
      this.expiresAt = new Date(Date.now() + consequences.cooldownHours * 60 * 60 * 1000);
      results.cooldownApplied = true;
    }
    
    // Remove privileges
    if (consequences.privilegesLost) {
      results.privilegesLost = consequences.privilegesLost;
    }
    
    return results;
  }

  // Complete the penalty
  complete(completedBy = null) {
    this.status = PENALTY_CONFIG.STATUS.COMPLETED;
    this.completedAt = serverTimestamp();
    if (completedBy) this.completedBy = completedBy;
    return this;
  }

  // Cancel the penalty
  cancel(cancelledBy, reason = '') {
    this.status = PENALTY_CONFIG.STATUS.CANCELLED;
    this.cancelledAt = serverTimestamp();
    this.cancelledBy = cancelledBy;
    this.cancellationReason = reason;
    return this;
  }

  // Expire the penalty
  expire() {
    this.status = PENALTY_CONFIG.STATUS.EXPIRED;
    this.completedAt = serverTimestamp();
    return this;
  }

  // Submit appeal
  submitAppeal(reason, submittedBy) {
    if (!this.canAppeal()) {
      throw new Error('Appeal window has expired or penalty is not appealable');
    }
    
    this.appealedAt = serverTimestamp();
    this.appealReason = reason;
    this.appealStatus = 'pending';
    this.appealSubmittedBy = submittedBy;
    return this;
  }

  // Process appeal
  processAppeal(decision, processedBy, notes = '') {
    if (!this.appealedAt) {
      throw new Error('No appeal has been submitted');
    }
    
    this.appealStatus = decision; // 'approved' or 'denied'
    this.appealProcessedAt = serverTimestamp();
    this.appealProcessedBy = processedBy;
    this.appealNotes = notes;
    
    if (decision === 'approved') {
      this.cancel(processedBy, 'Appeal approved');
    }
    
    return this;
  }

  // Convert to Firebase document
  toFirestore() {
    return {
      id: this.id,
      familyId: this.familyId,
      userId: this.userId,
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      trigger: this.trigger,
      severity: this.severity,
      type: this.type,
      consequences: this.consequences,
      status: this.status,
      appliedAt: this.appliedAt,
      appliedBy: this.appliedBy,
      expiresAt: this.expiresAt,
      completedAt: this.completedAt,
      appealedAt: this.appealedAt,
      appealReason: this.appealReason,
      appealStatus: this.appealStatus,
      eventData: this.eventData,
      notes: this.notes
    };
  }

  // Create from Firebase document
  static fromFirestore(data) {
    return new AppliedPenalty(data);
  }

  toJSON() {
    return {
      id: this.id,
      familyId: this.familyId,
      userId: this.userId,
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      trigger: this.trigger,
      severity: this.severity,
      type: this.type,
      consequences: this.consequences,
      status: this.status,
      isCurrentlyActive: this.isActive(),
      canAppeal: this.canAppeal(),
      appliedAt: this.appliedAt,
      appliedBy: this.appliedBy,
      expiresAt: this.expiresAt,
      completedAt: this.completedAt,
      appealedAt: this.appealedAt,
      appealReason: this.appealReason,
      appealStatus: this.appealStatus,
      eventData: this.eventData,
      notes: this.notes
    };
  }
}

// Check and apply penalties for an event
export const checkAndApplyPenalties = (eventData, penaltyRules, userId, familyId) => {
  const applicablePenalties = [];
  const appliedPenalties = [];
  
  penaltyRules.forEach(rule => {
    if (rule.trigger === eventData.trigger && rule.checkConditions(eventData)) {
      applicablePenalties.push(rule);
      
      if (rule.autoApply) {
        const appliedPenalty = new AppliedPenalty({
          familyId,
          userId,
          ruleId: rule.id,
          ruleName: rule.name,
          trigger: rule.trigger,
          severity: rule.severity,
          type: rule.type,
          consequences: rule.calculateConsequences(eventData),
          appliedBy: 'system',
          eventData
        });
        
        appliedPenalties.push(appliedPenalty);
      }
    }
  });
  
  return {
    applicablePenalties,
    appliedPenalties,
    requiresManualReview: applicablePenalties.some(rule => !rule.autoApply)
  };
};

// Get active penalties for a user
export const getActivePenalties = (appliedPenalties, userId = null) => {
  return appliedPenalties.filter(penalty => {
    if (userId && penalty.userId !== userId) return false;
    return penalty.isActive();
  });
};

// Calculate total penalty impact
export const calculatePenaltyImpact = (activePenalties) => {
  return activePenalties.reduce((impact, penalty) => {
    const consequences = penalty.consequences;
    
    if (consequences.xpDeduction) {
      impact.totalXPDeduction += consequences.xpDeduction;
    }
    
    if (consequences.xpReduction) {
      impact.xpReductionMultiplier = Math.min(impact.xpReductionMultiplier, 1 - consequences.xpReduction);
    }
    
    if (consequences.streakBreak) {
      impact.streakBroken = true;
    }
    
    if (consequences.restrictRewards) {
      impact.rewardsRestricted = true;
    }
    
    if (consequences.limitQuests) {
      impact.questsLimited = true;
    }
    
    if (consequences.privilegesLost) {
      impact.privilegesLost.push(...consequences.privilegesLost);
    }
    
    return impact;
  }, {
    totalXPDeduction: 0,
    xpReductionMultiplier: 1.0,
    streakBroken: false,
    rewardsRestricted: false,
    questsLimited: false,
    privilegesLost: []
  });
};

// Initialize default penalty rules for a family
export const initializeFamilyPenaltyRules = (familyId) => {
  return DEFAULT_PENALTY_RULES.map(ruleData => 
    new PenaltyRule({ ...ruleData, familyId })
  );
};

// Get penalty statistics
export const getPenaltyStats = (appliedPenalties, dateRange = null) => {
  let relevantPenalties = appliedPenalties;
  
  if (dateRange) {
    const { startDate, endDate } = dateRange;
    relevantPenalties = appliedPenalties.filter(penalty => {
      const appliedDate = penalty.appliedAt.toDate ? 
        penalty.appliedAt.toDate() : 
        new Date(penalty.appliedAt);
      return appliedDate >= startDate && appliedDate <= endDate;
    });
  }
  
  const statsByType = {};
  const statsBySeverity = {};
  const statsByTrigger = {};
  
  relevantPenalties.forEach(penalty => {
    // Count by type
    statsByType[penalty.type] = (statsByType[penalty.type] || 0) + 1;
    
    // Count by severity
    statsBySeverity[penalty.severity] = (statsBySeverity[penalty.severity] || 0) + 1;
    
    // Count by trigger
    statsByTrigger[penalty.trigger] = (statsByTrigger[penalty.trigger] || 0) + 1;
  });
  
  return {
    totalPenalties: relevantPenalties.length,
    activePenalties: relevantPenalties.filter(p => p.isActive()).length,
    completedPenalties: relevantPenalties.filter(p => p.status === PENALTY_CONFIG.STATUS.COMPLETED).length,
    cancelledPenalties: relevantPenalties.filter(p => p.status === PENALTY_CONFIG.STATUS.CANCELLED).length,
    appealedPenalties: relevantPenalties.filter(p => p.appealedAt).length,
    statsByType,
    statsBySeverity,
    statsByTrigger,
    totalXPDeducted: relevantPenalties.reduce((sum, p) => sum + (p.consequences.xpDeduction || 0), 0)
  };
};

// Format penalty for display
export const formatPenaltyConsequences = (consequences) => {
  const parts = [];
  
  if (consequences.xpDeduction) {
    parts.push(`-${consequences.xpDeduction} XP`);
  }
  
  if (consequences.xpReduction) {
    parts.push(`${Math.round(consequences.xpReduction * 100)}% XP reduction`);
  }
  
  if (consequences.streakBreak) {
    parts.push('Streak broken');
  }
  
  if (consequences.cooldownHours) {
    parts.push(`${consequences.cooldownHours}h cooldown`);
  }
  
  if (consequences.restrictRewards) {
    parts.push('Rewards restricted');
  }
  
  if (consequences.limitQuests) {
    parts.push('Quest limits applied');
  }
  
  return parts.join(', ') || 'No consequences';
};

// Export configuration and defaults
export const PenaltyConfig = {
  PENALTY_CONFIG,
  DEFAULT_PENALTY_RULES
};

export default {
  PenaltyRule,
  AppliedPenalty,
  checkAndApplyPenalties,
  getActivePenalties,
  calculatePenaltyImpact,
  initializeFamilyPenaltyRules,
  getPenaltyStats,
  formatPenaltyConsequences,
  PenaltyConfig
};