// Family goal model and tracker for KiddoQuest collaborative features

import { serverTimestamp } from 'firebase/firestore';

// Family goal configuration
const FAMILY_GOAL_CONFIG = {
  TYPES: {
    COLLECTIVE: 'collective',    // Everyone contributes to same goal
    INDIVIDUAL: 'individual',    // Each member has individual targets
    COMPETITIVE: 'competitive',  // Members compete against each other
    COOPERATIVE: 'cooperative'   // Members must work together
  },
  STATUS: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired'
  },
  METRICS: {
    QUEST_COUNT: 'quest_count',
    XP_TOTAL: 'xp_total',
    STREAK_DAYS: 'streak_days',
    BADGES_EARNED: 'badges_earned',
    CUSTOM: 'custom'
  },
  DIFFICULTY: {
    EASY: { name: 'Easy', multiplier: 1.0, color: '#4CAF50' },
    MEDIUM: { name: 'Medium', multiplier: 1.5, color: '#FF9800' },
    HARD: { name: 'Hard', multiplier: 2.0, color: '#F44336' },
    EPIC: { name: 'Epic', multiplier: 3.0, color: '#9C27B0' }
  },
  REWARDS: {
    FAMILY_ACTIVITY: 'family_activity',
    MOVIE_NIGHT: 'movie_night',
    SPECIAL_MEAL: 'special_meal',
    OUTING: 'outing',
    BONUS_XP: 'bonus_xp',
    CUSTOM: 'custom'
  },
  MAX_ACTIVE_GOALS: 3,
  DEFAULT_DURATION_DAYS: 7
};

// Family goal model class
export class FamilyGoal {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.familyId = data.familyId;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type || FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE;
    this.metric = data.metric || FAMILY_GOAL_CONFIG.METRICS.QUEST_COUNT;
    this.target = data.target || 0;
    this.difficulty = data.difficulty || 'medium';
    this.status = data.status || FAMILY_GOAL_CONFIG.STATUS.DRAFT;
    this.participants = data.participants || []; // Array of user IDs
    this.rewards = data.rewards || [];
    this.startDate = data.startDate || null;
    this.endDate = data.endDate || null;
    this.progress = data.progress || {};
    this.milestones = data.milestones || [];
    this.isRecurring = data.isRecurring || false;
    this.recurringPattern = data.recurringPattern || null;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || serverTimestamp();
    this.updatedAt = data.updatedAt || serverTimestamp();
    this.completedAt = data.completedAt || null;
    this.settings = data.settings || {};
  }

  generateId() {
    return `family_goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start the goal
  start() {
    if (this.status !== FAMILY_GOAL_CONFIG.STATUS.DRAFT) {
      throw new Error('Only draft goals can be started');
    }
    
    this.status = FAMILY_GOAL_CONFIG.STATUS.ACTIVE;
    this.startDate = new Date();
    
    // Set end date if not specified
    if (!this.endDate) {
      this.endDate = new Date();
      this.endDate.setDate(this.endDate.getDate() + FAMILY_GOAL_CONFIG.DEFAULT_DURATION_DAYS);
    }
    
    // Initialize progress tracking
    this.initializeProgress();
    this.updatedAt = serverTimestamp();
    
    return this;
  }

  // Initialize progress tracking based on goal type
  initializeProgress() {
    switch (this.type) {
      case FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE:
        this.progress = {
          total: 0,
          target: this.target,
          percentage: 0,
          contributions: {}
        };
        break;
        
      case FAMILY_GOAL_CONFIG.TYPES.INDIVIDUAL:
        this.progress = {
          individual: {},
          completed: 0,
          target: this.participants.length,
          percentage: 0
        };
        this.participants.forEach(userId => {
          this.progress.individual[userId] = {
            current: 0,
            target: this.target,
            completed: false
          };
        });
        break;
        
      case FAMILY_GOAL_CONFIG.TYPES.COMPETITIVE:
        this.progress = {
          leaderboard: [],
          individual: {},
          winner: null
        };
        this.participants.forEach(userId => {
          this.progress.individual[userId] = {
            current: 0,
            rank: 0
          };
        });
        break;
        
      case FAMILY_GOAL_CONFIG.TYPES.COOPERATIVE:
        this.progress = {
          phases: [],
          currentPhase: 0,
          totalPhases: this.milestones.length || 1,
          completed: false
        };
        break;
    }
  }

  // Update progress for a user
  updateProgress(userId, value, eventData = {}) {
    if (this.status !== FAMILY_GOAL_CONFIG.STATUS.ACTIVE) {
      return { updated: false, reason: 'Goal not active' };
    }
    
    if (!this.participants.includes(userId)) {
      return { updated: false, reason: 'User not a participant' };
    }
    
    if (this.isExpired()) {
      this.expire();
      return { updated: false, reason: 'Goal expired' };
    }
    
    const oldProgress = JSON.parse(JSON.stringify(this.progress));
    
    switch (this.type) {
      case FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE:
        this.updateCollectiveProgress(userId, value, eventData);
        break;
        
      case FAMILY_GOAL_CONFIG.TYPES.INDIVIDUAL:
        this.updateIndividualProgress(userId, value, eventData);
        break;
        
      case FAMILY_GOAL_CONFIG.TYPES.COMPETITIVE:
        this.updateCompetitiveProgress(userId, value, eventData);
        break;
        
      case FAMILY_GOAL_CONFIG.TYPES.COOPERATIVE:
        this.updateCooperativeProgress(userId, value, eventData);
        break;
    }
    
    this.updatedAt = serverTimestamp();
    
    // Check for completion
    const completionResult = this.checkCompletion();
    
    return {
      updated: true,
      oldProgress,
      newProgress: this.progress,
      milestoneReached: this.checkMilestoneReached(),
      goalCompleted: completionResult.completed,
      completionData: completionResult
    };
  }

  // Update collective goal progress
  updateCollectiveProgress(userId, value, eventData) {
    if (!this.progress.contributions[userId]) {
      this.progress.contributions[userId] = 0;
    }
    
    this.progress.contributions[userId] += value;
    this.progress.total = Object.values(this.progress.contributions).reduce((sum, val) => sum + val, 0);
    this.progress.percentage = Math.min(100, (this.progress.total / this.target) * 100);
  }

  // Update individual goal progress
  updateIndividualProgress(userId, value, eventData) {
    if (!this.progress.individual[userId]) {
      this.progress.individual[userId] = { current: 0, target: this.target, completed: false };
    }
    
    const userProgress = this.progress.individual[userId];
    userProgress.current += value;
    
    if (!userProgress.completed && userProgress.current >= userProgress.target) {
      userProgress.completed = true;
      this.progress.completed += 1;
    }
    
    this.progress.percentage = (this.progress.completed / this.target) * 100;
  }

  // Update competitive goal progress
  updateCompetitiveProgress(userId, value, eventData) {
    if (!this.progress.individual[userId]) {
      this.progress.individual[userId] = { current: 0, rank: 0 };
    }
    
    this.progress.individual[userId].current += value;
    
    // Update leaderboard
    this.progress.leaderboard = Object.entries(this.progress.individual)
      .map(([id, data]) => ({ userId: id, score: data.current }))
      .sort((a, b) => b.score - a.score);
    
    // Update ranks
    this.progress.leaderboard.forEach((entry, index) => {
      this.progress.individual[entry.userId].rank = index + 1;
    });
    
    // Check if goal target is reached
    const topScore = this.progress.leaderboard[0]?.score || 0;
    if (topScore >= this.target) {
      this.progress.winner = this.progress.leaderboard[0].userId;
    }
  }

  // Update cooperative goal progress
  updateCooperativeProgress(userId, value, eventData) {
    // Cooperative goals use phases/milestones
    const currentPhase = this.progress.currentPhase;
    if (currentPhase < this.milestones.length) {
      const milestone = this.milestones[currentPhase];
      milestone.progress = (milestone.progress || 0) + value;
      
      if (milestone.progress >= milestone.target) {
        milestone.completed = true;
        milestone.completedAt = new Date();
        this.progress.currentPhase += 1;
      }
    }
    
    this.progress.completed = this.progress.currentPhase >= this.progress.totalPhases;
  }

  // Check if milestone was reached
  checkMilestoneReached() {
    const milestones = this.milestones.filter(m => !m.notified);
    
    for (const milestone of milestones) {
      if (this.isMilestoneReached(milestone)) {
        milestone.notified = true;
        milestone.reachedAt = new Date();
        return milestone;
      }
    }
    
    return null;
  }

  // Check if specific milestone is reached
  isMilestoneReached(milestone) {
    switch (this.type) {
      case FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE:
        return this.progress.total >= milestone.threshold;
        
      case FAMILY_GOAL_CONFIG.TYPES.INDIVIDUAL:
        return this.progress.completed >= milestone.threshold;
        
      case FAMILY_GOAL_CONFIG.TYPES.COMPETITIVE:
        const topScore = this.progress.leaderboard[0]?.score || 0;
        return topScore >= milestone.threshold;
        
      case FAMILY_GOAL_CONFIG.TYPES.COOPERATIVE:
        return milestone.completed;
        
      default:
        return false;
    }
  }

  // Check for goal completion
  checkCompletion() {
    let completed = false;
    let completionData = {};
    
    switch (this.type) {
      case FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE:
        completed = this.progress.total >= this.target;
        if (completed) {
          completionData = {
            totalAchieved: this.progress.total,
            contributions: this.progress.contributions,
            topContributor: this.getTopContributor()
          };
        }
        break;
        
      case FAMILY_GOAL_CONFIG.TYPES.INDIVIDUAL:
        completed = this.progress.completed >= this.target;
        if (completed) {
          completionData = {
            completedMembers: this.progress.completed,
            individualResults: this.progress.individual
          };
        }
        break;
        
      case FAMILY_GOAL_CONFIG.TYPES.COMPETITIVE:
        completed = this.progress.winner !== null;
        if (completed) {
          completionData = {
            winner: this.progress.winner,
            leaderboard: this.progress.leaderboard,
            finalScores: this.progress.individual
          };
        }
        break;
        
      case FAMILY_GOAL_CONFIG.TYPES.COOPERATIVE:
        completed = this.progress.completed;
        if (completed) {
          completionData = {
            phasesCompleted: this.progress.currentPhase,
            milestones: this.milestones
          };
        }
        break;
    }
    
    if (completed && this.status === FAMILY_GOAL_CONFIG.STATUS.ACTIVE) {
      this.complete(completionData);
    }
    
    return { completed, completionData };
  }

  // Get top contributor for collective goals
  getTopContributor() {
    if (this.type !== FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE) return null;
    
    const contributions = this.progress.contributions;
    if (!contributions || Object.keys(contributions).length === 0) return null;
    
    return Object.entries(contributions).reduce((top, [userId, contribution]) => {
      return contribution > top.contribution ? { userId, contribution } : top;
    }, { userId: null, contribution: 0 });
  }

  // Check if goal is expired
  isExpired() {
    if (!this.endDate) return false;
    const endDate = this.endDate.toDate ? this.endDate.toDate() : new Date(this.endDate);
    return new Date() > endDate;
  }

  // Complete the goal
  complete(completionData = {}) {
    this.status = FAMILY_GOAL_CONFIG.STATUS.COMPLETED;
    this.completedAt = serverTimestamp();
    this.completionData = completionData;
    this.updatedAt = serverTimestamp();
    
    // Handle recurring goals
    if (this.isRecurring) {
      this.scheduleNextRecurrence();
    }
    
    return this;
  }

  // Expire the goal
  expire() {
    this.status = FAMILY_GOAL_CONFIG.STATUS.EXPIRED;
    this.updatedAt = serverTimestamp();
    return this;
  }

  // Cancel the goal
  cancel(reason = '', cancelledBy = null) {
    this.status = FAMILY_GOAL_CONFIG.STATUS.CANCELLED;
    this.cancellationReason = reason;
    this.cancelledBy = cancelledBy;
    this.cancelledAt = serverTimestamp();
    this.updatedAt = serverTimestamp();
    return this;
  }

  // Pause the goal
  pause(reason = '', pausedBy = null) {
    if (this.status !== FAMILY_GOAL_CONFIG.STATUS.ACTIVE) {
      throw new Error('Only active goals can be paused');
    }
    
    this.status = FAMILY_GOAL_CONFIG.STATUS.PAUSED;
    this.pauseReason = reason;
    this.pausedBy = pausedBy;
    this.pausedAt = serverTimestamp();
    this.updatedAt = serverTimestamp();
    return this;
  }

  // Resume paused goal
  resume(resumedBy = null) {
    if (this.status !== FAMILY_GOAL_CONFIG.STATUS.PAUSED) {
      throw new Error('Only paused goals can be resumed');
    }
    
    this.status = FAMILY_GOAL_CONFIG.STATUS.ACTIVE;
    this.resumedBy = resumedBy;
    this.resumedAt = serverTimestamp();
    this.updatedAt = serverTimestamp();
    return this;
  }

  // Schedule next recurrence
  scheduleNextRecurrence() {
    if (!this.isRecurring || !this.recurringPattern) return null;
    
    const pattern = this.recurringPattern;
    const nextGoal = new FamilyGoal({
      ...this.toJSON(),
      id: undefined, // Generate new ID
      status: FAMILY_GOAL_CONFIG.STATUS.DRAFT,
      startDate: null,
      endDate: null,
      progress: {},
      completedAt: null,
      createdAt: serverTimestamp()
    });
    
    // Calculate next start date based on pattern
    const now = new Date();
    switch (pattern.type) {
      case 'daily':
        nextGoal.startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextGoal.startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextGoal.startDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
    }
    
    if (nextGoal.startDate) {
      nextGoal.endDate = new Date(nextGoal.startDate.getTime() + 
        (pattern.durationDays || FAMILY_GOAL_CONFIG.DEFAULT_DURATION_DAYS) * 24 * 60 * 60 * 1000);
    }
    
    return nextGoal;
  }

  // Get difficulty information
  getDifficultyInfo() {
    return FAMILY_GOAL_CONFIG.DIFFICULTY[this.difficulty.toUpperCase()] || 
           FAMILY_GOAL_CONFIG.DIFFICULTY.MEDIUM;
  }

  // Calculate XP reward based on difficulty and completion
  calculateXPReward() {
    const difficultyInfo = this.getDifficultyInfo();
    const baseReward = 200; // Base XP for completing family goal
    const difficultyMultiplier = difficultyInfo.multiplier;
    
    let completionBonus = 1.0;
    
    // Bonus for different completion scenarios
    if (this.type === FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE && this.progress.percentage >= 100) {
      completionBonus = 1.2; // 20% bonus for collective achievement
    } else if (this.type === FAMILY_GOAL_CONFIG.TYPES.INDIVIDUAL && this.progress.completed === this.target) {
      completionBonus = 1.3; // 30% bonus for everyone completing individual goals
    }
    
    return Math.floor(baseReward * difficultyMultiplier * completionBonus);
  }

  // Convert to Firebase document
  toFirestore() {
    return {
      id: this.id,
      familyId: this.familyId,
      title: this.title,
      description: this.description,
      type: this.type,
      metric: this.metric,
      target: this.target,
      difficulty: this.difficulty,
      status: this.status,
      participants: this.participants,
      rewards: this.rewards,
      startDate: this.startDate,
      endDate: this.endDate,
      progress: this.progress,
      milestones: this.milestones,
      isRecurring: this.isRecurring,
      recurringPattern: this.recurringPattern,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      settings: this.settings
    };
  }

  // Create from Firebase document
  static fromFirestore(data) {
    return new FamilyGoal(data);
  }

  // Validate family goal data
  static validate(data) {
    const errors = [];
    
    if (!data.familyId) errors.push('Family ID is required');
    if (!data.title) errors.push('Goal title is required');
    if (!data.type || !Object.values(FAMILY_GOAL_CONFIG.TYPES).includes(data.type)) {
      errors.push('Valid goal type is required');
    }
    if (!data.metric || !Object.values(FAMILY_GOAL_CONFIG.METRICS).includes(data.metric)) {
      errors.push('Valid metric is required');
    }
    if (!data.target || data.target <= 0) {
      errors.push('Target must be greater than 0');
    }
    if (!data.participants || data.participants.length === 0) {
      errors.push('At least one participant is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    const completionResult = this.checkCompletion();
    
    return {
      id: this.id,
      familyId: this.familyId,
      title: this.title,
      description: this.description,
      type: this.type,
      metric: this.metric,
      target: this.target,
      difficulty: this.difficulty,
      difficultyInfo: this.getDifficultyInfo(),
      status: this.status,
      participants: this.participants,
      rewards: this.rewards,
      startDate: this.startDate,
      endDate: this.endDate,
      progress: this.progress,
      milestones: this.milestones,
      isRecurring: this.isRecurring,
      recurringPattern: this.recurringPattern,
      isExpired: this.isExpired(),
      isCompleted: completionResult.completed,
      completionData: completionResult.completionData,
      xpReward: this.calculateXPReward(),
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      settings: this.settings
    };
  }
}

// Create a new family goal
export const createFamilyGoal = (goalData, createdBy) => {
  const goal = new FamilyGoal({
    ...goalData,
    createdBy,
    status: FAMILY_GOAL_CONFIG.STATUS.DRAFT
  });
  
  return goal;
};

// Get active family goals
export const getActiveFamilyGoals = (goals) => {
  return goals.filter(goal => 
    goal.status === FAMILY_GOAL_CONFIG.STATUS.ACTIVE && 
    !goal.isExpired()
  );
};

// Get family goal statistics
export const getFamilyGoalStats = (goals, familyId) => {
  const familyGoals = goals.filter(goal => goal.familyId === familyId);
  
  const stats = {
    total: familyGoals.length,
    active: 0,
    completed: 0,
    cancelled: 0,
    expired: 0,
    byType: {},
    byDifficulty: {},
    completionRate: 0,
    averageDuration: 0
  };
  
  familyGoals.forEach(goal => {
    // Count by status
    switch (goal.status) {
      case FAMILY_GOAL_CONFIG.STATUS.ACTIVE:
        stats.active++;
        break;
      case FAMILY_GOAL_CONFIG.STATUS.COMPLETED:
        stats.completed++;
        break;
      case FAMILY_GOAL_CONFIG.STATUS.CANCELLED:
        stats.cancelled++;
        break;
      case FAMILY_GOAL_CONFIG.STATUS.EXPIRED:
        stats.expired++;
        break;
    }
    
    // Count by type
    stats.byType[goal.type] = (stats.byType[goal.type] || 0) + 1;
    
    // Count by difficulty
    stats.byDifficulty[goal.difficulty] = (stats.byDifficulty[goal.difficulty] || 0) + 1;
  });
  
  // Calculate completion rate
  const finishedGoals = stats.completed + stats.cancelled + stats.expired;
  stats.completionRate = finishedGoals > 0 ? (stats.completed / finishedGoals) * 100 : 0;
  
  // Calculate average duration
  const completedGoals = familyGoals.filter(g => g.status === FAMILY_GOAL_CONFIG.STATUS.COMPLETED);
  if (completedGoals.length > 0) {
    const totalDuration = completedGoals.reduce((sum, goal) => {
      if (goal.startDate && goal.completedAt) {
        const start = goal.startDate.toDate ? goal.startDate.toDate() : new Date(goal.startDate);
        const end = goal.completedAt.toDate ? goal.completedAt.toDate() : new Date(goal.completedAt);
        return sum + (end - start) / (1000 * 60 * 60 * 24); // Days
      }
      return sum;
    }, 0);
    stats.averageDuration = totalDuration / completedGoals.length;
  }
  
  return stats;
};

// Check family goals for quest completion
export const checkFamilyGoalsForQuest = (goals, userId, questData) => {
  const activeGoals = getActiveFamilyGoals(goals).filter(goal => 
    goal.participants.includes(userId)
  );
  
  const updates = [];
  
  activeGoals.forEach(goal => {
    let shouldUpdate = false;
    let updateValue = 0;
    
    switch (goal.metric) {
      case FAMILY_GOAL_CONFIG.METRICS.QUEST_COUNT:
        shouldUpdate = true;
        updateValue = 1;
        break;
        
      case FAMILY_GOAL_CONFIG.METRICS.XP_TOTAL:
        shouldUpdate = true;
        updateValue = questData.xpEarned || 0;
        break;
        
      case FAMILY_GOAL_CONFIG.METRICS.BADGES_EARNED:
        shouldUpdate = questData.badgesEarned && questData.badgesEarned.length > 0;
        updateValue = questData.badgesEarned ? questData.badgesEarned.length : 0;
        break;
        
      case FAMILY_GOAL_CONFIG.METRICS.CUSTOM:
        // Custom logic would go here
        break;
    }
    
    if (shouldUpdate) {
      const result = goal.updateProgress(userId, updateValue, questData);
      if (result.updated) {
        updates.push({
          goalId: goal.id,
          goal,
          ...result
        });
      }
    }
  });
  
  return updates;
};

// Format family goal progress for display
export const formatFamilyGoalProgress = (goal) => {
  switch (goal.type) {
    case FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE:
      return `${goal.progress.total}/${goal.target} (${Math.round(goal.progress.percentage)}%)`;
      
    case FAMILY_GOAL_CONFIG.TYPES.INDIVIDUAL:
      return `${goal.progress.completed}/${goal.target} members completed`;
      
    case FAMILY_GOAL_CONFIG.TYPES.COMPETITIVE:
      const leader = goal.progress.leaderboard[0];
      return leader ? 
        `Leader: ${leader.score}/${goal.target}` : 
        `Target: ${goal.target}`;
        
    case FAMILY_GOAL_CONFIG.TYPES.COOPERATIVE:
      return `Phase ${goal.progress.currentPhase + 1}/${goal.progress.totalPhases}`;
      
    default:
      return 'In progress';
  }
};

// Get suggested family goals based on family activity
export const getSuggestedFamilyGoals = (familyStats, participants) => {
  const suggestions = [];
  
  // Suggest based on current activity level
  if (familyStats.averageQuestsPerDay < 2) {
    suggestions.push({
      title: 'Family Quest Challenge',
      description: 'Complete 20 quests together as a family',
      type: FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE,
      metric: FAMILY_GOAL_CONFIG.METRICS.QUEST_COUNT,
      target: 20,
      difficulty: 'easy',
      participants
    });
  }
  
  if (familyStats.totalXP < 5000) {
    suggestions.push({
      title: 'XP Milestone',
      description: 'Earn 2,000 XP together this week',
      type: FAMILY_GOAL_CONFIG.TYPES.COLLECTIVE,
      metric: FAMILY_GOAL_CONFIG.METRICS.XP_TOTAL,
      target: 2000,
      difficulty: 'medium',
      participants
    });
  }
  
  // Suggest competitive goals for active families
  if (participants.length > 1 && familyStats.averageQuestsPerDay >= 2) {
    suggestions.push({
      title: 'Quest Competition',
      description: 'See who can complete the most quests this week',
      type: FAMILY_GOAL_CONFIG.TYPES.COMPETITIVE,
      metric: FAMILY_GOAL_CONFIG.METRICS.QUEST_COUNT,
      target: 10,
      difficulty: 'medium',
      participants
    });
  }
  
  return suggestions;
};

// Export configuration
export const FamilyGoalConfig = {
  FAMILY_GOAL_CONFIG
};

export default {
  FamilyGoal,
  createFamilyGoal,
  getActiveFamilyGoals,
  getFamilyGoalStats,
  checkFamilyGoalsForQuest,
  formatFamilyGoalProgress,
  getSuggestedFamilyGoals,
  FamilyGoalConfig
};